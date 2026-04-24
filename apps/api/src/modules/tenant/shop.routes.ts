import { Hono } from 'hono'
import { Variables } from '../../types/context'

// ─── GET /api/shop/settings (resolveTenant via parent) ───────────────────────

const router = new Hono<{ Variables: Variables }>()

router.get('/', (c) => {
  try {
    const tenant = c.get('tenant')

    if (!tenant) return c.json({ error: 'Store not found' }, 404)

    return c.json({
      data: {
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        settings: (tenant as { settings?: unknown }).settings ?? {},
      },
    })
  } catch (err) {
    throw err
  }
})

export const shopSettingsRoutes = router
