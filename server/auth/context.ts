import type { Request, Response, NextFunction } from 'express';

export type AuthContext = {
  userId: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Authentication adapter boundary.
 * A real identity provider should populate req.auth before this middleware runs.
 * Development headers are intentionally opt-in and disabled by default.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.auth.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.auth.roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}
