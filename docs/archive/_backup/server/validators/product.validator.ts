import { z } from 'zod';

/**
 * Validation schemas for product endpoints
 */

// UUID schema
const uuidSchema = z.string().uuid('Invalid UUID format');

// Product create/update schema
export const productSchema = z.object({
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(255, 'Product name must not exceed 255 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(255, 'Slug must not exceed 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .optional(),
  shortDescription: z.string()
    .max(500, 'Short description must not exceed 500 characters')
    .optional(),
  price: z.number()
    .positive('Price must be positive')
    .max(1000000, 'Price must not exceed 1,000,000'),
  originalPrice: z.number()
    .positive('Original price must be positive')
    .max(1000000, 'Original price must not exceed 1,000,000')
    .optional(),
  categoryId: uuidSchema.optional(),
  images: z.array(z.string().url('Invalid image URL'))
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed')
    .optional(),
  stock: z.number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .max(100000, 'Stock must not exceed 100,000')
    .optional(),
  sku: z.string()
    .max(100, 'SKU must not exceed 100 characters')
    .optional(),
  tags: z.array(z.string())
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
  specifications: z.record(z.string(), z.any())
    .optional(),
  showOnHomepage: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string()
    .max(255, 'Meta title must not exceed 255 characters')
    .optional(),
  metaDescription: z.string()
    .max(500, 'Meta description must not exceed 500 characters')
    .optional()
});

// Product query params schema
export const productQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .refine(val => val > 0, 'Page must be greater than 0')
    .optional(),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional(),
  category: uuidSchema.optional(),
  search: z.string()
    .max(255, 'Search query must not exceed 255 characters')
    .optional(),
  minPrice: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .transform(Number)
    .optional(),
  maxPrice: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .transform(Number)
    .optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'popular'])
    .optional(),
  featured: z.string()
    .transform(val => val === 'true')
    .optional()
});

// Product ID param schema
export const productIdSchema = z.object({
  id: uuidSchema
});

// Type exports
export type ProductInput = z.infer<typeof productSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductIdParam = z.infer<typeof productIdSchema>;

