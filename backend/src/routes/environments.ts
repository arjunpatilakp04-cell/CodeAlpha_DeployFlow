import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth, requireWriteAccess } from '../middleware/auth';
import { ok, fail } from '../utils/respond';

const router = Router();
router.use(requireAuth);

router.get('/project/:projectId', async (req, res) => {
  const environments = await prisma.environment.findMany({
    where: { projectId: req.params.projectId },
    include: {
      deployments: { orderBy: { createdAt: 'desc' }, take: 1 },
      healthChecks: { orderBy: { checkedAt: 'desc' }, take: 1 },
    },
  });
  return ok(res, environments);
});

router.patch('/:id', requireWriteAccess, async (req, res) => {
  const { autoDeploy, url } = req.body as { autoDeploy?: boolean; url?: string };
  const env = await prisma.environment.update({
    where: { id: req.params.id },
    data: { ...(autoDeploy !== undefined ? { autoDeploy } : {}), ...(url !== undefined ? { url } : {}) },
  });
  return ok(res, env);
});

export default router;
