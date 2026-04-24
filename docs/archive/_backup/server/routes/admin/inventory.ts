import { Router, Response } from 'express';
import { query } from '../../db/connection.js';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.js';
import { asyncHandler, createError } from '../../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/admin/inventory
 * Get inventory status for all products and variants
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search = '', status = '' } = req.query;

    let whereClause = '';
    const params: any[] = [];
    if (search) {
      whereClause = 'WHERE p.name ILIKE $1 OR p.sku ILIKE $1';
      params.push(`%${search}%`);
    }

    if (status === 'low_stock') {
      whereClause += (whereClause ? ' AND ' : ' WHERE ') + 'p.stock <= p.min_stock_level';
    } else if (status === 'out_of_stock') {
      whereClause += (whereClause ? ' AND ' : ' WHERE ') + 'p.stock = 0';
    }

    const result = await query(
      `SELECT p.id, p.name, p.sku, p.stock, p.min_stock_level, p.price, p.images,
              c.name as category_name,
              (SELECT COUNT(*) FROM public.product_variants pv WHERE pv.product_id = p.id) as variant_count
       FROM public.products p
       LEFT JOIN public.categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY p.stock ASC`,
      params
    );

    res.json({
      success: true,
      data: result.rows
    });
  })
);

/**
 * POST /api/admin/inventory/adjust
 * Adjust stock for a product or variant
 */
router.post(
  '/adjust',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { product_id, variant_id, change_amount, type, notes } = req.body;

    if (!product_id || change_amount === undefined || !type) {
      throw createError('Product ID, change amount, and type are required', 400);
    }

    let currentStock = 0;
    if (variant_id) {
      const vResult = await query('SELECT stock FROM public.product_variants WHERE id = $1', [variant_id]);
      if (vResult.rows.length === 0) throw createError('Variant not found', 404);
      currentStock = vResult.rows[0].stock;
    } else {
      const pResult = await query('SELECT stock FROM public.products WHERE id = $1', [product_id]);
      if (pResult.rows.length === 0) throw createError('Product not found', 404);
      currentStock = pResult.rows[0].stock;
    }

    const newStock = currentStock + change_amount;

    // Update stock
    if (variant_id) {
      await query('UPDATE public.product_variants SET stock = $1, updated_at = NOW() WHERE id = $2', [newStock, variant_id]);
    } else {
      await query('UPDATE public.products SET stock = $1, updated_at = NOW() WHERE id = $2', [newStock, product_id]);
    }

    // Create movement record
    const movementResult = await query(
      `INSERT INTO public.stock_movements (
        product_id, variant_id, change_amount, new_stock, type, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [product_id, variant_id || null, change_amount, newStock, type, notes, req.userId]
    );

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        new_stock: newStock,
        movement: movementResult.rows[0]
      }
    });
  })
);

/**
 * GET /api/admin/inventory/movements
 * Get stock movement history
 */
router.get(
  '/movements',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { product_id, limit = '50' } = req.query;

    let whereClause = '';
    const params: any[] = [];
    if (product_id) {
      whereClause = 'WHERE sm.product_id = $1';
      params.push(product_id);
    }

    const result = await query(
      `SELECT sm.*, p.name as product_name, pv.name as variant_name, pr.full_name as creator_name
       FROM public.stock_movements sm
       LEFT JOIN public.products p ON sm.product_id = p.id
       LEFT JOIN public.product_variants pv ON sm.variant_id = pv.id
       LEFT JOIN public.profiles pr ON sm.created_by = pr.id
       ${whereClause}
       ORDER BY sm.created_at DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  })
);

export default router;
