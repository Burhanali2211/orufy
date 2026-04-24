import { Context } from 'hono'

export type Variables = {
  user: { id: string; email: string; tenantId: string; role: string } | null
  tenant: { id: string; slug: string; name: string; plan: string; status: string } | null
  session: string | null
}

export type AppContext = Context<{ Variables: Variables }>
