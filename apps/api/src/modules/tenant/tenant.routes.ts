import { Hono } from 'hono'
import { Variables } from '../../types/context'
import { tenantService } from './tenant.service'
import { updateTenantSchema } from './tenant.schema'

const router = new Hono<{ Variables: Variables }>()

// ─── Dashboard: GET /api/dashboard/tenant ────────────────────────────────────

router.get('/', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const data = await tenantService.getTenantWithSubscription(tenant.id)
    return c.json({ data })
  } catch (err) {
    throw err
  }
})

// ─── Dashboard: PATCH /api/dashboard/tenant ──────────────────────────────────

router.patch('/', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const body = await c.req.json()

    const parsed = updateTenantSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    }

    const updated = await tenantService.updateTenant(tenant.id, tenant.slug, parsed.data)
    return c.json({ data: updated })
  } catch (err) {
    throw err
  }
})

// ─── Dashboard: custom domain management ─────────────────────────────────────

router.post('/domain', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const body = await c.req.json()
    const domain = typeof body?.domain === 'string' ? body.domain.trim() : ''

    if (!domain || domain.length < 3) {
      return c.json({ error: 'Invalid domain' }, 400)
    }

    const result = await tenantService.addCustomDomain(tenant.id, domain)
    return c.json(result)
  } catch (err) {
    throw err
  }
})

router.get('/domain', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const domains = await tenantService.getCustomDomains(tenant.id)
    return c.json({ data: domains })
  } catch (err) {
    throw err
  }
})

router.post('/domain/verify', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const body = await c.req.json()
    const domain = typeof body?.domain === 'string' ? body.domain.trim() : ''

    if (!domain) return c.json({ error: 'Domain required' }, 400)

    const result = await tenantService.verifyCustomDomain(tenant.id, domain)
    return c.json(result)
  } catch (err) {
    throw err
  }
})

router.delete('/domain', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const body = await c.req.json()
    const domain = typeof body?.domain === 'string' ? body.domain.trim() : ''

    if (!domain) return c.json({ error: 'Domain required' }, 400)

    await tenantService.deleteCustomDomain(tenant.id, domain)
    return c.json({ success: true })
  } catch (err) {
    throw err
  }
})

export const tenantRoutes = router
