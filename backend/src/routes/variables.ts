import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireWriteAccess, AuthedRequest } from '../middleware/auth';
import { ok, fail } from '../utils/respond';
import { recordActivity } from '../services/activity';

const router = Router();
router.use(requireAuth);

function mask(value: string) {
  return '•'.repeat(Math.min(value.length, 16));
}

router.get('/project/:projectId', async (req, res) => {
  const vars = await prisma.environmentVariable.findMany({ where: { projectId: req.params.projectId } });
  return ok(
    res,
    vars.map((v: any) => ({ ...v, value: v.isSecret ? mask(v.value) : v.value }))
  );
});

const createSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  isSecret: z.boolean().default(false),
  environmentId: z.string().optional(),
});

router.post('/project/:projectId', requireWriteAccess, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 'Invalid variable payload', 422);
  const created = await prisma.environmentVariable.create({
    data: { ...parsed.data, projectId: req.params.projectId },
  });
  await recordActivity(req.user!.id, 'Secret changed', created.key);
  return ok(res, { ...created, value: created.isSecret ? mask(created.value) : created.value }, 201);
});

router.get('/:id/reveal', requireWriteAccess, async (req: AuthedRequest, res) => {
  const variable = await prisma.environmentVariable.findUnique({ where: { id: req.params.id } });
  if (!variable) return fail(res, 'Variable not found', 404);
  await recordActivity(req.user!.id, 'Secret revealed', variable.key);
  return ok(res, { value: variable.value });
});

router.delete('/:id', requireWriteAccess, async (req: AuthedRequest, res) => {
  const variable = await prisma.environmentVariable.delete({ where: { id: req.params.id } });
  await recordActivity(req.user!.id, 'Secret deleted', variable.key);
  return ok(res, { deleted: true });
});

export default router;
