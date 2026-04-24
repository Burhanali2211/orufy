import { Router, Response } from 'express';
import { query, getClient } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { sendOrderConfirmation } from '../services/emailService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/orders
 * Get all orders for the authenticated user
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await query(
      `SELECT o.id, o.order_number, o.user_id, o.total_amount, o.status,
              o.payment_status, o.payment_method, o.shipping_address,
              o.billing_address, o.tracking_number, o.notes,
              o.created_at, o.updated_at,
              COUNT(oi.id) as item_count
       FROM public.orders o
       LEFT JOIN public.order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.userId]
    );

    // Transform snake_case to camelCase for frontend
    const orders = result.rows.map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      total: row.total_amount || 0, // Map total_amount to total
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      shippingAddress: row.shipping_address,
      billingAddress: row.billing_address,
      trackingNumber: row.tracking_number,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      itemCount: row.item_count
    }));

    res.json({
      success: true,
      data: orders
    });
  })
);

/**
 * GET /api/orders/:id
 * Get a specific order with items
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get order details
    const orderResult = await query(
      `SELECT o.id, o.order_number, o.user_id, o.total_amount, o.subtotal,
              o.tax_amount, o.shipping_amount, o.discount_amount,
              o.status, o.payment_status, o.payment_method, o.shipping_address,
              o.billing_address, o.tracking_number, o.notes,
              o.shipped_at, o.delivered_at,
              o.created_at, o.updated_at
       FROM public.orders o
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, req.userId]
    );

    if (orderResult.rows.length === 0) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    // Get order items
    const itemsResult = await query(
      `SELECT oi.id, oi.product_id, oi.variant_id, oi.quantity,
              oi.unit_price, oi.total_price, oi.product_snapshot,
              p.name as product_name, p.images as product_images
       FROM public.order_items oi
       LEFT JOIN public.products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    // Get order tracking history
    const trackingResult = await query(
      `SELECT id, status, message, location, metadata, created_at
       FROM public.order_tracking
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    const row = orderResult.rows[0];

    // Transform to camelCase
    const order = {
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      total: row.total_amount || 0,
      subtotal: row.subtotal || 0,
      taxAmount: row.tax_amount || 0,
      shippingAmount: row.shipping_amount || 0,
      discountAmount: row.discount_amount || 0,
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      shippingAddress: row.shipping_address,
      billingAddress: row.billing_address,
      trackingNumber: row.tracking_number,
      notes: row.notes,
      shippedAt: row.shipped_at,
      deliveredAt: row.delivered_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      items: itemsResult.rows.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        price: item.unit_price || 0,
        unitPrice: item.unit_price || 0,
        totalPrice: item.total_price || 0,
        subtotal: item.total_price || 0,
        productSnapshot: item.product_snapshot,
        product: {
          id: item.product_id,
          name: item.product_name || item.product_snapshot?.name,
          images: item.product_images || item.product_snapshot?.images || []
        }
      })),
      trackingHistory: trackingResult.rows.map((track: any) => ({
        id: track.id,
        status: track.status,
        message: track.message,
        location: track.location,
        metadata: track.metadata,
        createdAt: track.created_at,
        date: track.created_at
      }))
    };

    res.json({
      success: true,
      data: order
    });
  })
);

