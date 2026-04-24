import { db, orders, products, orderTracking } from '../../lib/db'
import { eq, and, or, ilike, desc, inArray, sql, gte, count } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { CreateOrderInput, ListOrdersQuery } from './order.schema'

type OrderRow = InferSelectModel<typeof orders>
type ProductRow = InferSelectModel<typeof products>

export interface PaginatedOrders {
  data: OrderRow[]
  total: number
  page: number
  totalPages: number
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string | null
}

export interface PublicOrderTracking {
  orderNumber: string
  status: string
  items: Array<{ name: string; quantity: number }>
  shippingAddress: unknown
  createdAt: Date | null
  estimatedDelivery: string | null
}

export interface OrderStats {
  totalOrders: number
  pendingOrders: number
  ordersToday: number
  totalRevenue: number
  revenueToday: number
  avgOrderValue: number
  statusBreakdown: Record<string, number>
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: 'Your order has been confirmed and is being prepared.',
  processing: 'Your order is being packed and prepared for shipment.',
  shipped: 'Your order has been shipped and is on its way.',
  delivered: 'Your order has been delivered. Thank you for shopping with us!',
  cancelled: 'Your order has been cancelled.',
}

async function generateOrderNumber(tenantId: string, tx: typeof db): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `ORD-${year}-`

  const [last] = await tx
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(and(eq(orders.tenantId, tenantId), ilike(orders.orderNumber, `${prefix}%`)))
    .orderBy(desc(orders.orderNumber))
    .limit(1)

  let next = 1
  if (last) {
    const lastNum = parseInt(last.orderNumber.split('-')[2] ?? '0', 10)
    if (!isNaN(lastNum)) next = lastNum + 1
  }

  return `${prefix}${String(next).padStart(4, '0')}`
}

