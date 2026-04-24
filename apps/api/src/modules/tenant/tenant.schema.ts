import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (#RRGGBB)')

export const tenantSettingsSchema = z.object({
  primaryColor: hexColor.optional(),
  logo: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  about: z.string().max(1000).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
})

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  settings: tenantSettingsSchema.optional(),
})

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>
export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>
