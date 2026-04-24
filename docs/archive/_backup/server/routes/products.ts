import { Router, Response, Request } from 'express';
import { query } from '../db/connection';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest, optionalAuth } from '../middleware/auth';
import { CacheConfig, invalidateCache, InvalidatePatterns } from '../middleware/cacheMiddleware';

const router = Router();

/**
 * Transform a product row from snake_case to camelCase
 */
    function transformProductRow(row: any): any {
      if (!row) return row;
      
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        shortDescription: row.short_description,
        price: Number(row.price) || 0,
        originalPrice: row.original_price ? Number(row.original_price) : undefined,
        categoryId: row.category_id,
        category: row.category_name || undefined,
        sellerId: row.seller_id,
        sellerName: row.seller_name || '',
        images: (() => {
          const imgArray = Array.isArray(row.images) ? row.images : (row.images ? [row.images] : []);
          // Filter out invalid/empty images and convert relative paths to full URLs
          return imgArray
            .filter((img: any) => 
              img && 
              typeof img === 'string' && 
              img.trim() !== '' && 
              img.trim() !== 'null' && 
              img.trim() !== 'undefined'
            )
            .map((img: string) => {
              // If it's a relative path starting with /uploads, convert to full URL
              if (img.startsWith('/uploads') && !img.startsWith('http')) {
                const baseUrl = process.env.FRONTEND_URL || 
                               process.env.API_BASE_URL ||
                               (process.env.NODE_ENV === 'development'
                                 ? `http://localhost:${process.env.PORT || 5000}`
                                 : undefined);
                if (baseUrl) {
                  // Remove trailing slash from baseUrl and ensure path starts with /
                  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                  const cleanPath = img.startsWith('/') ? img : `/${img}`;
                  return `${cleanBaseUrl}${cleanPath}`;
                }
                // If no base URL configured, return relative path
                return img;
              }
              return img;
            });
        })(),
        stock: Number(row.stock) || 0,
        minStockLevel: row.min_stock_level ? Number(row.min_stock_level) : undefined,
        sku: row.sku,
        weight: row.weight ? Number(row.weight) : undefined,
        dimensions: row.dimensions,
        rating: Number(row.rating) || 0,
        reviewCount: Number(row.review_count) || 0,
        reviews: row.reviews || [],
        tags: Array.isArray(row.tags) ? row.tags : (row.tags ? [row.tags] : []),
        specifications: row.specifications,
        featured: Boolean(row.is_featured),
        showOnHomepage: Boolean(row.show_on_homepage),
        isActive: row.is_active !== false,
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        variants: row.variants
      };
    }


/**
 * GET /api/products
 * Get products with pagination and filtering
 * Cached for 15 minutes
 */
