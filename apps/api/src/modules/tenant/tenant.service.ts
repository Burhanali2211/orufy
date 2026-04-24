import { db, tenants, customDomains, subscriptions } from '../../lib/db'
import { eq } from 'drizzle-orm'
import { redis } from '../../lib/redis'
import { logger } from '../../lib/logger'
import { invalidateTenantCache } from '../../middleware/tenant'
import type { UpdateTenantInput, TenantSettingsInput } from './tenant.schema'
import type { InferSelectModel } from 'drizzle-orm'

type TenantRow = InferSelectModel<typeof tenants>
type SubscriptionRow = InferSelectModel<typeof subscriptions>

export interface TenantSettings {
  primaryColor?: string
  logo?: string
  bannerUrl?: string
  about?: string
  contactEmail?: string
  contactPhone?: string
}

export interface TenantWithSubscription extends TenantRow {
  subscription: Pick<SubscriptionRow, 'status' | 'plan' | 'currentPeriodStart' | 'currentPeriodEnd'> | null
}

export const tenantService = {
  async getTenantBySlug(slug: string): Promise<TenantRow | null> {
    const cacheKey = `tenant:slug:${slug}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) return JSON.parse(cached) as TenantRow
    } catch (err) {
      logger.error({ err }, 'Redis error in getTenantBySlug:');
    }

    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        plan: tenants.plan,
        status: tenants.status,
        settings: tenants.settings,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1)

    if (tenant) {
      try {
        await redis.set(cacheKey, JSON.stringify(tenant), 'EX', 300)
      } catch (err) {
        logger.error({ err }, 'Redis set error in getTenantBySlug:');
      }
    }

    return (tenant as TenantRow) ?? null
  },

  async getTenantWithSubscription(tenantId: string): Promise<TenantWithSubscription | null> {
    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        plan: tenants.plan,
        status: tenants.status,
        settings: tenants.settings,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1)

    if (!tenant) return null

    const [sub] = await db
      .select({
        status: subscriptions.status,
        plan: subscriptions.plan,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .limit(1)

    return {
      ...(tenant as TenantRow),
      subscription: sub ?? null,
    }
  },

  async updateTenant(tenantId: string, tenantSlug: string, data: UpdateTenantInput): Promise<TenantRow> {
    const [existing] = await db
      .select({ settings: tenants.settings })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1)

    if (!existing) throw new Error('Tenant not found')

    const mergedSettings = data.settings
      ? { ...(existing.settings as TenantSettings), ...data.settings }
      : existing.settings

    const [updated] = await db
      .update(tenants)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        settings: mergedSettings,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId))
      .returning()

    await invalidateTenantCache(tenantSlug)

    return updated as TenantRow
  },

  async suspendTenant(tenantId: string): Promise<void> {
    const [tenant] = await db
      .select({ slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1)

    if (!tenant) throw new Error('Tenant not found')

    await db
      .update(tenants)
      .set({ status: 'suspended', updatedAt: new Date() })
      .where(eq(tenants.id, tenantId))

    await invalidateTenantCache(tenant.slug)
  },

  async addCustomDomain(tenantId: string, domain: string): Promise<{ domain: string; verificationToken: string; verified: boolean }> {
    const verificationToken = `v=${Math.random().toString(36).substring(2)}`

    await db.insert(customDomains).values({
      tenantId,
      domain,
      verificationToken,
      verified: false,
    })

    return { domain, verificationToken, verified: false }
  },

  async getCustomDomains(tenantId: string): Promise<{ id: string; domain: string; verified: boolean | null; verificationToken: string }[]> {
    return await db
      .select({
        id: customDomains.id,
        domain: customDomains.domain,
        verified: customDomains.verified,
        verificationToken: customDomains.verificationToken,
      })
      .from(customDomains)
      .where(eq(customDomains.tenantId, tenantId))
  },

  async verifyCustomDomain(tenantId: string, domain: string): Promise<{ verified: boolean; error?: string }> {
    const [record] = await db
      .select({ id: customDomains.id, verificationToken: customDomains.verificationToken })
      .from(customDomains)
      .where(eq(customDomains.domain, domain))
      .limit(1)

    if (!record) return { verified: false, error: 'Domain not found' }

    try {
      const { promises: dns } = await import('dns')
      const txtRecords = await dns.resolveTxt(`_verify.${domain}`)
      const flat = txtRecords.flat()
      const matched = flat.some((r) => r === record.verificationToken)

      if (matched) {
        await db
          .update(customDomains)
          .set({ verified: true })
          .where(eq(customDomains.id, record.id))
        return { verified: true }
      }

      return { verified: false, error: 'TXT record not found or does not match' }
    } catch {
      return { verified: false, error: 'DNS lookup failed — record may not have propagated yet' }
    }
  },

  async deleteCustomDomain(tenantId: string, domain: string): Promise<void> {
    await db
      .delete(customDomains)
      .where(eq(customDomains.domain, domain))
  },
}
