import { Router, Response } from 'express';
import { query } from '../db/connection';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest, optionalAuth } from '../middleware/auth';
import { CacheConfig, invalidateCache, InvalidatePatterns } from '../middleware/cacheMiddleware';

const router = Router();

/**
 * Transform a category row from snake_case to camelCase
 */
function transformCategoryRow(row: any): any {
  if (!row) return row;
  
  // Convert relative image URLs to full URLs
  const imageUrl = row.image_url ? (
    row.image_url.startsWith('/uploads') && !row.image_url.startsWith('http')
      ? (() => {
          const baseUrl = process.env.FRONTEND_URL || 
                         process.env.API_BASE_URL ||
                         (process.env.NODE_ENV === 'development'
                           ? `http://localhost:${process.env.PORT || 5000}`
                           : undefined);
          if (baseUrl) {
            // Remove trailing slash from baseUrl and ensure path starts with /
            const cleanBaseUrl = baseUrl.replace(/\/$/, '');
            const cleanPath = row.image_url.startsWith('/') ? row.image_url : `/${row.image_url}`;
            return `${cleanBaseUrl}${cleanPath}`;
          }
          // If no base URL configured, return relative path
          return row.image_url;
        })()
      : row.image_url
  ) : null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: imageUrl,
    // Also include image_url for backward compatibility
    image_url: imageUrl,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    productCount: Number(row.product_count) || 0,
    // Also include product_count for backward compatibility
    product_count: Number(row.product_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/categories
 * Get all categories
 * Cached for 1 hour (categories rarely change)
 */
router.get(
  '/',
  optionalAuth,
  CacheConfig.long,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await query(
      `SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image_url,
        c.parent_id,
        c.sort_order,
        c.is_active,
        c.created_at,
        COUNT(p.id) as product_count
       FROM public.categories c
       LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
       WHERE c.is_active = true
       GROUP BY c.id, c.name, c.slug, c.description, c.image_url, c.parent_id, c.sort_order, c.is_active, c.created_at
       ORDER BY c.sort_order ASC, c.name ASC`
    );

    // Transform categories to camelCase
    const transformedCategories = result.rows.map(transformCategoryRow);

    res.json({
      success: true,
      data: transformedCategories,
    });
  })
);

/**
 * GET /api/categories/:id
 * Get category details with products
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get category with product count
    const categoryResult = await query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM public.categories c
       LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    if (categoryResult.rows.length === 0) {
      throw createError('Category not found', 404, 'NOT_FOUND');
    }

    const category = transformCategoryRow(categoryResult.rows[0]);

    // Get products in category
    const productsResult = await query(
      `SELECT p.id, p.name, p.slug, p.price, p.original_price, p.images, p.rating, p.review_count,
              p.is_featured, p.stock, p.created_at
       FROM public.products p
       WHERE p.category_id = $1 AND p.is_active = true
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [id]
    );

    // Transform products
    const transformedProducts = productsResult.rows.map((row: any) => {
      // Normalize product image URLs (same logic as products route)
      const baseUrl =
        process.env.FRONTEND_URL ||
        process.env.API_BASE_URL ||
        (process.env.NODE_ENV === 'development'
          ? `http://localhost:${process.env.PORT || 5000}`
          : undefined);

      const images = Array.isArray(row.images) ? row.images : (row.images ? [row.images] : []);
      const normalizedImages = images.map((img: any) => {
        if (
          typeof img === 'string' &&
          img.startsWith('/uploads') &&
          !img.startsWith('http') &&
          baseUrl
        ) {
          // Remove trailing slash from baseUrl and ensure path starts with /
          const cleanBaseUrl = baseUrl.replace(/\/$/, '');
          const cleanPath = img.startsWith('/') ? img : `/${img}`;
          return `${cleanBaseUrl}${cleanPath}`;
        }
        return img;
      });

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        price: Number(row.price) || 0,
        originalPrice: row.original_price ? Number(row.original_price) : undefined,
        images: normalizedImages,
        rating: Number(row.rating) || 0,
        reviewCount: Number(row.review_count) || 0,
        featured: Boolean(row.is_featured),
        stock: Number(row.stock) || 0,
        createdAt: row.created_at,
      };
    });

    res.json({
      success: true,
      category,
      products: transformedProducts,
    });
  })
);

/**
 * POST /api/categories
 * Create category (admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, slug, description, imageUrl, parentId, sortOrder } = req.body;

    // Validation
    if (!name || !slug) {
      throw createError('Name and slug are required', 400, 'VALIDATION_ERROR');
    }

    // Check if slug exists
    const existingResult = await query(
      'SELECT id FROM public.categories WHERE slug = $1',
      [slug]
    );

    if (existingResult.rows.length > 0) {
      throw createError('Category slug already exists', 409, 'SLUG_EXISTS');
    }

    const result = await query(
      `INSERT INTO public.categories (name, slug, description, image_url, parent_id, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [name, slug, description, imageUrl, parentId, sortOrder || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: result.rows[0],
    });
  })
);

/**
 * PUT /api/categories/:id
 * Update category (admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, slug, description, imageUrl, sortOrder } = req.body;

    // Check if category exists
    const categoryResult = await query(
      'SELECT id FROM public.categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      throw createError('Category not found', 404, 'NOT_FOUND');
    }

    // Check if new slug is unique
    if (slug) {
      const slugResult = await query(
        'SELECT id FROM public.categories WHERE slug = $1 AND id != $2',
        [slug, id]
      );

      if (slugResult.rows.length > 0) {
        throw createError('Category slug already exists', 409, 'SLUG_EXISTS');
      }
    }

    const result = await query(
      `UPDATE public.categories 
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url),
           sort_order = COALESCE($5, sort_order),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, slug, description, imageUrl, sortOrder, id]
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      category: result.rows[0],
    });
  })
);

/**
 * DELETE /api/categories/:id
 * Delete category (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if category exists
    const categoryResult = await query(
      'SELECT id FROM public.categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      throw createError('Category not found', 404, 'NOT_FOUND');
    }

    // Check if category has products
    const productsResult = await query(
      'SELECT COUNT(*) as count FROM public.products WHERE category_id = $1',
      [id]
    );

    if (parseInt(productsResult.rows[0].count) > 0) {
      throw createError(
        'Cannot delete category with products',
        409,
        'CATEGORY_HAS_PRODUCTS'
      );
    }

    await query('DELETE FROM public.categories WHERE id = $1', [id]);

    res.json({ success: true, message: 'Category deleted successfully' });
  })
);

export default router;

