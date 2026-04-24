import { db, orders, products, users } from '../../lib/db'
import { eq, and, gte, sql, count, desc, inArray } from 'drizzle-orm'

export type AnalyticsPeriod = '7d' | '30d' | '90d'

function periodStart(period: AnalyticsPeriod): Date {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod
  summary: {
    totalOrders: number
    totalRevenue: number
    totalProducts: number
    lowStockCount: number
    totalUsers: number
    newUsersToday: number
    ordersToday: number
    revenueToday: number
    pendingOrders: number
  }
  ordersByStatus: { status: string; count: number }[]
  recentOrders: {
    id: string
    orderNumber: string
    customerName: string
    total: number
    status: string | null
    createdAt: Date | null
  }[]
  topProducts: { productId: string; name: string; orderCount: number; price: number; imageUrls: string[] }[]
  lowStockProducts: { id: string; name: string; stock: number; minStockLevel: number; imageUrls: string[] }[]
}

export const analyticsService = {
  async getSummary(tenantId: string, period: AnalyticsPeriod): Promise<AnalyticsSummary> {
    const start = periodStart(period)
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const [
      [{ totalOrders }],
      [{ totalRevenue }],
      [{ totalProducts }],
      [{ lowStockCount }],
      [{ totalUsers }],
      [{ newUsersToday }],
      [{ ordersToday }],
      [{ revenueToday }],
      [{ pendingOrders }],
      ordersByStatus,
      recentOrders,
      topProducts,
      lowStockProducts,
    ] = await Promise.all([
      // 1. Total orders in period
      db
        .select({ totalOrders: count() })
        .from(orders)
        .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, start))),

      // 2. Total Revenue (all time for tenant, paid/delivered/shipped)
      db
        .select({ totalRevenue: sql<string>`coalesce(sum(total), 0)` })
        .from(orders)
        .where(
          and(
            eq(orders.tenantId, tenantId),
            inArray(orders.status, ['delivered', 'shipped', 'confirmed'])
          )
        ),

      // 3. Active product count
      db
        .select({ totalProducts: count() })
        .from(products)
        .where(and(eq(products.tenantId, tenantId), eq(products.isActive, true))),

      // 4. Low stock count (stock <= 5, active)
      db
        .select({ lowStockCount: count() })
        .from(products)
        .where(
          and(
            eq(products.tenantId, tenantId),
            eq(products.isActive, true),
            sql`${products.stock} <= 5`
          )
        ),

      // 5. Total users
      db
        .select({ totalUsers: count() })
        .from(users)
        .where(eq(users.tenantId, tenantId)),

      // 6. New users today
      db
        .select({ newUsersToday: count() })
        .from(users)
        .where(and(eq(users.tenantId, tenantId), gte(users.createdAt, todayStart))),

      // 7. Orders today
      db
        .select({ ordersToday: count() })
        .from(orders)
        .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, todayStart))),

      // 8. Revenue today
      db
        .select({ revenueToday: sql<string>`coalesce(sum(total), 0)` })
        .from(orders)
        .where(
          and(
            eq(orders.tenantId, tenantId),
            gte(orders.createdAt, todayStart),
            inArray(orders.status, ['delivered', 'shipped', 'confirmed'])
          )
        ),

      // 9. Pending orders
      db
        .select({ pendingOrders: count() })
        .from(orders)
        .where(and(eq(orders.tenantId, tenantId), eq(orders.status, 'pending'))),

      // 10. Orders by status (all time for tenant, grouped)
      db
        .select({ status: orders.status, count: count() })
        .from(orders)
        .where(eq(orders.tenantId, tenantId))
        .groupBy(orders.status),

      // 11. Recent 5 orders
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: orders.customerName,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.tenantId, tenantId))
        .orderBy(desc(orders.createdAt))
        .limit(5),

      // 12. Top 5 products by order frequency via jsonb_array_elements
      db.execute(sql`
        SELECT
          item->>'productId' AS "productId",
          p.name,
          p.price,
          p.image_urls AS "imageUrls",
          COUNT(*)::int AS "orderCount"
        FROM orders o,
          jsonb_array_elements(o.items) AS item
        JOIN products p ON p.id = (item->>'productId')::uuid
        WHERE o.tenant_id = ${tenantId}::uuid
          AND o.created_at >= ${start}
        GROUP BY item->>'productId', p.name, p.price, p.image_urls
        ORDER BY "orderCount" DESC
        LIMIT 5
      `),

      // 13. Low stock products list
      db
        .select({
          id: products.id,
          name: products.name,
          stock: products.stock,
          imageUrls: products.imageUrls,
        })
        .from(products)
        .where(
          and(
            eq(products.tenantId, tenantId),
            eq(products.isActive, true),
            sql`${products.stock} <= 5`
          )
        )
        .limit(8),
    ])

    return {
      period,
      summary: {
        totalOrders,
        totalRevenue: Number(totalRevenue),
        totalProducts,
        lowStockCount,
        totalUsers,
        newUsersToday,
        ordersToday,
        revenueToday: Number(revenueToday),
        pendingOrders,
      },
      ordersByStatus: ordersByStatus.map((r) => ({
        status: r.status ?? 'unknown',
        count: r.count,
      })),
      recentOrders,
      topProducts: (topProducts as any[]).map(row => ({
        productId: row.productId,
        name: row.name,
        orderCount: row.orderCount,
        price: row.price,
        imageUrls: row.imageUrls || []
      })),
      lowStockProducts: lowStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        minStockLevel: 5,
        imageUrls: p.imageUrls as string[] || []
      })),
    }
  },
}
