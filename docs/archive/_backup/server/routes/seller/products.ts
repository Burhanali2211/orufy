import { Router, Response } from 'express';
import { query } from '../../db/connection';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { asyncHandler, createError } from '../../middleware/errorHandler';

const router = Router();

/**
 * GET /api/seller/products
 * Get seller's products with pagination and filters
 */
router.get(
  '/',
  authenticate,
  authorize('seller'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = '1',
      limit = '10',
      search = '',
      category = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build WHERE clause - only show products belonging to this seller
    const conditions: string[] = [`p.seller_id = $1`];
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`p.category_id = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (status === 'active') {
      conditions.push(`p.is_active = true`);
    } else if (status === 'inactive') {
      conditions.push(`p.is_active = false`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM public.products p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get products
    const validSortColumns = ['name', 'price', 'stock', 'created_at', 'rating'];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    params.push(limit, offset);
    const productsResult = await query(
      `SELECT p.*, c.name as category_name
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY p.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      success: true,
      data: productsResult.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  })
);

/**
 * GET /api/seller/products/:id
 * Get single product by ID (only if owned by seller)
 */
router.get(
  '/:id',
  authenticate,
  authorize('seller'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.seller_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      throw createError('Product not found or unauthorized', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

/**
 * POST /api/seller/products
 * Create new product for seller
 */
router.post(
  '/',
  authenticate,
  authorize('seller'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      name,
      slug,
      description,
      short_description,
      price,
      original_price,
      category_id,
      images,
      stock,
      min_stock_level,
      sku,
      weight,
      dimensions,
      tags,
      specifications,
      is_featured,
      show_on_homepage,
      is_active,
      meta_title,
      meta_description
    } = req.body;

    // Validation
    if (!name || !price || !category_id) {
      throw createError('Name, price, and category are required', 400, 'VALIDATION_ERROR');
    }

    // Generate slug if not provided
    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await query(
      `INSERT INTO public.products (
        name, slug, description, short_description, price, original_price,
        category_id, seller_id, images, stock, min_stock_level, sku,
        weight, dimensions, tags, specifications, is_featured, show_on_homepage, is_active,
        meta_title, meta_description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        name,
        productSlug,
        description || null,
        short_description || null,
        price,
        original_price || null,
        category_id,
        req.userId, // seller_id from authenticated user
        images || [],
        stock || 0,
        min_stock_level || 5,
        sku || null,
        weight || null,
        dimensions || null,
        tags || [],
        specifications || null,
        is_featured || false,
        show_on_homepage !== undefined ? show_on_homepage : true,
        is_active !== undefined ? is_active : true,
        meta_title || null,
        meta_description || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0]
    });
  })
);

/**
 * PUT /api/seller/products/:id
 * Update product (only if owned by seller)
 */
router.put(
  '/:id',
  authenticate,
  authorize('seller'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      short_description,
      price,
      original_price,
      category_id,
      images,
      stock,
      min_stock_level,
      sku,
      weight,
      dimensions,
      tags,
      specifications,
      is_featured,
      show_on_homepage,
      is_active,
      meta_title,
      meta_description
    } = req.body;

    // Check if product exists and belongs to this seller
    const existingProduct = await query(
      'SELECT id FROM public.products WHERE id = $1 AND seller_id = $2',
      [id, req.userId]
    );

    if (existingProduct.rows.length === 0) {
      throw createError('Product not found or unauthorized', 404, 'NOT_FOUND');
    }

    const result = await query(
      `UPDATE public.products 
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           short_description = COALESCE($4, short_description),
           price = COALESCE($5, price),
           original_price = COALESCE($6, original_price),
           category_id = COALESCE($7, category_id),
           images = COALESCE($8, images),
           stock = COALESCE($9, stock),
           min_stock_level = COALESCE($10, min_stock_level),
           sku = COALESCE($11, sku),
           weight = COALESCE($12, weight),
           dimensions = COALESCE($13, dimensions),
           tags = COALESCE($14, tags),
           specifications = COALESCE($15, specifications),
           is_featured = COALESCE($16, is_featured),
           show_on_homepage = COALESCE($17, show_on_homepage),
           is_active = COALESCE($18, is_active),
           meta_title = COALESCE($19, meta_title),
           meta_description = COALESCE($20, meta_description),
           scent_notes = COALESCE($21, scent_notes),
           longevity = COALESCE($22, longevity),
           sillage = COALESCE($23, sillage),
           fragrance_family = COALESCE($24, fragrance_family),
           gender_profile = COALESCE($25, gender_profile),
           occasion = COALESCE($26, occasion),
           season = COALESCE($27, season),
           perfumer_story = COALESCE($28, perfumer_story),
           updated_at = NOW()
       WHERE id = $29 AND seller_id = $30
       RETURNING *`,
      [
        name,
        slug,
        description,
        short_description,
        price,
        original_price,
        category_id,
        images,
        stock,
        min_stock_level,
        sku,
        weight,
        dimensions,
        tags,
        specifications,
        is_featured,
        show_on_homepage,
        is_active,
        meta_title,
        meta_description,
        req.body.scent_notes,
        req.body.longevity,
        req.body.sillage,
        req.body.fragrance_family,
        req.body.gender_profile,
        req.body.occasion,
        req.body.season,
        req.body.perfumer_story,
        id,
        req.userId
      ]
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0]
    });
  })
);

/**
 * DELETE /api/seller/products/:id
 * Delete product (only if owned by seller)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('seller'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if product exists and belongs to this seller
    const existingProduct = await query(
      'SELECT id FROM public.products WHERE id = $1 AND seller_id = $2',
      [id, req.userId]
    );

    if (existingProduct.rows.length === 0) {
      throw createError('Product not found or unauthorized', 404, 'NOT_FOUND');
    }

    await query('DELETE FROM public.products WHERE id = $1 AND seller_id = $2', [id, req.userId]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  })
);

export default router;