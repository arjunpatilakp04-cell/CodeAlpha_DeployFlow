import { EventEmitter } from 'events';
import { prisma } from '../db';

/**
 * Fires once per state change for a given pipelineRunId, so the SSE stream
 * route (routes/pipelines.ts) can push a fresh snapshot to connected
 * clients instead of them polling. No payload is carried on the event
 * itself — listeners re-fetch the run from the DB, which keeps this engine
 * and the stream route from needing to agree on a shared shape.
 */
export const pipelineEvents = new EventEmitter();
pipelineEvents.setMaxListeners(0);

/**
 * DEMO MODE PIPELINE ENGINE
 * ---------------------------------------------------------------------------
 * This is explicitly a simulation: there is no real GitHub webhook, no real
 * Docker daemon, and no real Render API call behind it (see README "Live
 * Integration vs Demo Mode"). What IS real: stage-by-stage state transitions
 * happen asynchronously over actual wall-clock time, are persisted to the
 * database as they happen, and are readable by the frontend via polling —
 * exactly the shape a real orchestrator would have, just with simulated
 * work instead of an actual `docker build` / `render deploy` underneath.
 *
 * A pipeline can be told to fail at a specific stage (forceFailAt) so the
 * failure-handling, retry and rollback paths are exercised for real rather
 * than only having a "happy path" demo.
 */

export const STAGE_DEFINITIONS = [
  { name: 'Checkout Repository', minMs: 800, maxMs: 1800 },
  { name: 'Install Dependencies', minMs: 2000, maxMs: 4000 },
  { name: 'Lint', minMs: 1000, maxMs: 2000 },
  { name: 'Run Tests', minMs: 2500, maxMs: 5000 },
  { name: 'Build Application', minMs: 2000, maxMs: 4000 },
  { name: 'Build Docker Image', minMs: 3000, maxMs: 6000 },
  { name: 'Push to Registry', minMs: 1500, maxMs: 3000 },
  { name: 'Deploy to Render', minMs: 3000, maxMs: 5000 },
  { name: 'Health Check', minMs: 1000, maxMs: 2000 },
] as const;

function randMs(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min));
}

async function log(stageId: string, level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS', message: string) {
  await prisma.logEntry.create({
    data: { pipelineStageId: stageId, level, message, service: 'pipeline' },
  });
}

interface RunOptions {
  pipelineRunId: string;
  projectId: string;
  environmentId: string;
  forceFailAt?: string; // stage name to fail at, for demoing failure handling
}

/** Fires and forgets — the run progresses in the background; callers poll the DB for status. */
export async function executePipeline(opts: RunOptions) {
  runInBackground(opts).catch((err) => {
    console.error('Pipeline execution crashed:', err);
  });
}

async function runInBackground({ pipelineRunId, projectId, environmentId, forceFailAt }: RunOptions) {
  const stages = await prisma.pipelineStage.findMany({
    where: { pipelineRunId },
    orderBy: { order: 'asc' },
  });

  await prisma.pipelineRun.update({ where: { id: pipelineRunId }, data: { status: 'RUNNING' } });
  pipelineEvents.emit(pipelineRunId);

  let pipelineFailed = false;

  for (const stage of stages) {
    if (pipelineFailed) {
      await prisma.pipelineStage.update({ where: { id: stage.id }, data: { status: 'SKIPPED' } });
      pipelineEvents.emit(pipelineRunId);
      continue;
    }

    const startedAt = new Date();
    await prisma.pipelineStage.update({
      where: { id: stage.id },
      data: { status: 'RUNNING', startedAt },
    });
    await log(stage.id, 'INFO', `Starting: ${stage.name}`);
    pipelineEvents.emit(pipelineRunId);

    const def = STAGE_DEFINITIONS.find((d) => d.name === stage.name)!;
    const duration = randMs(def.minMs, def.maxMs);
    await new Promise((r) => setTimeout(r, duration));

    const shouldFail = forceFailAt && stage.name === forceFailAt;

    if (shouldFail) {
      const finishedAt = new Date();
      await log(stage.id, 'ERROR', `${stage.name} failed — non-zero exit code`);
      await prisma.pipelineStage.update({
        where: { id: stage.id },
        data: {
          status: 'FAILED',
          finishedAt,
          durationMs: duration,
          errorMessage: `${stage.name} exited with an error. See stage logs for details.`,
        },
      });
      pipelineFailed = true;
      pipelineEvents.emit(pipelineRunId);
      continue;
    }

    await log(stage.id, 'SUCCESS', `${stage.name} completed successfully`);
    await prisma.pipelineStage.update({
      where: { id: stage.id },
      data: { status: 'PASSED', finishedAt: new Date(), durationMs: duration },
    });
    pipelineEvents.emit(pipelineRunId);
  }

  await prisma.pipelineRun.update({
    where: { id: pipelineRunId },
    data: { status: pipelineFailed ? 'FAILED' : 'PASSED', finishedAt: new Date() },
  });
  // This is the event that lets the stream route close the connection — the
  // run's terminal status (PASSED/FAILED) is now set, so listeners re-fetch
  // one last time and end the stream.
  pipelineEvents.emit(pipelineRunId);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const run = await prisma.pipelineRun.findUnique({ where: { id: pipelineRunId } });
  if (!project || !run) return;

  if (pipelineFailed) {
    // Build and deployment records still get created so the failure is visible
    // in the Builds/Deployments pages, not silently hidden.
    await prisma.build.create({
      data: {
        number: run.number,
        commitSha: run.commitSha,
        branch: run.branch,
        author: run.author,
        trigger: run.trigger,
        status: 'FAILED',
        projectId,
        pipelineRunId,
      },
    });
    await prisma.deployment.create({
      data: {
        version: `v-${run.commitSha.slice(0, 7)}`,
        commitSha: run.commitSha,
        status: 'FAILED',
        projectId,
        environmentId,
        pipelineRunId,
      },
    });
    return;
  }

  const imageTag = `${project.repoName.toLowerCase()}:${run.commitSha.slice(0, 7)}`;
  await prisma.build.create({
    data: {
      number: run.number,
      commitSha: run.commitSha,
      branch: run.branch,
      author: run.author,
      trigger: run.trigger,
      status: 'PASSED',
      durationMs: run.finishedAt ? run.finishedAt.getTime() - run.startedAt.getTime() : null,
      imageTag,
      projectId,
      pipelineRunId,
    },
  });

  await prisma.registryImage.create({
    data: {
      repository: `ghcr.io/deployflow/${project.repoName.toLowerCase()}`,
      tag: run.commitSha.slice(0, 7),
      digest: `sha256:${run.commitSha}${'0'.repeat(50)}`.slice(0, 71),
      sizeMb: randMs(80, 220),
      projectId,
    },
  });

  const version = `v-${run.commitSha.slice(0, 7)}`;
  // Only one deployment per environment can be live; older ones become rollback targets.
  await prisma.deployment.updateMany({
    where: { environmentId, status: 'LIVE' },
    data: { status: 'SUPERSEDED' },
  });
  await prisma.deployment.create({
    data: {
      version,
      commitSha: run.commitSha,
      status: 'LIVE',
      durationMs: randMs(4000, 9000),
      projectId,
      environmentId,
      pipelineRunId,
    },
  });

  await prisma.environment.update({
    where: { id: environmentId },
    data: { currentVersion: version },
  });

  await prisma.healthCheck.create({
    data: {
      url: '/health',
      healthy: true,
      httpStatus: 200,
      responseTimeMs: randMs(40, 180),
      projectId,
      environmentId,
    },
  });
}
