import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { ok } from '../utils/respond';

const router = Router();
router.use(requireAuth);

router.get('/registry/project/:projectId', async (req, res) => {
  const images = await prisma.registryImage.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, images);
});

router.get('/health/project/:projectId', async (req, res) => {
  const checks = await prisma.healthCheck.findMany({
    where: { projectId: req.params.projectId },
    include: { environment: true },
    orderBy: { checkedAt: 'desc' },
    take: 20,
  });
  return ok(res, checks);
});

router.get('/activity', async (req: AuthedRequest, res) => {
  const events = await prisma.activityEvent.findMany({
    where: { user: { organizationId: req.user!.organizationId } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });
  return ok(res, events);
});

export default router;
