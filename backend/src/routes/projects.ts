import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireWriteAccess, AuthedRequest } from '../middleware/auth';
import { ok, fail } from '../utils/respond';
import { recordActivity } from '../services/activity';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthedRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { organizationId: req.user!.organizationId },
    include: {
      environments: true,
      _count: { select: { pipelineRuns: true, deployments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, projects);
});

router.get('/:id', async (req: AuthedRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
    include: { environments: true },
  });
  if (!project) return fail(res, 'Project not found', 404);
  return ok(res, project);
});

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  repoOwner: z.string().min(1),
  repoName: z.string().min(1),
  defaultBranch: z.string().default('main'),
});

router.post('/', requireWriteAccess, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 'Invalid project payload', 422);

  const project = await prisma.project.create({
    data: { ...parsed.data, organizationId: req.user!.organizationId },
  });

  await prisma.environment.createMany({
    data: [
      { name: 'Development', type: 'DEVELOPMENT', branch: 'develop', projectId: project.id },
      { name: 'Staging', type: 'STAGING', branch: 'staging', projectId: project.id },
      { name: 'Production', type: 'PRODUCTION', branch: project.defaultBranch, projectId: project.id },
    ],
  });

  await recordActivity(req.user!.id, 'Project created', project.name);
  return ok(res, project, 201);
});

export default router;
