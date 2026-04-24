import { db, tenants, users, sessions, subscriptions } from '../../lib/db'
import { auth } from '../../lib/auth'
import { eq, and } from 'drizzle-orm'
import { logger } from '../../lib/logger'
import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a unique slug for a business name
 */
export const generateUniqueSlug = async (name: string): Promise<string> => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  let slug = baseSlug
  let count = 1
  
  while (true) {
    const existing = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1)
    if (existing.length === 0) break
    slug = `${baseSlug}-${count}`
    count++
  }
  
  return slug
}

export const authService = {
  /**
   * Multi-tenant signup
   */
  signUp: async (data: { email: string; password: string; name: string; shopName: string }) => {
    const { email, password, name, shopName } = data

    // 1. Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existingUser.length > 0) {
      throw new Error('Email already registered')
    }

    // 2. Generate slug
    const slug = await generateUniqueSlug(shopName)

    // 3. Use Better Auth's signUpEmail which handles password hashing + account creation
    //    We do this OUTSIDE the transaction because Better Auth manages its own DB writes.
    //    Then we create the tenant and link it.
    const userId = uuidv4()

    // Create tenant first
    const [tenant] = await db.insert(tenants).values({
      id: uuidv4(),
      name: shopName,
      slug,
      status: 'active',
      plan: 'basic',
    }).returning()

    // Create subscription placeholder
    await db.insert(subscriptions).values({
      id: uuidv4(),
      tenantId: tenant.id,
      razorpaySubscriptionId: `sub_placeholder_${uuidv4()}`,
      razorpayPlanId: 'plan_basic',
      plan: 'basic',
      status: 'created',
    })

    try {
      // Let Better Auth create the user+account (it hashes the password internally)
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          tenantId: tenant.id,
          role: 'owner',
        }
      })

      return {
        user: result.user,
        tenant,
      }
    } catch (error: any) {
      // Rollback manually — delete the tenant we just created
      await db.delete(tenants).where(eq(tenants.id, tenant.id))
      logger.error('Signup failed — tenant rolled back:', error)
      throw error
    }
  },

  /**
   * Login logic
   */
  login: async (email: string, password: string) => {
    // Better Auth handles finding user, hash verification, session creation, and Redis caching
    try {
      const result = await auth.api.signInEmail({
        body: {
          email,
          password,
        }
      })

      if (!result) {
        throw new Error('Invalid credentials')
      }

      const { user, token } = result as any
      
      // Get tenant
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId as any)
      })

      if (!tenant) {
        logger.error({ userId: user.id, tenantId: user.tenantId }, 'Tenant not found for user')
        throw new Error('Tenant not found')
      }

      return {
        user,
        tenant,
        sessionToken: token
      }
    } catch (error: any) {
      logger.error({ email, error: error.message, stack: error.stack }, 'Better Auth signInEmail failed')
      throw error
    }
  },

  /**
   * Logout logic
   */
  logout: async (headers: Headers) => {
    // Better Auth handles deletion from DB and Redis
    await auth.api.signOut({
      headers
    })
  }
}
