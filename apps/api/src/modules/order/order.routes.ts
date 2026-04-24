import { Hono } from 'hono'
import { Variables } from '../../types/context'
import { orderService } from './order.service'
import {
  createOrderSchema,
  orderStatusSchema,
  listOrdersQuerySchema,
} from './order.schema'

// ─── Dashboard routes (auth + tenant resolved by parent router) ───────────────

const dashboard = new Hono<{ Variables: Variables }>()

dashboard.get('/stats', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const stats = await orderService.getOrderStats(tenant.id)
    return c.json(stats)
  } catch (err) {
    throw err
  }
})

dashboard.get('/', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const raw = {
      page: c.req.query('page'),
      limit: c.req.query('limit'),
      search: c.req.query('search'),
      status: c.req.query('status'),
      paymentStatus: c.req.query('paymentStatus'),
    }

    const parsed = listOrdersQuerySchema.safeParse(raw)
    if (!parsed.success) {
      return c.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, 400)
    }

    const { page, limit } = parsed.data
    const result = await orderService.getOrders(tenant.id, parsed.data, { page, limit })
    return c.json(result)
  } catch (err) {
    throw err
  }
})

dashboard.get('/:id', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const id = c.req.param('id')

    const order = await orderService.getOrderById(tenant.id, id)
    if (!order) return c.json({ error: 'Order not found' }, 404)

    return c.json({ data: order })
  } catch (err) {
    throw err
  }
})

dashboard.patch('/:id/status', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const id = c.req.param('id')
    const body = await c.req.json()

    const parsed = orderStatusSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    }

    const order = await orderService.updateOrderStatus(tenant.id, id, parsed.data.status)
    if (!order) return c.json({ error: 'Order not found' }, 404)

    return c.json({ data: order })
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Cannot transition')) {
      return c.json({ error: err.message }, 422)
    }
    throw err
  }
})

// ─── Shop / storefront routes (tenant resolved by parent router) ──────────────

const shop = new Hono<{ Variables: Variables }>()

shop.post('/', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const body = await c.req.json()

    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    }

    const result = await orderService.createOrder(tenant.id, parsed.data)
    return c.json({ data: result }, 201)
  } catch (err) {
    if (err instanceof Error && (
      err.message.startsWith('Product ') ||
      err.message.startsWith('Insufficient stock')
    )) {
      return c.json({ error: err.message }, 400)
    }
    throw err
  }
})

shop.get('/:orderNumber', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const orderNumber = c.req.param('orderNumber')

    const order = await orderService.trackOrder(tenant.id, orderNumber)
    if (!order) return c.json({ error: 'Order not found' }, 404)

    return c.json({ data: order })
  } catch (err) {
    throw err
  }
})

export const dashboardOrderRoutes = dashboard
export const shopOrderRoutes = shop
