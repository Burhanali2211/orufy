import { db, users, orders } from '../../lib/db'
import { eq, and, or, like, desc, count, sql } from 'drizzle-orm'
import { roleEnum } from '@saas/db'

export const usersService = {
  async getUsers(
    tenantId: string,
    filters: { search?: string; role?: string; status?: string },
    pagination: { page: number; limit: number }
  ) {
    const { page, limit } = pagination
    const { search, role, status } = filters
    const offset = (page - 1) * limit

    const conditions = [eq(users.tenantId, tenantId)]

    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )!
      )
    }

    if (role) {
      conditions.push(eq(users.role, role as any))
    }

    if (status) {
      conditions.push(eq(users.emailVerified, status === 'active'))
    }

    const where = and(...conditions)

    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(where)

    // Subquery for order stats
    const userStats = db
      .select({
        userId: orders.customerEmail, // Using customerEmail as a proxy if userId missing
        orderCount: count(orders.id).as('order_count'),
        totalSpent: sql<string>`sum(${orders.total})`.as('total_spent'),
      })
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .groupBy(orders.customerEmail)
      .as('user_stats')

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        full_name: users.name,
        role: users.role,
        email_verified: users.emailVerified,
        created_at: users.createdAt,
        order_count: sql<number>`coalesce(${userStats.orderCount}, 0)`,
        total_spent: sql<string>`coalesce(${userStats.totalSpent}, '0')`,
      })
      .from(users)
      .leftJoin(userStats, eq(users.email, userStats.userId))
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      data: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  },

  async updateUser(tenantId: string, userId: string, data: any) {
    const [updated] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .returning()
    
    return updated
  }
}
