import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken } from '../utils/auth';
import { createError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware - verifies JWT token
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      throw createError('Missing authentication token', 401, 'UNAUTHORIZED');
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (error: any) {
    next(createError(error.message, 401, 'UNAUTHORIZED'));
  }
}

/**
 * Authorization middleware - checks user role
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      return next(
        createError('Insufficient permissions', 403, 'FORBIDDEN')
      );
    }
    next();
  };
}

/**
 * Optional authentication - doesn't fail if token is missing
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req.headers.authorization);
    if (token) {
      const decoded = verifyToken(token);
      req.userId = decoded.userId;
      req.role = decoded.role;
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
  }
  next();
}

