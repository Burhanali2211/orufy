import { Hono } from 'hono'
import { Variables } from '../../types/context'
import { z } from 'zod'
import { db, socialMediaAccounts, siteSettings, policyPages,
  footerLinks, contactInformation, contactSubmissions } from '../../lib/db'
import { eq, and, inArray, not } from 'drizzle-orm'

const router = new Hono<any>()

// Helper to create basic CRUD routes for a given table
function createCrudRouter(tableSchema: any, validationSchema: any, updateSchema?: any) {
  const r = new Hono<any>()
  
  r.get('/', async (c) => {
    const tenant = c.get('tenant')
    const data = await db.select().from(tableSchema).where(eq(tableSchema.tenantId, tenant.id))
    return c.json(data)
  })

  r.get('/:id', async (c) => {
    const tenant = c.get('tenant')
    const id = c.req.param('id')
    const [data] = await db.select().from(tableSchema).where(and(eq(tableSchema.tenantId, tenant.id), eq(tableSchema.id, id)))
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
  })

  r.post('/', async (c) => {
    const tenant = c.get('tenant')
    const body = await c.req.json()
    // Transform camelCase keys to snake_case if necessary, or just rely on payload matching the schema
    const payload = { ...body, tenantId: tenant.id }
    const [data] = await db.insert(tableSchema).values(payload).returning()
    return c.json(data)
  })

  r.patch('/:id', async (c) => {
    const tenant = c.get('tenant')
    const id = c.req.param('id')
    const body = await c.req.json()
    const [data] = await db.update(tableSchema).set(body).where(and(eq(tableSchema.tenantId, tenant.id), eq(tableSchema.id, id))).returning()
    return c.json(data)
  })

  r.delete('/:id', async (c) => {
    const tenant = c.get('tenant')
    const id = c.req.param('id')
    await db.delete(tableSchema).where(and(eq(tableSchema.tenantId, tenant.id), eq(tableSchema.id, id)))
    return c.json({ success: true })
  })

  // Bulk delete support
  r.post('/bulk-delete', async (c) => {
    const tenant = c.get('tenant')
    const body = await c.req.json()
    if (!body.ids || !Array.isArray(body.ids)) return c.json({ error: 'ids array is required' }, 400)
    await db.delete(tableSchema).where(and(eq(tableSchema.tenantId, tenant.id), inArray(tableSchema.id, body.ids)))
    return c.json({ success: true })
  })

  return r
}

router.route('/social-media', createCrudRouter(socialMediaAccounts, z.any()))
router.route('/site', createCrudRouter(siteSettings, z.any()))
router.route('/policy-pages', createCrudRouter(policyPages, z.any()))
router.route('/footer-links', createCrudRouter(footerLinks, z.any()))
router.route('/contact-info', createCrudRouter(contactInformation, z.any()))
router.route('/contact-submissions', createCrudRouter(contactSubmissions, z.any()))

// Specific routes requiring complex logic
router.post('/contact-info/:id/primary', async (c) => {
  const tenant = c.get('tenant')
  const id = c.req.param('id')
  
  // Set others to false
  await db.update(contactInformation)
    .set({ isPrimary: false })
    .where(and(eq(contactInformation.tenantId, tenant.id), not(eq(contactInformation.id, id))))
    
  // Set current to true
  const [data] = await db.update(contactInformation)
    .set({ isPrimary: true })
    .where(and(eq(contactInformation.tenantId, tenant.id), eq(contactInformation.id, id)))
    .returning()
    
  return c.json(data)
})

export const settingsRoutes = router
