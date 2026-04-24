import { createMiddleware } from 'hono/factory'
import { Variables } from '../types/context'
import { env } from '../env'
import { db, tenants } from '../lib/db'
import { eq } from 'drizzle-orm'
import { redis } from '../lib/redis'
import { logger } from '../lib/logger'

/**
 * Invalidate tenant cache by slug
 */
export const invalidateTenantCache = async (slug: string): Promise<void> => {
  try {
    await redis.del(`tenant:slug:${slug}`)
  } catch (err) {
    logger.error({ err }, 'Failed to invalidate tenant cache:')
  }
}

/**
 * Middleware to resolve tenant from subdomain or custom domain
 */
export const resolveTenant = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const host = c.req.header('Host') || ''
  const path = c.req.path
  const tenantSlugOverride = c.req.header('X-Tenant-Slug')

  // 1. Special cases to SKIP resolution
  const skipResolution = 
    host === env.APP_DOMAIN ||
    host.startsWith('www.') ||
    host === 'localhost' ||
    /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host.split(':')[0]) || // IP address check
    path.startsWith('/auth') ||
    path.startsWith('/webhooks') ||
    path.startsWith('/health')

  if (skipResolution && !tenantSlugOverride) {
    return await next()
  }

  // 2. Extract subdomain
  let slug = tenantSlugOverride
  if (!slug) {
    const parts = host.split('.')
    if (parts.length >= 3) {
      slug = parts[0]
    }
  }

  if (!slug) {
    return await next()
  }

  try {
    // 3. Cache Check
    const cacheKey = `tenant:slug:${slug}`
    let tenant: any = null

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        tenant = JSON.parse(cached)
      }
    } catch (err) {
      logger.error({ err }, 'Redis cache error (resolveTenant):')
      // Catch silently, fall back to DB
    }

    // 4. DB Lookup
    if (!tenant) {
      const [result] = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
          plan: tenants.plan,
          status: tenants.status,
          settings: tenants.settings,
        })
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1)

      tenant = result || null

      if (tenant) {
        // 5. Cache for 300 seconds
        try {
          await redis.set(cacheKey, JSON.stringify(tenant), 'EX', 300)
        } catch (err) {
          logger.error({ err }, 'Redis set error (resolveTenant):')
        }
      }
    }

    // 6. Validations
    if (!tenant) {
      return c.json({ error: 'Store not found' }, 404)
    }

    if (tenant.status === 'suspended') {
      return c.json({ error: 'Store suspended' }, 403)
    }

    if (tenant.status === 'cancelled') {
      return c.json({ error: 'Store no longer active' }, 410)
    }

    // 7. Success
    c.set('tenant', tenant)
    await next()
  } catch (error) {
    logger.error({ error }, 'Tenant resolution internal error:')
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})
