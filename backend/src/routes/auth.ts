import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db';
import { signToken, requireAuth, AuthedRequest } from '../middleware/auth';
import { ok, fail } from '../utils/respond';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  organizationName: z.string().min(1),
});

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 'Invalid signup payload', 422);
  const { name, email, password, organizationName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail(res, 'An account with this email already exists', 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const organization = await prisma.organization.create({ data: { name: organizationName } });
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'ADMIN', organizationId: organization.id },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role, organizationId: organization.id });
  return ok(res, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 201);
});

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 'Invalid login payload', 422);
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return fail(res, 'Invalid email or password', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return fail(res, 'Invalid email or password', 401);

  const token = signToken({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId });
  return ok(res, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return fail(res, 'User not found', 404);
  return ok(res, { id: user.id, name: user.name, email: user.email, role: user.role });
});

export default router;
