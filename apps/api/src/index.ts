import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sql } from 'drizzle-orm'

import { env } from './env'
import { db } from './lib/db'
import { redis } from './lib/redis'
import { logger } from './lib/logger'

import { Variables } from './types/context'
import { errorHandler } from './middleware/error'
import { requestLogger } from './middleware/requestLogger'
import { requireAuth } from './middleware/auth'
import { resolveTenant } from './middleware/tenant'
import { rateLimitStrict, rateLimitModerate, rateLimitPublic } from './middleware/rateLimit'

import { auth } from './lib/auth'
import { authRoutes } from './modules/auth/auth.routes'
import { tenantRoutes } from './modules/tenant/tenant.routes'
import { shopSettingsRoutes } from './modules/tenant/shop.routes'
import { dashboardProductRoutes, shopProductRoutes } from './modules/product/product.routes'
import { dashboardOrderRoutes, shopOrderRoutes } from './modules/order/order.routes'
import { billingRoutes } from './modules/billing/billing.routes'
import storageRoutes from './modules/storage/storage.routes'
import { analyticsRoutes } from './modules/analytics/analytics.routes'
import { categoryRoutes, shopCategoryRoutes } from './modules/category/category.routes'
import { settingsRoutes } from './modules/settings/settings.routes'
import { customerRoutes } from './modules/customer/customer.routes'
import { usersRoutes } from './modules/users/users.routes'

// ─── App ──────────────────────────────────────────────────────────────────────

const app = new Hono<any>()

// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null
    if (origin === `https://${env.APP_DOMAIN}`) return origin
    if (origin.endsWith(`.${env.APP_DOMAIN}`)) return origin
    if (env.NODE_ENV === 'development' && origin.includes('localhost')) return origin
    return null
  },
  credentials: true,   // CRITICAL — cookies don't work without this
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// ─── Request logging ──────────────────────────────────────────────────────────

app.use('*', requestLogger)

// ─── Health checks (no auth, no rate limit) ───────────────────────────────────

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: process.env.npm_package_version ?? 'unknown',
  })
)

app.get('/health/db', async (c) => {
  const t = Date.now()
  try {
    await db.execute(sql`SELECT 1`)
    return c.json({ status: 'ok', latency: Date.now() - t })
  } catch (err) {
    return c.json({ status: 'error', message: String(err) }, 503)
  }
})

app.get('/health/redis', async (c) => {
  const t = Date.now()
  try {
    await redis.ping()
    return c.json({ status: 'ok', latency: Date.now() - t })
  } catch (err) {
    return c.json({ status: 'error', message: String(err) }, 503)
  }
})

// ─── Better Auth handler ──────────────────────────────────────────────────────

app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))

// ─── Auth API routes (strict rate limit) ─────────────────────────────────────

app.use('/api/auth/*', rateLimitStrict)
app.route('/api/auth', authRoutes)

// ─── Dashboard routes (auth + tenant + moderate rate limit) ───────────────────

const dashboard = new Hono<any>()
dashboard.use('*', rateLimitModerate)
dashboard.use('*', requireAuth)
dashboard.use('*', resolveTenant)

dashboard.route('/tenant',    tenantRoutes)
dashboard.route('/products',  dashboardProductRoutes)
dashboard.route('/categories', categoryRoutes)
dashboard.route('/orders',    dashboardOrderRoutes)
dashboard.route('/billing',   billingRoutes)
dashboard.route('/storage',   storageRoutes)
dashboard.route('/analytics', analyticsRoutes)
dashboard.route('/settings',  settingsRoutes)
dashboard.route('/customer',  customerRoutes)
dashboard.route('/users',     usersRoutes)

app.route('/api/dashboard', dashboard)

// ─── Public shop routes (tenant resolution + public rate limit) ───────────────

const shop = new Hono<any>()
shop.use('*', rateLimitPublic)
shop.use('*', resolveTenant)

shop.route('/products',   shopProductRoutes)
shop.route('/orders',     shopOrderRoutes)
shop.route('/categories', shopCategoryRoutes)
shop.route('/settings',   shopSettingsRoutes)

app.route('/api/shop', shop)

// ─── Webhooks (no rate limit — Razorpay needs reliable delivery) ──────────────

app.route('/webhooks/razorpay', billingRoutes)

// ─── Error handling ───────────────────────────────────────────────────────────

app.onError(errorHandler)

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutdown signal received — draining connections')
  try {
    await redis.quit()
    await (db as any).$client.end()
    logger.info('Graceful shutdown complete')
    process.exit(0)
  } catch (err) {
    logger.error({ err }, 'Error during shutdown — forcing exit')
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

export default app
