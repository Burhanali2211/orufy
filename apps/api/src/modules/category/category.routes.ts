import { Hono } from 'hono'
import { z } from 'zod'
import { Variables } from '../../types/context'
import { db, products, categories } from '../../lib/db'
import { eq, and, isNotNull, sql, count } from 'drizzle-orm'

// ─── Dashboard categories (requireAuth + resolveTenant via parent) ────────────

const dashboard = new Hono<{ Variables: Variables }>()

dashboard.get('/', async (c) => {
  try {
    const tenant = c.get('tenant')!

    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, tenant.id))
      .orderBy(categories.sortOrder)

    return c.json({ data: rows })
  } catch (err) {
    throw err
  }
})

dashboard.get('/:id', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const id = c.req.param('id')

    const [cat] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.tenantId, tenant.id), eq(categories.id, id)))
      .limit(1)

    if (!cat) return c.json({ error: 'Category not found' }, 404)
    return c.json({ data: cat })
  } catch (err) {
    throw err
  }
})

const categoryWriteSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

dashboard.post('/', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const body = await c.req.json()

    const parsed = categoryWriteSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    }

    const [cat] = await db
      .insert(categories)
      .values({
        tenantId: tenant.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        imageUrl: parsed.data.imageUrl ?? null,
        parentId: parsed.data.parentId ?? null,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      })
      .returning()

    return c.json({ data: cat }, 201)
  } catch (err) {
    throw err
  }
})

dashboard.patch('/:id', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const id = c.req.param('id')
    const body = await c.req.json()

    const parsed = categoryWriteSchema.partial().safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    }

    const [cat] = await db
      .update(categories)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(categories.tenantId, tenant.id), eq(categories.id, id)))
      .returning()

    if (!cat) return c.json({ error: 'Category not found' }, 404)
    return c.json({ data: cat })
  } catch (err) {
    throw err
  }
})

dashboard.delete('/:id', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const id = c.req.param('id')

    await db
      .delete(categories)
      .where(and(eq(categories.tenantId, tenant.id), eq(categories.id, id)))

    return c.json({ success: true })
  } catch (err) {
    throw err
  }
})

// ─── Shop categories (resolveTenant via parent) ───────────────────────────────

const shop = new Hono<{ Variables: Variables }>()

shop.get('/', async (c) => {
  try {
    const tenant = c.get('tenant')!

    const rows = await db
      .select({
        name: products.category,
        count: count(),
      })
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenant.id),
          eq(products.isActive, true),
          isNotNull(products.category)
        )
      )
      .groupBy(products.category)
      .orderBy(products.category)

    const data = rows.map((r) => ({ name: r.name as string, count: r.count }))
    return c.json({ data })
  } catch (err) {
    throw err
  }
})

export const categoryRoutes = dashboard
export const shopCategoryRoutes = shop
