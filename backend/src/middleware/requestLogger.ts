import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Assign or preserve correlation ID
  const requestId = (req.headers['x-request-id'] as string) || `req_${crypto.randomBytes(12).toString('hex')}`;
  res.setHeader('X-Request-Id', requestId);
  (req as any).requestId = requestId;

  // Log on response finish
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const storeId = res.locals?.storeId || res.locals?.store?.id || req.headers['x-store-hostname'] || '-';
    const userId = res.locals?.user?.id || '-';

    // Structured log format
    const logData = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      storeId,
      userId,
      ip: req.ip || req.headers['x-forwarded-for'] || '-',
    };

    // Ignore health check spam in development logs if 200
    if ((req.path === '/api/health' || req.path === '/api/health/ready') && res.statusCode === 200) {
      return;
    }

    if (res.statusCode >= 500) {
      console.error(`[HTTP] ${JSON.stringify(logData)}`);
    } else if (res.statusCode >= 400) {
      console.warn(`[HTTP] ${JSON.stringify(logData)}`);
    } else {
      console.log(`[HTTP] ${JSON.stringify(logData)}`);
    }
  });

  next();
}
