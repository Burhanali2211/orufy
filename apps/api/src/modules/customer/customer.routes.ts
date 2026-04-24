import { Hono } from 'hono'
import { z } from 'zod'
import { Variables } from '../../types/context'
import { db, users } from '../../lib/db'
import { eq } from 'drizzle-orm'
import { auth } from '../../lib/auth'

const router = new Hono<{ Variables: Variables }>()

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currentPassword: z.string().min(8).optional(),
  newPassword: z.string().min(8).optional(),
}).refine(
  (d) => !(d.newPassword && !d.currentPassword),
  { message: 'currentPassword is required when setting a newPassword', path: ['currentPassword'] }
)

// ─── GET /api/dashboard/customer/profile ─────────────────────────────────────

router.get('/profile', async (c) => {
  try {
    const ctxUser = c.get('user')!

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, ctxUser.id))
      .limit(1)

    if (!user) return c.json({ error: 'User not found' }, 404)

    return c.json({ data: user })
  } catch (err) {
    throw err
  }
})

// ─── PATCH /api/dashboard/customer/profile ───────────────────────────────────

router.patch('/profile', async (c) => {
  try {
    const ctxUser = c.get('user')!
    const body = await c.req.json()

    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    }

    const { name, currentPassword, newPassword } = parsed.data

    // Handle password change via Better Auth
    if (newPassword && currentPassword) {
      await auth.api.changePassword({
        body: { currentPassword, newPassword, revokeOtherSessions: false },
        headers: c.req.raw.headers,
      })
    }

    // Handle name update
    if (name !== undefined) {
      await db
        .update(users)
        .set({ name, updatedAt: new Date() })
        .where(eq(users.id, ctxUser.id))
    }

    const [updated] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, ctxUser.id))
      .limit(1)

    return c.json({ data: updated })
  } catch (err) {
    // Better Auth throws on wrong password — surface as 400
    if (err instanceof Error && err.message.toLowerCase().includes('password')) {
      return c.json({ error: err.message }, 400)
    }
    throw err
  }
})

export const customerRoutes = router
