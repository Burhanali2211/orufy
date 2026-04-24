import { Hono } from 'hono'
import { logger } from '../../lib/logger'
import { z } from 'zod'
import { Variables } from '../../types/context'
import { authService } from './auth.service'
import { requireAuth } from '../../middleware/auth'
import { auth } from '../../lib/auth'
import { setCookie, deleteCookie } from 'hono/cookie'

const router = new Hono<any>()

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  shopName: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

router.post('/signup', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    const result = await authService.signUp(parsed.data)
    return c.json(result, 201)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Signup failed' }, 400)
  }
})

router.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    
    try {
      const { user, tenant, sessionToken } = await authService.login(parsed.data.email, parsed.data.password)
      
      logger.info({ email: parsed.data.email }, 'Login successful')
      
      setCookie(c, 'better-auth.session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })

      return c.json({ user, tenant })
    } catch (error: any) {
      logger.error({ 
        email: parsed.data.email, 
        error: error.message,
        stack: error.stack
      }, 'Login failed in routes')
      
      return c.json({ error: error.message || 'Invalid credentials' }, 401)
    }
  } catch (error) {
    logger.error({ error }, 'Login failed')
    return c.json({ error: 'Invalid credentials' }, 401)
  }
})

router.post('/logout', async (c) => {
  try {
    await authService.logout(c.req.raw.headers)
    deleteCookie(c, 'better-auth.session_token')
    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Logout failed' }, 500)
  }
})

router.get('/me', requireAuth, async (c) => {
  const user = c.get('user')
  const tenant = c.get('tenant')
  return c.json({ user, tenant })
})

router.post('/verify-email', async (c) => auth.handler(c.req.raw))
router.post('/forgot-password', async (c) => auth.handler(c.req.raw))
router.post('/reset-password', async (c) => auth.handler(c.req.raw))

export const authRoutes = router
