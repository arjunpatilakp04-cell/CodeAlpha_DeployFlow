import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { ok, fail } from '../utils/respond';

const router = Router();
router.use(requireAuth);

router.get('/project/:projectId', async (req, res) => {
  const status = req.query.status as string | undefined;
  const builds = await prisma.build.findMany({
    where: {
      projectId: req.params.projectId,
      ...(status ? { status: status.toUpperCase() as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, builds);
});

router.get('/:id', async (req, res) => {
  const build = await prisma.build.findUnique({
    where: { id: req.params.id },
    include: { pipelineRun: { include: { stages: { include: { logs: true } } } } },
  });
  if (!build) return fail(res, 'Build not found', 404);
  return ok(res, build);
});

export default router;