router.get(
  '/',
  optionalAuth,
  CacheConfig.medium,
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const categoryId = req.query.categoryId as string;
    const search = req.query.search as string;
    const featured = req.query.featured === 'true';
    const bestSellers = req.query.bestSellers === 'true';
    const latest = req.query.latest === 'true';
    const sellerId = req.query.sellerId as string; // Add sellerId filter
    const showOnHomepage = req.query.showOnHomepage === 'true'; // Add showOnHomepage filter

    let whereClause = 'WHERE is_active = true';
    const params: any[] = [];
    let orderByClause = 'ORDER BY created_at DESC';

    if (categoryId) {
      whereClause += ` AND category_id = $${params.length + 1}`;
      params.push(categoryId);
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (featured) {
      whereClause += ` AND is_featured = true`;
    }

    if (showOnHomepage) {
      whereClause += ` AND show_on_homepage = true`;
    }

    if (sellerId) {
      whereClause += ` AND seller_id = $${params.length + 1}`;
      params.push(sellerId);
    }

    // Best sellers: Sort by rating and review count (temporary until we have order data)
    if (bestSellers) {
      orderByClause = 'ORDER BY (rating * review_count) DESC, rating DESC, review_count DESC';
    }

    // Latest arrivals: Sort by creation date
    if (latest) {
      orderByClause = 'ORDER BY created_at DESC';
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.products p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get products with seller name and category name
    const result = await query(
      `SELECT p.id, p.name, p.slug, p.description, p.short_description, p.price, p.original_price,
              p.category_id, p.seller_id, p.images, p.stock, p.rating, p.review_count, 
              p.is_featured, p.tags, p.show_on_homepage, p.created_at,
              c.name as category_name,
              COALESCE(pr.full_name, pr.email, '') as seller_name
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       LEFT JOIN public.profiles pr ON p.seller_id = pr.id
       ${whereClause.replace(/WHERE/g, 'WHERE p.')}
       ${orderByClause.replace(/created_at/g, 'p.created_at').replace(/rating/g, 'p.rating').replace(/review_count/g, 'p.review_count')}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Transform products to camelCase
    const transformedProducts = result.rows.map(transformProductRow);

    res.json({
      data: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

/**
 * GET /api/products/:id
 * Get product details
 * Cached for 15 minutes
 */
router.get(
  '/:id',
  CacheConfig.medium,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Handle sample- prefix by stripping it before validation and use
    const cleanId = typeof id === 'string' && id.startsWith('sample-') 
      ? id.replace('sample-', '') 
      : id;

    // Validate UUID format to prevent database errors
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(cleanId)) {
      throw createError('Invalid product ID format', 400, 'INVALID_ID');
    }

    const result = await query(
      `SELECT p.id, p.name, p.slug, p.description, p.short_description, p.price, p.original_price,
              p.category_id, p.seller_id, p.images, p.stock, p.min_stock_level, p.sku, p.weight,
              p.dimensions, p.tags, p.specifications, p.rating::numeric, p.review_count, p.is_featured,
              p.show_on_homepage, p.is_active, p.meta_title, p.meta_description, p.created_at, p.updated_at,
              c.name as category_name,
              COALESCE(pr.full_name, pr.email, '') as seller_name
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       LEFT JOIN public.profiles pr ON p.seller_id = pr.id
       WHERE p.id = $1`,
      [cleanId]
    );

    if (result.rows.length === 0) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    const product = result.rows[0];

    // Get variants
    const variantsResult = await query(
      `SELECT id, name, sku, price, stock, attributes FROM public.product_variants 
       WHERE product_id = $1`,
      [id]
    );

    // Get reviews
    const reviewsResult = await query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at, p.full_name, p.avatar_url
       FROM public.reviews r
       JOIN public.profiles p ON r.user_id = p.id
       WHERE r.product_id = $1 AND r.is_approved = true
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Transform and include variants and reviews
    const transformedProduct = transformProductRow({
      ...product,
      variants: variantsResult.rows,
      reviews: reviewsResult.rows.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.created_at,
        profiles: {
          full_name: r.full_name,
          avatar_url: r.avatar_url,
        },
      })),
    });

    res.json({
      success: true,
      data: transformedProduct,
    });
  })
);

/**
 * POST /api/products
 * Create product (admin only)
 * Invalidates product cache
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'seller'),
  invalidateCache(InvalidatePatterns.products),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      originalPrice,
      categoryId,
      images,
      stock,
      sku,
      tags,
      specifications,
      showOnHomepage,
    } = req.body;

    // Validation
    if (!name || !price) {
      throw createError('Name and price are required', 400, 'VALIDATION_ERROR');
    }

    const result = await query(
      `INSERT INTO public.products 
       (name, slug, description, short_description, price, original_price, 
        category_id, seller_id, images, stock, sku, tags, specifications, is_active, show_on_homepage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14)
       RETURNING *`,
      [
        name,
        slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        shortDescription,
        price,
        originalPrice,
        categoryId,
        req.userId,
        images || [],
        stock || 0,
        sku,
        tags || [],
        specifications || {},
        showOnHomepage !== undefined ? showOnHomepage : true,
      ]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0],
    });
  })
);

/**
 * PUT /api/products/:id
 * Update product (admin/seller only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'seller'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      stock, 
      images, 
      tags, 
      showOnHomepage,
    } = req.body;

    // Check ownership
    const productResult = await query(
      'SELECT seller_id FROM public.products WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    if (req.role !== 'admin' && productResult.rows[0].seller_id !== req.userId) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    const result = await query(
      `UPDATE public.products 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
           images = COALESCE($5, images),
           tags = COALESCE($6, tags),
           show_on_homepage = COALESCE($7, show_on_homepage),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        name, 
        description, 
        price, 
        stock, 
        images, 
        tags, 
        showOnHomepage,
        id
      ]
    );

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0],
    });
  })
);

/**
 * DELETE /api/products/:id
 * Delete product (admin/seller only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'seller'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check ownership
    const productResult = await query(
      'SELECT seller_id FROM public.products WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    if (req.role !== 'admin' && productResult.rows[0].seller_id !== req.userId) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    await query('DELETE FROM public.products WHERE id = $1', [id]);

    res.json({ message: 'Product deleted successfully' });
  })
);

export default router;