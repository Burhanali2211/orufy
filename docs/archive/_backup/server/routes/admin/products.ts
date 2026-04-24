import { Router, Response } from 'express';
import { query } from '../../db/connection';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { asyncHandler, createError } from '../../middleware/errorHandler';

const router = Router();

/**
 * GET /api/admin/products
 * Get all products with pagination and filters
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
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

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

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
 * GET /api/admin/products/:id
 * Get single product by ID
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

/**
 * POST /api/admin/products
 * Create new product
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
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
        weight, dimensions, tags, specifications, is_featured, is_active,
        meta_title, meta_description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
 * PUT /api/admin/products/:id
 * Update product
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
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
      is_active,
      meta_title,
      meta_description
    } = req.body;

    // Check if product exists
    const existingProduct = await query(
      'SELECT id FROM public.products WHERE id = $1',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    const result = await query(
      `UPDATE public.products SET
        name = COALESCE($1, name),
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
        is_active = COALESCE($17, is_active),
        meta_title = COALESCE($18, meta_title),
        meta_description = COALESCE($19, meta_description),
        updated_at = NOW()
      WHERE id = $20
      RETURNING *`,
      [
        name, slug, description, short_description, price, original_price,
        category_id, images, stock, min_stock_level, sku, weight,
        dimensions, tags, specifications, is_featured, is_active,
        meta_title, meta_description, id
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
 * DELETE /api/admin/products/:id
 * Delete product
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM public.products WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  })
);

/**
 * POST /api/admin/products/bulk-delete
 * Bulk delete products
 */
router.post(
  '/bulk-delete',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw createError('Product IDs array is required', 400, 'VALIDATION_ERROR');
    }

    const result = await query(
      'DELETE FROM public.products WHERE id = ANY($1) RETURNING id',
      [ids]
    );

    res.json({
      success: true,
      message: `${result.rows.length} products deleted successfully`,
      deletedCount: result.rows.length
    });
  })
);

export default router;

