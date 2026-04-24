import { createMiddleware } from 'hono/factory'
import { Variables } from '../types/context'
import { redis } from '../lib/redis'
import { logger } from '../lib/logger'

interface RateLimitOptions {
  limit: number          // max requests
  windowSeconds: number  // sliding window size
  prefix: string         // key namespace, e.g. 'auth', 'dashboard', 'shop'
}

function makeRateLimiter(opts: RateLimitOptions) {
  return createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const ip =
      c.req.header('X-Real-IP') ??
      c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
      'unknown'

    // Bucket by minute so the window resets cleanly every 60s
    const minute = Math.floor(Date.now() / (opts.windowSeconds * 1000))
    const key = `ratelimit:${opts.prefix}:${ip}:${minute}`

    try {
      const current = await redis.incr(key)

      // Set TTL only on first increment so the key expires one window after creation
      if (current === 1) {
        await redis.expire(key, opts.windowSeconds * 2) // 2× window as safety margin
      }

      // Attach rate limit headers so clients can inspect their quota
      c.header('X-RateLimit-Limit', String(opts.limit))
      c.header('X-RateLimit-Remaining', String(Math.max(0, opts.limit - current)))

      if (current > opts.limit) {
        const retryAfter = opts.windowSeconds - (Math.floor(Date.now() / 1000) % opts.windowSeconds)
        c.header('Retry-After', String(retryAfter))
        c.header('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000 / opts.windowSeconds) * opts.windowSeconds))
        return c.json({ error: 'Too many requests', retryAfter }, 429)
      }
    } catch (err) {
      // Redis failure must never block the request — log and continue
      logger.error({ err, key }, 'Rate limit Redis error — allowing request')
    }

    await next()
  })
}

// 10 req / min — login, signup
export const rateLimitStrict = makeRateLimiter({
  limit: 10,
  windowSeconds: 60,
  prefix: 'auth',
})

// 60 req / min — authenticated dashboard routes
export const rateLimitModerate = makeRateLimiter({
  limit: 60,
  windowSeconds: 60,
  prefix: 'dashboard',
})

// 120 req / min — public storefront routes
export const rateLimitPublic = makeRateLimiter({
  limit: 120,
  windowSeconds: 60,
  prefix: 'shop',
})
