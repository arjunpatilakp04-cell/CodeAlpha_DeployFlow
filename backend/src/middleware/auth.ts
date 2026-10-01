import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; role: string; organizationId: string };
}

export function signToken(payload: { id: string; email: string; role: string; organizationId: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies a raw token string (not from an Authorization header) and returns
 * its payload, or null if invalid/expired. Used by the SSE stream route,
 * since EventSource can't send custom headers and must pass the token as a
 * query param instead.
 */
export function verifyToken(token: string): AuthedRequest['user'] | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthedRequest['user'];
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthedRequest['user'];
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Viewers can read everything but must not mutate state. */
export function requireWriteAccess(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'VIEWER') {
    return res.status(403).json({ error: 'Viewer role does not have write access' });
  }
  next();
}
