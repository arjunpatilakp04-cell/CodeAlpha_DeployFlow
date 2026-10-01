import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { ok } from '../utils/respond';

const router = Router();
router.use(requireAuth);

router.get('/project/:projectId', async (req, res) => {
  const { level, search } = req.query as { level?: string; search?: string };
  const page = parseInt((req.query.page as string) || '1', 10);
  const pageSize = 50;

  const logs = await prisma.logEntry.findMany({
    where: {
      pipelineStage: { pipelineRun: { projectId: req.params.projectId } },
      ...(level ? { level: level.toUpperCase() as any } : {}),
      ...(search ? { message: { contains: search } } : {}),
    },
    include: { pipelineStage: { include: { pipelineRun: true } } },
    orderBy: { timestamp: 'desc' },
    take: pageSize,
    skip: (page - 1) * pageSize,
  });

  return ok(res, logs);
});

export default router;
