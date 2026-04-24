import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db, users, sessions, accounts, verifications } from './db'
import { redis } from './redis'
import { env } from '../env'
import type { Context } from 'hono'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
    // Use Redis for session storage (optional — falls back to DB if Redis offline)
    storage: {
      get: async (key: string) => {
        try {
          const val = await redis.get(`session:${key}`)
          return val ? JSON.parse(val) : null
        } catch { return null }
      },
      set: async (key: string, value: any, expiresAt: Date) => {
        try {
          await redis.set(
            `session:${key}`,
            JSON.stringify(value),
            'PXAT',
            expiresAt.getTime()
          )
        } catch { /* Redis offline — session stored in DB only */ }
      },
      delete: async (key: string) => {
        try { await redis.del(`session:${key}`) } catch { /* ignore */ }
      },
    },
    additionalFields: {
      tenantId: {
        type: 'string',
        required: true,
      },
    },
  },
  user: {
    additionalFields: {
      tenantId: {
        type: 'string',
        required: true,
      },
      role: {
        type: 'string',
        defaultValue: 'owner',
      },
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',        // Mount Better Auth endpoints at /api/auth/*
  trustedOrigins: [
    env.APP_DOMAIN,
    `https://*.${env.APP_DOMAIN}`,
    `http://*.${env.APP_DOMAIN}`,
    'http://localhost:5173', // Development
  ],
})

/**
 * Helper to get the session from Hono context
 */
export const getSession = async (c: Context) => {
  return await auth.api.getSession({
    headers: c.req.raw.headers,
  })
}

export type Auth = typeof auth
export type AppContext = Context
