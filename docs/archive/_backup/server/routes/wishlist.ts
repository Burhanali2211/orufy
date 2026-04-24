import { Router, Response } from 'express';
import { query } from '../db/connection';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/wishlist
 * Get user's wishlist items
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await query(
      `SELECT 
        wi.id,
        wi.product_id,
        wi.created_at,
        p.id as product_id,
        p.name,
        p.slug,
        p.description,
        p.short_description,
        p.price,
        p.original_price,
        p.images,
        p.stock,
        p.rating,
        p.review_count,
        p.is_featured,
        p.category_id,
        c.name as category_name
      FROM public.wishlist_items wi
      JOIN public.products p ON wi.product_id = p.id
      LEFT JOIN public.categories c ON p.category_id = c.id
      WHERE wi.user_id = $1
      ORDER BY wi.created_at DESC`,
      [req.userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  })
);

/**
 * POST /api/wishlist
 * Add item to wishlist
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.body;

    // Validation
    if (!productId) {
      throw createError('Product ID is required', 400, 'VALIDATION_ERROR');
    }

    // Check if product exists
    const productResult = await query(
      'SELECT id FROM public.products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    // Check if already in wishlist
    const existingResult = await query(
      'SELECT id FROM public.wishlist_items WHERE user_id = $1 AND product_id = $2',
      [req.userId, productId]
    );

    if (existingResult.rows.length > 0) {
      throw createError('Product already in wishlist', 409, 'ALREADY_EXISTS');
    }

    // Add to wishlist
    await query(
      'INSERT INTO public.wishlist_items (user_id, product_id) VALUES ($1, $2)',
      [req.userId, productId]
    );

    res.json({
      success: true,
      message: 'Product added to wishlist'
    });
  })
);

/**
 * DELETE /api/wishlist/:productId
 * Remove item from wishlist
 */
router.delete(
  '/:productId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    // Check if item exists and belongs to user
    const itemResult = await query(
      'SELECT id FROM public.wishlist_items WHERE user_id = $1 AND product_id = $2',
      [req.userId, productId]
    );

    if (itemResult.rows.length === 0) {
      throw createError('Wishlist item not found', 404, 'NOT_FOUND');
    }

    await query(
      'DELETE FROM public.wishlist_items WHERE user_id = $1 AND product_id = $2',
      [req.userId, productId]
    );

    res.json({
      success: true,
      message: 'Item removed from wishlist'
    });
  })
);

/**
 * DELETE /api/wishlist
 * Clear entire wishlist
 */
router.delete(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await query(
      'DELETE FROM public.wishlist_items WHERE user_id = $1',
      [req.userId]
    );

    res.json({
      success: true,
      message: 'Wishlist cleared'
    });
  })
);

export default router;

