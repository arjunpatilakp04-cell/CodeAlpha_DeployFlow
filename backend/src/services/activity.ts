import { prisma } from '../db';

export async function recordActivity(userId: string, action: string, resource: string, result: 'success' | 'failure' = 'success') {
  await prisma.activityEvent.create({ data: { userId, action, resource, result } });
}