/**
 * POST /api/orders
 * Create a new order
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      total,
      razorpay_order_id
    } = req.body;

    // Validation
    if (!items || items.length === 0) {
      throw createError('Order must contain at least one item', 400, 'VALIDATION_ERROR');
    }

    if (!shippingAddress) {
      throw createError('Shipping address is required', 400, 'VALIDATION_ERROR');
    }

    if (!paymentMethod) {
      throw createError('Payment method is required', 400, 'VALIDATION_ERROR');
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Start database transaction
    const client = await getClient();

    try {
      await client.query('BEGIN');
      logger.info('Starting order creation transaction', { context: 'Orders', data: { orderNumber } });

      // Calculate subtotal, tax, and total from items
      let subtotal = 0;
      for (const item of items) {
        const productResult = await client.query(
          'SELECT price, stock FROM public.products WHERE id = $1',
          [item.product_id || item.productId]
        );

        if (productResult.rows.length === 0) {
          throw createError(`Product ${item.product_id || item.productId} not found`, 404, 'NOT_FOUND');
        }

        const product = productResult.rows[0];

        // Check stock availability
        if (product.stock < item.quantity) {
          throw createError(
            `Insufficient stock for product ${item.product_id || item.productId}. Available: ${product.stock}, Requested: ${item.quantity}`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }

        const price = product.price;
        subtotal += price * item.quantity;
      }

      // Calculate tax (18% GST) and shipping
      const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
      const shippingAmount = subtotal >= 2000 ? 0 : 5;
      const calculatedTotal = subtotal + taxAmount + shippingAmount;

      // Create order
      const orderResult = await client.query(
      `INSERT INTO public.orders 
       (user_id, order_number, subtotal, tax_amount, shipping_amount, total_amount, status, payment_status, 
        payment_method, shipping_address, billing_address, razorpay_order_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.userId,
        orderNumber,
        subtotal,
        taxAmount,
        shippingAmount,
        calculatedTotal,
        'pending',
        'pending',
        paymentMethod,
        JSON.stringify(shippingAddress),
        billingAddress ? JSON.stringify(billingAddress) : null,
        razorpay_order_id || null
      ]
    );

      const order = orderResult.rows[0];

      // Create order items with product snapshots
      for (const item of items) {
        const productResult = await client.query(
          `SELECT id, name, description, price, images, sku, category_id, seller_id
           FROM public.products WHERE id = $1`,
          [item.product_id || item.productId]
        );

        const product = productResult.rows[0];
        const price = item.price || product.price;
        const totalPrice = price * item.quantity;

        // Create product snapshot to preserve product details at time of order
        const productSnapshot = {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          images: product.images,
          sku: product.sku,
          categoryId: product.category_id,
          sellerId: product.seller_id
        };

        await client.query(
          `INSERT INTO public.order_items
           (order_id, product_id, variant_id, quantity, unit_price, total_price, product_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            order.id,
            item.product_id || item.productId,
            item.variantId || item.variant_id || null,
            item.quantity,
            price,
            totalPrice,
            JSON.stringify(productSnapshot)
          ]
        );

        // Update product stock
        await client.query(
          'UPDATE public.products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
          [item.quantity, item.product_id || item.productId]
        );
      }

      // Clear user's cart
      await client.query(
        'DELETE FROM public.cart_items WHERE user_id = $1',
        [req.userId]
      );

      // Commit transaction
      await client.query('COMMIT');
      logger.success('Order creation transaction committed', { context: 'Orders', data: { orderId: order.id, orderNumber } });

      // Get user details for email (outside transaction)
      const userResult = await query(
        'SELECT email, full_name FROM public.profiles WHERE id = $1',
        [req.userId]
      );
      const user = userResult.rows[0];

      // Get order items for email (outside transaction)
      const orderItemsResult = await query(
        `SELECT oi.quantity, oi.unit_price, p.name
         FROM public.order_items oi
         LEFT JOIN public.products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );

      // Send order confirmation email (outside transaction - non-critical)
      try {
        await sendOrderConfirmation({
          id: order.id,
          orderNumber: order.order_number,
          customerName: user.full_name,
          customerEmail: user.email,
          items: orderItemsResult.rows.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.unit_price)
          })),
          subtotal: parseFloat(order.subtotal),
          shipping: parseFloat(order.shipping_amount),
          tax: parseFloat(order.tax_amount),
          total: parseFloat(order.total_amount),
          shippingAddress: typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress,
          paymentMethod: order.payment_method,
          createdAt: order.created_at
        });
        logger.info(`Order confirmation email sent for order ${order.order_number}`, { context: 'Orders' });
      } catch (emailError) {
        logger.error('Failed to send order confirmation email', emailError, { context: 'Orders' });
        // Don't fail the order creation if email fails
      }

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });
    } catch (error) {
      // Rollback transaction on error
      try {
        await client.query('ROLLBACK');
        logger.error('Order creation transaction rolled back', error, { context: 'Orders', data: { orderNumber } });
      } catch (rollbackError) {
        logger.error('Failed to rollback transaction', rollbackError, { context: 'Orders' });
      }
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  })
);

/**
 * PUT /api/orders/:id/status
 * Update order status (for customer cancellation only)
 */
router.put(
  '/:id/status',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    // Check if order exists and belongs to user
    const existing = await query(
      'SELECT id, status FROM public.orders WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    // Only allow cancellation by customer
    if (status !== 'cancelled') {
      throw createError('You can only cancel orders', 403, 'FORBIDDEN');
    }

    // Only allow cancellation if order is pending
    if (existing.rows[0].status !== 'pending') {
      throw createError('Only pending orders can be cancelled', 400, 'VALIDATION_ERROR');
    }

    const result = await query(
      `UPDATE public.orders
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, id, req.userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Order cancelled successfully'
    });
  })
);

export default router;

