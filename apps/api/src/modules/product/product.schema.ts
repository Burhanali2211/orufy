import { z } from 'zod'

const positiveInt = z.number().int().positive()
const nonNegativeInt = z.number().int().min(0)

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: positiveInt,
  comparePrice: positiveInt.optional(),
  stock: nonNegativeInt,
  sku: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional().default(true),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: positiveInt.optional(),
  comparePrice: positiveInt.optional(),
  stock: nonNegativeInt.optional(),
  sku: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
})

export const shopProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>
export type ShopProductsQuery = z.infer<typeof shopProductsQuerySchema>
