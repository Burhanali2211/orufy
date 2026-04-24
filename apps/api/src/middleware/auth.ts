import { createMiddleware } from 'hono/factory'
import { Variables } from '../types/context'
import { getSession } from '../lib/auth'
import { logger } from '../lib/logger'
import { db, tenants } from '../lib/db'
import { eq } from 'drizzle-orm'

/**
 * Middleware to require authentication
 * Blocks the request if no valid session is found
 */
export const requireAuth = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  try {
    const sessionData = await getSession(c)

    if (!sessionData) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { user, session } = sessionData

    // Fetch full tenant info to attach to context
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1)

    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404)
    }

    // Attach user and tenant to context
    c.set('user', {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role as any,
    })
    c.set('tenant', tenant)
    c.set('session', session.id)

    await next()
  } catch (error) {
    logger.error({ error }, 'Auth middleware error:')
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

/**
 * Middleware to optionally attach authentication
 * Does not block if no session is found, but attaches user/session if present
 */
export const optionalAuth = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  try {
    const sessionData = await getSession(c)

    if (sessionData) {
      const { user, session } = sessionData
      
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1)
      
      if (tenant) {
        c.set('user', {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role as any,
        })
        c.set('tenant', tenant)
        c.set('session', session.id)
      }
    }

    await next()
  } catch (error) {
    logger.debug({ error }, 'Optional auth error:')
    await next()
  }
})
