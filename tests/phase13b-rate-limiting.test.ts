import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRateLimiter } from '../backend/src/middleware/rateLimiter';

describe('Phase 13B — Abuse Prevention & Tenant-Aware Rate Limiting', () => {
  it('allows requests within limit and sets proper rate limit headers', () => {
    const limiter = createRateLimiter({
      windowMs: 10000,
      maxRequests: 3,
    });

    const req = { ip: '192.168.1.100', headers: {} } as any;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    // 1st request
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 3);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 2);

    // 2nd request
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 1);

    // 3rd request
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(3);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
  });

  it('rejects excessive requests with 429 Too Many Requests and Retry-After header', () => {
    const limiter = createRateLimiter({
      windowMs: 10000,
      maxRequests: 2,
      message: 'Rate limit exceeded for checkout',
    });

    const req = { ip: '10.0.0.5', headers: {} } as any;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    limiter(req, res, next); // 1
    limiter(req, res, next); // 2
    limiter(req, res, next); // 3 -> Exceeded!

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Rate limit exceeded for checkout',
        retryAfter: expect.any(Number),
      })
    );
  });

  it('isolates rate limit quotas per IP and store key generator', () => {
    const limiter = createRateLimiter({
      windowMs: 10000,
      maxRequests: 1,
      keyGenerator: (req) => `${req.ip}:${(req as any).storeId}`,
    });

    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    // Client on Store A
    const reqStoreA = { ip: '10.0.0.1', storeId: 'store_A', headers: {} } as any;
    limiter(reqStoreA, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Same client on Store B is NOT blocked by Store A quota
    const reqStoreB = { ip: '10.0.0.1', storeId: 'store_B', headers: {} } as any;
    limiter(reqStoreB, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
