import { db, products } from '../../lib/db'
import { eq, and, or, like, gte, lte, gt, lt, desc, asc, count } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { CreateProductInput, UpdateProductInput, ListProductsQuery, ShopProductsQuery } from './product.schema'

type ProductRow = InferSelectModel<typeof products>

export type PublicProduct = Pick<
  ProductRow,
  'id' | 'name' | 'description' | 'price' | 'comparePrice' | 'imageUrls' | 'category' | 'tags' | 'createdAt'
>

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

export interface ProductStats {
  active: number
  lowStock: number
  outOfStock: number
}

const PUBLIC_COLUMNS = {
  id: products.id,
  name: products.name,
  description: products.description,
  price: products.price,
  comparePrice: products.comparePrice,
  imageUrls: products.imageUrls,
  category: products.category,
  tags: products.tags,
  createdAt: products.createdAt,
} as const

const FULL_COLUMNS = {
  id: products.id,
  tenantId: products.tenantId,
  name: products.name,
  description: products.description,
  price: products.price,
  comparePrice: products.comparePrice,
  stock: products.stock,
  sku: products.sku,
  imageUrls: products.imageUrls,
  category: products.category,
  tags: products.tags,
  isActive: products.isActive,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
} as const

export const productService = {
  async getProducts(
    tenantId: string,
    filters: ListProductsQuery,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResponse<ProductRow>> {
    const { page, limit, search, category, isActive } = filters
    const offset = (page - 1) * limit

    const conditions = [eq(products.tenantId, tenantId)]

    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )!
      )
    }

    if (category) {
      conditions.push(eq(products.category, category))
    }

    if (isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive === 'true'))
    }

    const where = and(...conditions)

    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(where)

    const rows = await db
      .select(FULL_COLUMNS)
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      data: rows as ProductRow[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getProductById(tenantId: string, productId: string): Promise<ProductRow | null> {
    const [row] = await db
      .select(FULL_COLUMNS)
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.id, productId)))
      .limit(1)

    return (row as ProductRow) ?? null
  },

  async getProductStats(tenantId: string): Promise<ProductStats> {
    const [{ active }] = await db
      .select({ active: count() })
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.isActive, true)))

    const [{ lowStock }] = await db
      .select({ lowStock: count() })
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.isActive, true),
          gt(products.stock, 0),
          lt(products.stock, 10)
        )
      )

    const [{ outOfStock }] = await db
      .select({ outOfStock: count() })
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.stock, 0)))

    return {
      active: active ?? 0,
      lowStock: lowStock ?? 0,
      outOfStock: outOfStock ?? 0,
    }
  },

  async createProduct(tenantId: string, data: CreateProductInput): Promise<ProductRow> {
    const [row] = await db
      .insert(products)
      .values({
        tenantId,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        comparePrice: data.comparePrice ?? null,
        stock: data.stock,
        sku: data.sku ?? null,
        imageUrls: data.imageUrls ?? [],
        category: data.category ?? null,
        tags: data.tags ?? [],
        isActive: data.isActive ?? true,
      })
      .returning()

    return row as ProductRow
  },

  async updateProduct(
    tenantId: string,
    productId: string,
    data: UpdateProductInput
  ): Promise<ProductRow | null> {
    const existing = await productService.getProductById(tenantId, productId)
    if (!existing) return null

    const [row] = await db
      .update(products)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.comparePrice !== undefined && { comparePrice: data.comparePrice }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.imageUrls !== undefined && { imageUrls: data.imageUrls }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      })
      .where(and(eq(products.tenantId, tenantId), eq(products.id, productId)))
      .returning()

    return (row as ProductRow) ?? null
  },

  async softDeleteProduct(tenantId: string, productId: string): Promise<boolean> {
    const existing = await productService.getProductById(tenantId, productId)
    if (!existing) return false

    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(products.tenantId, tenantId), eq(products.id, productId)))

    return true
  },

  async getPublicProducts(
    tenantId: string,
    filters: ShopProductsQuery,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResponse<PublicProduct>> {
    const { page, limit, search, category, minPrice, maxPrice, sortBy } = filters
    const offset = (page - 1) * limit

    const conditions = [
      eq(products.tenantId, tenantId),
      eq(products.isActive, true),
    ]

    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )!
      )
    }

    if (category) {
      conditions.push(eq(products.category, category))
    }

    if (minPrice !== undefined) {
      conditions.push(gte(products.price, minPrice))
    }

    if (maxPrice !== undefined) {
      conditions.push(lte(products.price, maxPrice))
    }

    const where = and(...conditions)

    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(where)

    let orderByClause
    if (sortBy === 'price_asc') orderByClause = asc(products.price)
    else if (sortBy === 'price_desc') orderByClause = desc(products.price)
    else orderByClause = desc(products.createdAt)

    const rows = await db
      .select(PUBLIC_COLUMNS)
      .from(products)
      .where(where)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    return {
      data: rows as PublicProduct[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  },

  async getPublicProductById(tenantId: string, productId: string): Promise<PublicProduct | null> {
    const [row] = await db
      .select(PUBLIC_COLUMNS)
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.id, productId),
          eq(products.isActive, true)
        )
      )
      .limit(1)

    return (row as PublicProduct) ?? null
  },
}
