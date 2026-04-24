import { Router, Response } from 'express';
import { query } from '../db/connection';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/cart
 * Get user's cart items
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await query(
      `SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity,
              p.id as product_id, p.name, p.description, p.price, p.images, p.stock,
              p.category_id, p.seller_id, p.rating, p.tags, p.sku,
              pv.name as variant_name, pv.price as variant_price
       FROM public.cart_items ci
       JOIN public.products p ON ci.product_id = p.id
       LEFT JOIN public.product_variants pv ON ci.variant_id = pv.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [req.userId]
    );

    // Transform flat structure to nested product structure
    const items = result.rows.map((row: any) => ({
      id: row.id,
      quantity: parseInt(row.quantity) || 0,
      variantId: row.variant_id,
      product: {
        id: row.product_id,
        name: row.name,
        description: row.description || '',
        price: parseFloat(row.variant_price || row.price) || 0,
        images: row.images || [],
        stock: parseInt(row.stock) || 0,
        categoryId: row.category_id,
        sellerId: row.seller_id,
        rating: parseFloat(row.rating) || 0,
        tags: row.tags || [],
        sku: row.sku || '',
        reviews: [],
        sellerName: ''
      }
    }));

    // Calculate totals
    let subtotal = 0;
    let totalQuantity = 0;
    items.forEach((item: any) => {
      const price = parseFloat(item.product.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      subtotal += price * quantity;
      totalQuantity += quantity;
    });

    res.json({
      items,
      subtotal,
      itemCount: totalQuantity,
    });
  })
);

/**
 * POST /api/cart
 * Add item to cart
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, variantId, quantity } = req.body;

    // Validation
    if (!productId || !quantity || quantity < 1) {
      throw createError('Product ID and quantity are required', 400, 'VALIDATION_ERROR');
    }

    // Handle sample- prefix by stripping it before validation and use
    const cleanProductId = typeof productId === 'string' && productId.startsWith('sample-') 
      ? productId.replace('sample-', '') 
      : productId;

    // Check if product exists
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(cleanProductId)) {
      throw createError('Invalid product ID format', 400, 'INVALID_ID');
    }

    const productResult = await query(
      'SELECT id, price, stock FROM public.products WHERE id = $1',
      [cleanProductId]
    );

    if (productResult.rows.length === 0) {
      throw createError('Product not found', 404, 'NOT_FOUND');
    }

    const product = productResult.rows[0];

    // Check stock
    if (product.stock < quantity) {
      throw createError('Insufficient stock', 409, 'INSUFFICIENT_STOCK');
    }

    // Check if item already in cart
    const existingResult = await query(
      `SELECT id, quantity FROM public.cart_items 
       WHERE user_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3`,
      [req.userId, cleanProductId, variantId]
    );

    if (existingResult.rows.length > 0) {
      // Update quantity
      const newQuantity = existingResult.rows[0].quantity + quantity;
      if (product.stock < newQuantity) {
        throw createError('Insufficient stock', 409, 'INSUFFICIENT_STOCK');
      }

      const updateResult = await query(
        `UPDATE public.cart_items 
         SET quantity = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [newQuantity, existingResult.rows[0].id]
      );

      return res.json({
        message: 'Cart item updated',
        item: updateResult.rows[0],
      });
    }

    // Add new item
    const result = await query(
      `INSERT INTO public.cart_items (user_id, product_id, variant_id, quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, cleanProductId, variantId, quantity]
    );

    res.status(201).json({
      message: 'Item added to cart',
      item: result.rows[0],
    });
  })
);

/**
 * PUT /api/cart/:itemId
 * Update cart item quantity
 */
router.put(
  '/:itemId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Validation
    if (!quantity || quantity < 1) {
      throw createError('Quantity must be at least 1', 400, 'VALIDATION_ERROR');
    }

    // Check if item exists and belongs to user
    const itemResult = await query(
      `SELECT ci.id, ci.product_id, p.stock
       FROM public.cart_items ci
       JOIN public.products p ON ci.product_id = p.id
       WHERE ci.id = $1 AND ci.user_id = $2`,
      [itemId, req.userId]
    );

    if (itemResult.rows.length === 0) {
      throw createError('Cart item not found', 404, 'NOT_FOUND');
    }

    const item = itemResult.rows[0];

    // Check stock
    if (item.stock < quantity) {
      throw createError('Insufficient stock', 409, 'INSUFFICIENT_STOCK');
    }

    const result = await query(
      `UPDATE public.cart_items 
       SET quantity = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, itemId]
    );

    res.json({
      message: 'Cart item updated',
      item: result.rows[0],
    });
  })
);

/**
 * DELETE /api/cart/:itemId
 * Remove item from cart
 */
router.delete(
  '/:itemId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { itemId } = req.params;

    // Check if item exists and belongs to user
    const itemResult = await query(
      'SELECT id FROM public.cart_items WHERE id = $1 AND user_id = $2',
      [itemId, req.userId]
    );

    if (itemResult.rows.length === 0) {
      throw createError('Cart item not found', 404, 'NOT_FOUND');
    }

    await query('DELETE FROM public.cart_items WHERE id = $1', [itemId]);

    res.json({ message: 'Item removed from cart' });
  })
);

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await query('DELETE FROM public.cart_items WHERE user_id = $1', [req.userId]);

    res.json({ message: 'Cart cleared' });
  })
);

export default router;

