import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, path } = req;

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - start;
    const status = res.statusCode;

    logger.request(method, path, status, duration);

    return originalSend.call(this, data);
  };

  next();
}

