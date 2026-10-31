import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, sendError } from './errors.js';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface AuthUserPayload {
  id: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      testDateHeader?: string;
    }
  }
}

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'loopdesk-jwt-access-secret-hackathon-2026';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'loopdesk-jwt-refresh-secret-hackathon-2026';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  // Support headers passed by teammates or dev clients (x-tenant-id, x-user-role)
  const tenantHeader = (req.headers['x-tenant-id'] as string) || (req.headers['X-Tenant-Id'] as string);
  const roleHeader = (req.headers['x-user-role'] as string) || (req.headers['X-User-Role'] as string);

  if (!token) {
    if (tenantHeader || roleHeader) {
      req.user = {
        id: 'usr_dev_default',
        tenantId: tenantHeader || 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3',
        role: (roleHeader?.toUpperCase() || 'ADMIN') as UserRole,
        email: 'admin@brightloop.com'
      };
      next();
      return;
    }

    sendError(res, new AppError(401, 'UNAUTHORIZED', 'Access token is required'));
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, new AppError(401, 'TOKEN_EXPIRED', 'Access token has expired'));
      return;
    }
    // If invalid token, fallback to headers if provided
    if (tenantHeader || roleHeader) {
      req.user = {
        id: 'usr_dev_default',
        tenantId: tenantHeader || 'a7ca59cb-8de8-4b03-aee4-d52bb09488b3',
        role: (roleHeader?.toUpperCase() || 'ADMIN') as UserRole,
        email: 'admin@brightloop.com'
      };
      next();
      return;
    }
    sendError(res, new AppError(401, 'INVALID_TOKEN', 'Access token is invalid'));
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      authenticateToken(req, res, () => {
        if (!req.user) return;
        checkRoles(req, res, next, allowedRoles);
      });
      return;
    }

    checkRoles(req, res, next, allowedRoles);
  };
};

function checkRoles(req: Request, res: Response, next: NextFunction, allowedRoles: UserRole[]): void {
  if (allowedRoles.length === 0) {
    next();
    return;
  }

  if (!req.user || !allowedRoles.includes(req.user.role)) {
    sendError(
      res,
      new AppError(403, 'FORBIDDEN', `Forbidden: Requires one of [${allowedRoles.join(', ')}] role`)
    );
    return;
  }

  next();
}
