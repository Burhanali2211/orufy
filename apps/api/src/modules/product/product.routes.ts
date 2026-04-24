import { Hono } from 'hono'
import { Variables } from '../../types/context'
import { deleteFile } from '../../lib/storage'
import { productService } from './product.service'
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  shopProductsQuerySchema,
} from './product.schema'

// ─── Dashboard routes (auth + tenant resolved by parent router) ───────────────

const dashboard = new Hono<{ Variables: Variables }>()

dashboard.get('/', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const raw = {
      page: c.req.query('page'),
      limit: c.req.query('limit'),
      search: c.req.query('search'),
      category: c.req.query('category'),
      isActive: c.req.query('isActive'),
    }

    const parsed = listProductsQuerySchema.safeParse(raw)
    if (!parsed.success) {
      return c.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, 400)
    }

    const { page, limit } = parsed.data
    const result = await productService.getProducts(tenant.id, parsed.data, { page, limit })
    return c.json(result)
  } catch (err) {
    throw err
  }
})

dashboard.get('/stats', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const stats = await productService.getProductStats(tenant.id)
    return c.json(stats)
  } catch (err) {
    throw err
  }
})

dashboard.get('/:id', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const id = c.req.param('id')

    const product = await productService.getProductById(tenant.id, id)
    if (!product) return c.json({ error: 'Product not found' }, 404)

    return c.json({ data: product })
  } catch (err) {
    throw err
  }
})

dashboard.post('/', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const body = await c.req.json()

    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    }

    const product = await productService.createProduct(tenant.id, parsed.data)
    return c.json({ data: product }, 201)
  } catch (err) {
    throw err
  }
})

dashboard.patch('/:id', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const id = c.req.param('id')
    const body = await c.req.json()

    const parsed = updateProductSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    }

    const product = await productService.updateProduct(tenant.id, id, parsed.data)
    if (!product) return c.json({ error: 'Product not found' }, 404)

    return c.json({ data: product })
  } catch (err) {
    throw err
  }
})

dashboard.delete('/:id', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const id = c.req.param('id')

    const existing = await productService.getProductById(tenant.id, id)
    if (!existing) return c.json({ error: 'Product not found' }, 404)

    const deleted = await productService.softDeleteProduct(tenant.id, id)
    if (!deleted) return c.json({ error: 'Product not found' }, 404)

    const imageUrls = (existing.imageUrls ?? []) as string[]
    await Promise.allSettled(
      imageUrls.map((url) => {
        try {
          const key = new URL(url).pathname.replace(/^\//, '')
          return deleteFile(key)
        } catch {
          return Promise.resolve()
        }
      })
    )

    return c.json({ success: true })
  } catch (err) {
    throw err
  }
})

// ─── Shop / storefront routes (tenant resolved by parent router) ──────────────

const shop = new Hono<{ Variables: Variables }>()

shop.get('/', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const raw = {
      page: c.req.query('page'),
      limit: c.req.query('limit'),
      search: c.req.query('search'),
      category: c.req.query('category'),
      minPrice: c.req.query('minPrice'),
      maxPrice: c.req.query('maxPrice'),
      sortBy: c.req.query('sortBy'),
    }

    const parsed = shopProductsQuerySchema.safeParse(raw)
    if (!parsed.success) {
      return c.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, 400)
    }

    const { page, limit } = parsed.data
    const result = await productService.getPublicProducts(tenant.id, parsed.data, { page, limit })
    return c.json(result)
  } catch (err) {
    throw err
  }
})

shop.get('/:id', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const id = c.req.param('id')

    const product = await productService.getPublicProductById(tenant.id, id)
    if (!product) return c.json({ error: 'Product not found' }, 404)

    return c.json({ data: product })
  } catch (err) {
    throw err
  }
})

export const dashboardProductRoutes = dashboard
export const shopProductRoutes = shop