export const orderService = {
  async getOrders(
    tenantId: string,
    filters: ListOrdersQuery,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedOrders> {
    const { page, limit, search, status, paymentStatus } = filters
    const offset = (page - 1) * limit

    const conditions = [eq(orders.tenantId, tenantId)]

    if (search) {
      conditions.push(
        or(
          ilike(orders.customerName, `%${search}%`),
          ilike(orders.customerEmail, `%${search}%`),
          ilike(orders.orderNumber, `%${search}%`)
        )!
      )
    }

    if (status) {
      conditions.push(eq(orders.status, status))
    }

    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus))
    }

    const where = and(...conditions)

    const [{ total }] = await db
      .select({ total: count() })
      .from(orders)
      .where(where)

    const rows = await db
      .select({
        id: orders.id,
        tenantId: orders.tenantId,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        shippingAddress: orders.shippingAddress,
        items: orders.items,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        shippingFee: orders.shippingFee,
        discountAmount: orders.discountAmount,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        trackingNumber: orders.trackingNumber,
        razorpayOrderId: orders.razorpayOrderId,
        razorpayPaymentId: orders.razorpayPaymentId,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      data: rows as OrderRow[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getOrderById(tenantId: string, orderId: string): Promise<(OrderRow & { trackingEvents: unknown[] }) | null> {
    const [order] = await db
      .select({
        id: orders.id,
        tenantId: orders.tenantId,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        shippingAddress: orders.shippingAddress,
        items: orders.items,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        shippingFee: orders.shippingFee,
        discountAmount: orders.discountAmount,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        trackingNumber: orders.trackingNumber,
        razorpayOrderId: orders.razorpayOrderId,
        razorpayPaymentId: orders.razorpayPaymentId,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.id, orderId)))
      .limit(1)

    if (!order) return null

    const trackingEvents = await db
      .select({
        id: orderTracking.id,
        status: orderTracking.status,
        message: orderTracking.message,
        location: orderTracking.location,
        createdAt: orderTracking.createdAt,
      })
      .from(orderTracking)
      .where(eq(orderTracking.orderId, order.id))
      .orderBy(orderTracking.createdAt)

    return { ...(order as OrderRow), trackingEvents }
  },

  async updateOrderStatus(
    tenantId: string,
    orderId: string,
    newStatus: string
  ): Promise<OrderRow | null> {
    const existing = await orderService.getOrderById(tenantId, orderId)
    if (!existing) return null

    const currentStatus = existing.status ?? 'pending'
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []

    if (!allowed.includes(newStatus)) {
      throw new Error(`Cannot transition order from '${currentStatus}' to '${newStatus}'`)
    }

    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(orders)
        .set({ status: newStatus as OrderRow['status'], updatedAt: new Date() })
        .where(and(eq(orders.tenantId, tenantId), eq(orders.id, orderId)))
        .returning()

      await tx.insert(orderTracking).values({
        orderId: updated.id,
        status: newStatus,
        message: STATUS_MESSAGES[newStatus] ?? `Order status updated to ${newStatus}.`,
      })

      return updated as OrderRow
    })
  },

  async createOrder(tenantId: string, data: CreateOrderInput): Promise<{
    orderId: string
    orderNumber: string
    total: number
    razorpayOrderId: string | null
  }> {
    return await db.transaction(async (tx) => {
      const productIds = data.items.map((i) => i.productId)

      const fetchedProducts = await tx
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          stock: products.stock,
          imageUrls: products.imageUrls,
          isActive: products.isActive,
        })
        .from(products)
        .where(
          and(
            eq(products.tenantId, tenantId),
            eq(products.isActive, true),
            inArray(products.id, productIds)
          )
        )

      const productMap = new Map<string, typeof fetchedProducts[number]>()
      for (const p of fetchedProducts) productMap.set(p.id, p)

      // Verify all products exist and are active
      for (const item of data.items) {
        if (!productMap.has(item.productId)) {
          throw new Error(`Product ${item.productId} not found or unavailable`)
        }
      }

      // Verify stock
      for (const item of data.items) {
        const p = productMap.get(item.productId)!
        if (p.stock < item.quantity) {
          throw new Error(`Insufficient stock for product '${p.name}' (available: ${p.stock}, requested: ${item.quantity})`)
        }
      }

      // Build line items and calculate totals
      const lineItems: OrderItem[] = data.items.map((item) => {
        const p = productMap.get(item.productId)!
        const urls = (p.imageUrls ?? []) as string[]
        return {
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: item.quantity,
          imageUrl: urls[0] ?? null,
        }
      })

      const subtotal = lineItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      const shippingFee = 0
      const total = subtotal + shippingFee

      const orderNumber = await generateOrderNumber(tenantId, tx as unknown as typeof db)

      const [newOrder] = await tx
        .insert(orders)
        .values({
          tenantId,
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone ?? null,
          shippingAddress: data.shippingAddress,
          items: lineItems,
          subtotal,
          shippingFee,
          taxAmount: 0,
          discountAmount: 0,
          total,
          status: 'pending',
          paymentStatus: 'pending',
        })
        .returning({
          id: orders.id,
          orderNumber: orders.orderNumber,
          total: orders.total,
          razorpayOrderId: orders.razorpayOrderId,
        })

      // Decrement stock for each product
      for (const item of data.items) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
          .where(and(eq(products.tenantId, tenantId), eq(products.id, item.productId)))
      }

      return {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        total: newOrder.total,
        razorpayOrderId: newOrder.razorpayOrderId,
      }
    })
  },

  async trackOrder(tenantId: string, orderNumber: string): Promise<PublicOrderTracking | null> {
    const [order] = await db
      .select({
        orderNumber: orders.orderNumber,
        status: orders.status,
        items: orders.items,
        shippingAddress: orders.shippingAddress,
        createdAt: orders.createdAt,
        id: orders.id,
      })
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.orderNumber, orderNumber)))
      .limit(1)

    if (!order) return null

    const rawItems = (order.items ?? []) as OrderItem[]
    const publicItems = rawItems.map((i) => ({ name: i.name, quantity: i.quantity }))

    return {
      orderNumber: order.orderNumber,
      status: order.status ?? 'pending',
      items: publicItems,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      estimatedDelivery: null,
    }
  },

  async getOrderStats(tenantId: string): Promise<OrderStats> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      [totalResult],
      [pendingResult],
      [todayResult],
      [revenueResult],
      [todayRevenueResult],
      [paidResult],
    ] = await Promise.all([
      db.select({ v: count() }).from(orders).where(eq(orders.tenantId, tenantId)),
      db.select({ v: count() }).from(orders).where(and(eq(orders.tenantId, tenantId), eq(orders.status, 'pending'))),
      db.select({ v: count() }).from(orders).where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, today))),
      db.select({ v: sql<string>`coalesce(sum(total), 0)` }).from(orders).where(and(eq(orders.tenantId, tenantId), inArray(orders.status, ['delivered', 'shipped']))),
      db.select({ v: sql<string>`coalesce(sum(total), 0)` }).from(orders).where(and(eq(orders.tenantId, tenantId), inArray(orders.status, ['delivered', 'shipped']), gte(orders.createdAt, today))),
      db.select({ v: count(), s: sql<string>`coalesce(sum(total), 0)` }).from(orders).where(and(eq(orders.tenantId, tenantId), eq(orders.paymentStatus, 'paid'))),
    ])

    const statusRows = await db
      .select({ status: orders.status, v: count() })
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .groupBy(orders.status)

    const statusBreakdown: Record<string, number> = {}
    for (const r of statusRows) {
      if (r.status) statusBreakdown[r.status] = r.v
    }

    const paidCount = paidResult.v
    const paidSum = Number(paidResult.s)

    return {
      totalOrders: totalResult.v,
      pendingOrders: pendingResult.v,
      ordersToday: todayResult.v,
      totalRevenue: Number(revenueResult.v),
      revenueToday: Number(todayRevenueResult.v),
      avgOrderValue: paidCount > 0 ? paidSum / paidCount : 0,
      statusBreakdown,
    }
  },
}
