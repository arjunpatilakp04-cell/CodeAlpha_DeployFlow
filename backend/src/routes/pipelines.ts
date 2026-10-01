import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireWriteAccess, verifyToken, AuthedRequest } from '../middleware/auth';
import { ok, fail } from '../utils/respond';
import { executePipeline, STAGE_DEFINITIONS, pipelineEvents } from '../services/pipelineEngine';
import { recordActivity } from '../services/activity';

const router = Router();

/**
 * Live pipeline run updates over Server-Sent Events — replaces the old
 * frontend polling loop. Registered BEFORE `router.use(requireAuth)` below
 * because EventSource (the browser API that consumes SSE) cannot send
 * custom headers, so the token has to travel as a query param and gets
 * verified here instead of through the normal Authorization-header middleware.
 */
router.get('/runs/:id/stream', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const user = token && verifyToken(token);
  if (!user) return res.status(401).end();

  const runId = req.params.id;
  const exists = await prisma.pipelineRun.findUnique({ where: { id: runId }, select: { id: true } });
  if (!exists) return res.status(404).end();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();

  let closed = false;

  async function sendSnapshot() {
    if (closed) return;
    const run = await prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: { stages: { orderBy: { order: 'asc' }, include: { logs: { orderBy: { timestamp: 'asc' } } } } },
    });
    if (!run || closed) return;
    res.write(`data: ${JSON.stringify(run)}\n\n`);
    if (run.status !== 'RUNNING' && run.status !== 'WAITING') {
      res.write('event: done\ndata: {}\n\n');
      cleanup();
      res.end();
    }
  }

  function cleanup() {
    if (closed) return;
    closed = true;
    pipelineEvents.off(runId, sendSnapshot);
  }

  pipelineEvents.on(runId, sendSnapshot);
  req.on('close', cleanup);

  sendSnapshot();
});

router.use(requireAuth);

router.get('/project/:projectId/runs', async (req, res) => {
  const runs = await prisma.pipelineRun.findMany({
    where: { projectId: req.params.projectId },
    include: { stages: { orderBy: { order: 'asc' } } },
    orderBy: { startedAt: 'desc' },
    take: 25,
  });
  return ok(res, runs);
});

router.get('/runs/:id', async (req, res) => {
  const run = await prisma.pipelineRun.findUnique({
    where: { id: req.params.id },
    include: { stages: { orderBy: { order: 'asc' }, include: { logs: { orderBy: { timestamp: 'asc' } } } } },
  });
  if (!run) return fail(res, 'Pipeline run not found', 404);
  return ok(res, run);
});

const runSchema = z.object({
  environmentId: z.string(),
  commitSha: z.string().default(() => Math.random().toString(16).slice(2, 9)),
  commitMsg: z.string().default('Manual pipeline trigger'),
  branch: z.string().default('main'),
  author: z.string().default('demo-user'),
  forceFailAt: z.string().optional(), // demo-mode hook to showcase failure handling
});

router.post('/project/:projectId/run', requireWriteAccess, async (req: AuthedRequest, res) => {
  const parsed = runSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 'Invalid run payload', 422);
  const { environmentId, commitSha, commitMsg, branch, author, forceFailAt } = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project) return fail(res, 'Project not found', 404);

  const lastRun = await prisma.pipelineRun.findFirst({
    where: { projectId: project.id },
    orderBy: { number: 'desc' },
  });
  const number = (lastRun?.number ?? 0) + 1;

  const run = await prisma.pipelineRun.create({
    data: {
      number,
      commitSha,
      commitMsg,
      branch,
      author,
      status: 'WAITING',
      projectId: project.id,
      stages: {
        create: STAGE_DEFINITIONS.map((s, i) => ({ name: s.name, order: i, status: 'WAITING' })),
      },
    },
    include: { stages: true },
  });

  executePipeline({ pipelineRunId: run.id, projectId: project.id, environmentId, forceFailAt });
  await recordActivity(req.user!.id, 'Pipeline triggered', `${project.name} #${number}`);

  return ok(res, run, 201);
});

router.post('/runs/:id/retry', requireWriteAccess, async (req: AuthedRequest, res) => {
  const original = await prisma.pipelineRun.findUnique({
    where: { id: req.params.id },
    include: { deployment: true },
  });
  if (!original) return fail(res, 'Pipeline run not found', 404);

  const lastRun = await prisma.pipelineRun.findFirst({
    where: { projectId: original.projectId },
    orderBy: { number: 'desc' },
  });
  const number = (lastRun?.number ?? 0) + 1;

  const run = await prisma.pipelineRun.create({
    data: {
      number,
      commitSha: original.commitSha,
      commitMsg: `Retry of #${original.number}`,
      branch: original.branch,
      author: original.author,
      status: 'WAITING',
      projectId: original.projectId,
      stages: { create: STAGE_DEFINITIONS.map((s, i) => ({ name: s.name, order: i, status: 'WAITING' })) },
    },
    include: { stages: true },
  });

  const environmentId = original.deployment?.environmentId;
  if (!environmentId) return fail(res, 'Original run has no associated environment to redeploy to', 400);

  executePipeline({ pipelineRunId: run.id, projectId: original.projectId, environmentId });
  await recordActivity(req.user!.id, 'Pipeline retried', `Run #${original.number}`);

  return ok(res, run, 201);
});

export default router;
