import { Router, Response } from 'express';
import { query } from '../../db/connection.js';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.js';
import { asyncHandler, createError } from '../../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/admin/pos/orders
 * Create a manual (POS) order
 */
router.post(
  '/orders',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { 
      items, 
      customer_name, 
      customer_email, 
      customer_phone,
      payment_method,
      notes,
      discount_amount = 0,
      shipping_amount = 0
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError('Items are required', 400);
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    const total_amount = subtotal + shipping_amount - discount_amount;
    const order_number = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order
    const orderResult = await query(
      `INSERT INTO public.orders (
        order_number, guest_name, guest_email, subtotal, total_amount, 
        discount_amount, shipping_amount, status, payment_status, 
        payment_method, source, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        order_number, 
        customer_name || 'Walk-in Customer', 
        customer_email || null,
        subtotal,
        total_amount,
        discount_amount,
        shipping_amount,
        'delivered', // POS orders are usually delivered immediately
        'paid',      // POS orders are usually paid immediately
        payment_method || 'Cash',
        'pos',
        notes
      ]
    );

    const order = orderResult.rows[0];

    // Create order items and update stock
    for (const item of items) {
      // Create order item
      await query(
        `INSERT INTO public.order_items (
          order_id, product_id, variant_id, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.product_id, item.variant_id || null, item.quantity, item.price, item.price * item.quantity]
      );

      // Deduct stock
      let currentStock = 0;
      if (item.variant_id) {
        const vResult = await query('SELECT stock FROM public.product_variants WHERE id = $1', [item.variant_id]);
        currentStock = vResult.rows[0].stock;
        await query('UPDATE public.product_variants SET stock = stock - $1 WHERE id = $2', [item.quantity, item.variant_id]);
      } else {
        const pResult = await query('SELECT stock FROM public.products WHERE id = $1', [item.product_id]);
        currentStock = pResult.rows[0].stock;
        await query('UPDATE public.products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
      }

      // Create stock movement
      await query(
        `INSERT INTO public.stock_movements (
          product_id, variant_id, change_amount, new_stock, type, reference_id, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.product_id, 
          item.variant_id || null, 
          -item.quantity, 
          currentStock - item.quantity, 
          'order_deduction', 
          order.id, 
          `POS Order ${order_number}`,
          req.userId
        ]
      );
    }

    res.json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  })
);

export default router;
