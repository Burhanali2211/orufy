import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { rateLimitMonitor } from '../utils/rateLimitMonitor';
import { isServerless } from '../utils/serverless';

/**
 * Rate limiter configuration for production security
 * Prevents brute force attacks and API abuse
 */

// Helper function to get IP address for serverless environments
function getClientIp(req: Request): string {
  // In serverless/Netlify, IP might not be set directly
  // Try multiple headers that Netlify provides
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }
  
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  
  // Fallback to req.ip if available
  if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') {
    return req.ip;
  }
  
  // Last resort: use a default identifier
  return 'unknown';
}

// General API rate limiter - 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health check endpoint
  skip: (req: Request) => req.path === '/health',
  // CRITICAL: Use ipKeyGenerator helper for proper IPv6 support
  // Extract IP first, then normalize it with ipKeyGenerator
  keyGenerator: (req: Request) => {
    const ip = getClientIp(req);
    // ipKeyGenerator normalizes the IP (handles IPv6 subnets properly)
    return ipKeyGenerator(ip);
  },
  handler: (req: Request, res: Response) => {
    // Record violation
    const ip = getClientIp(req);
    rateLimitMonitor.recordViolation(
      ip,
      req.path,
      req.get('user-agent'),
      (req as any).userId
    );

    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000 / 60) + ' minutes'
    });
  },
  // Skip validation in serverless environments to avoid errors
  validate: !isServerless()
});

// Strict rate limiter for authentication endpoints - 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5'), // 5 login attempts per window
  message: {
    error: 'Too many login attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  // CRITICAL: Use ipKeyGenerator helper for proper IPv6 support
  keyGenerator: (req: Request) => {
    const ip = getClientIp(req);
    return ipKeyGenerator(ip);
  },
  handler: (req: Request, res: Response) => {
    // Record violation
    const ip = getClientIp(req);
    rateLimitMonitor.recordViolation(
      ip,
      req.path,
      req.get('user-agent'),
      (req as any).userId
    );

    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Your account has been temporarily locked due to too many failed login attempts. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    });
  },
  // Skip validation in serverless environments to avoid errors
  validate: !isServerless()
});

// Registration rate limiter - 3 attempts per hour
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_REGISTER_MAX || '3'), // 3 registration attempts per hour
  message: {
    error: 'Too many registration attempts from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // CRITICAL: Use ipKeyGenerator helper for proper IPv6 support
  keyGenerator: (req: Request) => {
    const ip = getClientIp(req);
    return ipKeyGenerator(ip);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many registration attempts',
      message: 'You have exceeded the registration limit. Please try again in 1 hour.',
      retryAfter: '1 hour'
    });
  },
  // Skip validation in serverless environments to avoid errors
  validate: !isServerless()
});

// Password reset rate limiter - 3 attempts per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    error: 'Too many password reset attempts from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // CRITICAL: Use ipKeyGenerator helper for proper IPv6 support
  keyGenerator: (req: Request) => {
    const ip = getClientIp(req);
    return ipKeyGenerator(ip);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many password reset attempts',
      message: 'You have exceeded the password reset limit. Please try again in 1 hour.',
      retryAfter: '1 hour'
    });
  },
  // Skip validation in serverless environments to avoid errors
  validate: !isServerless()
});

// Payment/Checkout rate limiter - 10 attempts per 15 minutes
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 checkout attempts per window
  message: {
    error: 'Too many checkout attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // CRITICAL: Use ipKeyGenerator helper for proper IPv6 support
  keyGenerator: (req: Request) => {
    const ip = getClientIp(req);
    return ipKeyGenerator(ip);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many checkout attempts',
      message: 'You have exceeded the checkout limit. Please contact support if you need assistance.',
      retryAfter: '15 minutes'
    });
  },
  // Skip validation in serverless environments to avoid errors
  validate: !isServerless()
});

// Admin operations rate limiter - 200 requests per 15 minutes (more lenient for admin)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: {
    error: 'Too many admin requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // CRITICAL: Use ipKeyGenerator helper for proper IPv6 support
  keyGenerator: (req: Request) => {
    const ip = getClientIp(req);
    return ipKeyGenerator(ip);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many admin requests',
      message: 'You have exceeded the admin request limit. Please try again later.',
      retryAfter: '15 minutes'
    });
  },
  // Skip validation in serverless environments to avoid errors
  validate: !isServerless()
});

// Webhook rate limiter - 100 requests per 15 minutes (for payment gateway webhooks)
export const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 webhook calls per window
  message: {
    error: 'Too many webhook requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // CRITICAL: Use ipKeyGenerator helper for proper IPv6 support
  keyGenerator: (req: Request) => {
    const ip = getClientIp(req);
    return ipKeyGenerator(ip);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many webhook requests',
      message: 'Webhook rate limit exceeded. Please contact support if this is a legitimate integration.',
      retryAfter: '15 minutes'
    });
  },
  // Skip validation in serverless environments to avoid errors
  validate: process.env.IS_SERVERLESS !== 'true' && process.env.NETLIFY !== 'true'
});

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // CRITICAL: Use ipKeyGenerator helper for proper IPv6 support
    keyGenerator: (req: Request) => {
      const ip = getClientIp(req);
      return ipKeyGenerator(ip);
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes'
      });
    },
    // Skip validation in serverless environments to avoid errors
    validate: process.env.IS_SERVERLESS !== 'true' && process.env.NETLIFY !== 'true'
  });
}

