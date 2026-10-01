import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth, requireWriteAccess, AuthedRequest } from '../middleware/auth';
import { ok, fail } from '../utils/respond';
import { recordActivity } from '../services/activity';

const router = Router();
router.use(requireAuth);

router.get('/project/:projectId', async (req, res) => {
  const deployments = await prisma.deployment.findMany({
    where: { projectId: req.params.projectId },
    include: { environment: true },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, deployments);
});

router.get('/:id', async (req, res) => {
  const deployment = await prisma.deployment.findUnique({
    where: { id: req.params.id },
    include: { environment: true, pipelineRun: true },
  });
  if (!deployment) return fail(res, 'Deployment not found', 404);
  return ok(res, deployment);
});

router.post('/:id/rollback', requireWriteAccess, async (req: AuthedRequest, res) => {
  const { targetDeploymentId } = req.body as { targetDeploymentId: string };
  const current = await prisma.deployment.findUnique({ where: { id: req.params.id } });
  const target = await prisma.deployment.findUnique({ where: { id: targetDeploymentId } });
  if (!current || !target) return fail(res, 'Deployment not found', 404);
  if (current.environmentId !== target.environmentId) {
    return fail(res, 'Target deployment is not in the same environment', 422);
  }

  await prisma.deployment.update({ where: { id: current.id }, data: { status: 'ROLLED_BACK' } });

  const rollback = await prisma.deployment.create({
    data: {
      version: target.version,
      commitSha: target.commitSha,
      status: 'LIVE',
      durationMs: 1200,
      projectId: current.projectId,
      environmentId: current.environmentId,
      rolledBackTo: target.version,
    },
  });

  await prisma.environment.update({
    where: { id: current.environmentId },
    data: { currentVersion: target.version },
  });

  await recordActivity(req.user!.id, 'Rollback performed', `${target.version} on environment`);
  return ok(res, rollback);
});

export default router;
