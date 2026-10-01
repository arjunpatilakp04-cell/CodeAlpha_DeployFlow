import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { STAGE_DEFINITIONS } from './services/pipelineEngine';

async function main() {
  console.log('Seeding DeployFlow demo data...');

  const org = await prisma.organization.create({ data: { name: 'Acme DevOps' } });

  const passwordHash = await bcrypt.hash('demo1234', 10);
  await prisma.user.create({
    data: {
      name: 'Demo Admin',
      email: 'demo@deployflow.dev',
      passwordHash,
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: 'CodeAlpha JavaGradleApp',
      description: 'Spring Boot + Gradle REST service with Postgres, Prometheus and Grafana.',
      repoOwner: 'arjunpatilakp04-cell',
      repoName: 'CodeAlpha_JavaGradleApp',
      defaultBranch: 'main',
      organizationId: org.id,
    },
  });

  const [dev, staging, production] = await Promise.all([
    prisma.environment.create({ data: { name: 'Development', type: 'DEVELOPMENT', branch: 'develop', projectId: project.id, autoDeploy: true } }),
    prisma.environment.create({ data: { name: 'Staging', type: 'STAGING', branch: 'staging', projectId: project.id, autoDeploy: true } }),
    prisma.environment.create({ data: { name: 'Production', type: 'PRODUCTION', branch: 'main', projectId: project.id, autoDeploy: false, currentVersion: 'v-8f92a1c' } }),
  ]);

  await prisma.environmentVariable.createMany({
    data: [
      { key: 'DATABASE_URL', value: 'postgres://demo:demo@localhost:5432/app', isSecret: true, projectId: project.id },
      { key: 'JWT_SECRET', value: 'super-secret-signing-key', isSecret: true, projectId: project.id },
      { key: 'NODE_ENV', value: 'production', isSecret: false, projectId: project.id },
    ],
  });

  // A completed, successful historical pipeline run so the app has real data on first load.
  const run = await prisma.pipelineRun.create({
    data: {
      number: 1,
      commitSha: '8f92a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
      commitMsg: 'Add Prometheus and Grafana monitoring stack',
      branch: 'main',
      author: 'arjunpatilakp04-cell',
      status: 'PASSED',
      finishedAt: new Date(),
      projectId: project.id,
      stages: {
        create: STAGE_DEFINITIONS.map((s, i) => ({
          name: s.name,
          order: i,
          status: 'PASSED',
          startedAt: new Date(Date.now() - (STAGE_DEFINITIONS.length - i) * 30000),
          finishedAt: new Date(Date.now() - (STAGE_DEFINITIONS.length - i - 1) * 30000),
          durationMs: 20000 + Math.round(Math.random() * 15000),
        })),
      },
    },
    include: { stages: true },
  });

  for (const stage of run.stages) {
    await prisma.logEntry.createMany({
      data: [
        { pipelineStageId: stage.id, level: 'INFO', message: `Starting: ${stage.name}` },
        { pipelineStageId: stage.id, level: 'SUCCESS', message: `${stage.name} completed successfully` },
      ],
    });
  }

  const build = await prisma.build.create({
    data: {
      number: 1,
      commitSha: run.commitSha,
      branch: 'main',
      author: run.author,
      status: 'PASSED',
      durationMs: 187000,
      imageTag: 'codealpha_javagradleapp:8f92a1c',
      projectId: project.id,
      pipelineRunId: run.id,
    },
  });

  await prisma.registryImage.create({
    data: {
      repository: 'ghcr.io/deployflow/codealpha_javagradleapp',
      tag: '8f92a1c',
      digest: 'sha256:8f92a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9000000000000000000000',
      sizeMb: 156,
      projectId: project.id,
    },
  });

  const deployment = await prisma.deployment.create({
    data: {
      version: 'v-8f92a1c',
      commitSha: run.commitSha,
      status: 'LIVE',
      durationMs: 6400,
      projectId: project.id,
      environmentId: production.id,
      pipelineRunId: run.id,
    },
  });

  await prisma.healthCheck.create({
    data: {
      url: '/health',
      healthy: true,
      httpStatus: 200,
      responseTimeMs: 84,
      projectId: project.id,
      environmentId: production.id,
    },
  });

  console.log('Seed complete.');
  console.log('Login with: demo@deployflow.dev / demo1234');
  console.log({ projectId: project.id, environments: { dev: dev.id, staging: staging.id, production: production.id }, buildId: build.id, deploymentId: deployment.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
