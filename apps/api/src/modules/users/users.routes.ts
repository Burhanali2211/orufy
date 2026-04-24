import { Hono } from 'hono'
import { z } from 'zod'
import { Variables } from '../../types/context'
import { usersService } from './users.service'

const router = new Hono<any>()

const querySchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('10').transform(Number),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
})

router.get('/', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const query = c.req.query()
    const parsed = querySchema.safeParse(query)
    
    if (!parsed.success) {
      return c.json({ error: 'Invalid query parameters' }, 400)
    }

    const { page, limit, ...filters } = parsed.data
    const result = await usersService.getUsers(tenant.id, filters, { page, limit })
    
    return c.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    })
  } catch (err) {
    throw err
  }
})

router.patch('/:id', async (c) => {
  try {
    const tenant = c.get('tenant')!
    const id = c.req.param('id')
    const body = await c.req.json()

    const updated = await usersService.updateUser(tenant.id, id, body)
    if (!updated) return c.json({ error: 'User not found' }, 404)

    return c.json({ success: true, data: updated })
  } catch (err) {
    throw err
  }
})

export const usersRoutes = router
