import { createMiddleware } from 'hono/factory'
import { Variables } from '../types/context'
import { logRequest } from '../lib/logger'

export const requestLogger = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const start = Date.now()

  await next()

  const user   = c.get('user')
  const tenant = c.get('tenant')

  logRequest({
    method:     c.req.method,
    path:       new URL(c.req.url).pathname,
    status:     c.res.status,
    duration:   Date.now() - start,
    tenantSlug: tenant?.slug ?? null,
    userId:     user?.id ?? null,
    ip:
      c.req.header('X-Real-IP') ??
      c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
      'unknown',
  })
})
