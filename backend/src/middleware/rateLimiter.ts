import { Request, Response, NextFunction } from 'express';

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => req.ip || req.headers['x-forwarded-for'] as string || 'global_ip',
  } = options;

  const hits = new Map<string, ClientRecord>();

  // Cleanup expired windows every 60s
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 60000);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = hits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        error: message,
        retryAfter: resetSeconds,
      });
    }

    next();
  };
}

// 1. Checkout Rate Limiter (IP + Store)
export const checkoutLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 15,
  message: 'Too many checkout attempts from this IP. Please wait a moment before trying again.',
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const store = (req as any).store?.id || (req as any).headers?.['x-store-hostname'] || 'default';
    return `checkout:${ip}:${store}`;
  },
});

// 2. Order Lookup Anti-Enumeration Limiter (IP + Store)
export const orderLookupLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  message: 'Too many order lookups from this IP. Please wait before searching again.',
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const store = (req as any).store?.id || (req as any).headers?.['x-store-hostname'] || 'default';
    return `lookup:${ip}:${store}`;
  },
});

// 3. Domain Search Limiter (IP)
export const domainSearchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Domain search rate limit reached. Please try again shortly.',
});

// 4. Authentication Limiter (IP)
export const authLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 15,
  message: 'Too many authentication attempts. Please try again in a few minutes.',
});
