import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

export const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 checkout requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many order requests, please try again shortly.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 uploads per 10 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Upload rate limit reached, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please slow down.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
