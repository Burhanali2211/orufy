import { Hono } from 'hono'
import { z } from 'zod'
import { Variables } from '../../types/context'
import { analyticsService, type AnalyticsPeriod } from './analytics.service'

export const analyticsRoutes = new Hono<{ Variables: Variables }>()

const periodSchema = z.enum(['7d', '30d', '90d']).default('30d')

analyticsRoutes.get('/summary', async (c) => {
  try {
    const tenant = c.get('tenant')!

    const parsed = periodSchema.safeParse(c.req.query('period'))
    const period: AnalyticsPeriod = parsed.success ? parsed.data : '30d'

    const data = await analyticsService.getSummary(tenant.id, period)
    return c.json({ data })
  } catch (err) {
    throw err
  }
})
