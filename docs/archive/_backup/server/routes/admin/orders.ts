import { Router, Response } from 'express';
import { query } from '../../db/connection';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { asyncHandler, createError } from '../../middleware/errorHandler';

const router = Router();

/**
 * GET /api/admin/orders
 * Get all orders with pagination and filters
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
      status = '',
      payment_status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(o.order_number ILIKE $${paramIndex} OR p.email ILIKE $${paramIndex} OR p.full_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`o.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (payment_status) {
      conditions.push(`o.payment_status = $${paramIndex}`);
      params.push(payment_status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM public.orders o
       LEFT JOIN public.profiles p ON o.user_id = p.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get orders
    const validSortColumns = ['order_number', 'total_amount', 'status', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    params.push(limit, offset);
    const ordersResult = await query(
      `SELECT o.*, 
              p.full_name as customer_name, 
              p.email as customer_email,
              COUNT(oi.id) as item_count
       FROM public.orders o
       LEFT JOIN public.profiles p ON o.user_id = p.id
       LEFT JOIN public.order_items oi ON o.id = oi.order_id
       ${whereClause}
       GROUP BY o.id, p.full_name, p.email
       ORDER BY o.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      success: true,
      data: ordersResult.rows,
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
 * GET /api/admin/orders/:id
 * Get single order by ID with items
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get order details
    const orderResult = await query(
      `SELECT o.*, 
              p.full_name as customer_name, 
              p.email as customer_email,
              p.phone as customer_phone
       FROM public.orders o
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    // Get order items
    const itemsResult = await query(
      `SELECT oi.*, 
              p.name as product_name,
              p.images as product_images
       FROM public.order_items oi
       LEFT JOIN public.products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...orderResult.rows[0],
        items: itemsResult.rows
      }
    });
  })
);

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!status || !validStatuses.includes(status)) {
      throw createError('Invalid status', 400, 'VALIDATION_ERROR');
    }

    // Check if order exists
    const existingOrder = await query(
      'SELECT id, status FROM public.orders WHERE id = $1',
      [id]
    );

    if (existingOrder.rows.length === 0) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    // Update status and set shipped_at or delivered_at if applicable
    let updateQuery = `UPDATE public.orders SET status = $1, updated_at = NOW()`;
    const params: any[] = [status];
    const paramIndex = 2;

    if (status === 'shipped' && existingOrder.rows[0].status !== 'shipped') {
      updateQuery += `, shipped_at = NOW()`;
    }

    if (status === 'delivered' && existingOrder.rows[0].status !== 'delivered') {
      updateQuery += `, delivered_at = NOW()`;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const result = await query(updateQuery, params);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: result.rows[0]
    });
  })
);

/**
 * PATCH /api/admin/orders/:id/payment-status
 * Update order payment status
 */
router.patch(
  '/:id/payment-status',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { payment_status } = req.body;

    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    
    if (!payment_status || !validStatuses.includes(payment_status)) {
      throw createError('Invalid payment status', 400, 'VALIDATION_ERROR');
    }

    const result = await query(
      `UPDATE public.orders 
       SET payment_status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [payment_status, id]
    );

    if (result.rows.length === 0) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: result.rows[0]
    });
  })
);

/**
 * PATCH /api/admin/orders/:id/tracking
 * Update order tracking number
 */
router.patch(
  '/:id/tracking',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { tracking_number } = req.body;

    // Allow empty string or null to clear tracking number
    const trackingValue = tracking_number && tracking_number.trim() ? tracking_number.trim() : null;

    const result = await query(
      `UPDATE public.orders 
       SET tracking_number = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [trackingValue, id]
    );

    if (result.rows.length === 0) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Tracking number updated successfully',
      data: result.rows[0]
    });
  })
);

/**
 * DELETE /api/admin/orders/:id
 * Delete order (soft delete by setting status to cancelled)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
      `UPDATE public.orders 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  })
);

/**
 * GET /api/admin/orders/:id/invoice
 * Get order invoice data
 */
router.get(
  '/:id/invoice',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get order with customer details
    const orderResult = await query(
      `SELECT o.*, 
              p.full_name as customer_name, 
              p.email as customer_email,
              p.phone as customer_phone
       FROM public.orders o
       LEFT JOIN public.profiles p ON o.user_id = p.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    // Get order items with product details
    const itemsResult = await query(
      `SELECT oi.*, 
              p.name as product_name,
              p.sku as product_sku
       FROM public.order_items oi
       LEFT JOIN public.products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        order: orderResult.rows[0],
        items: itemsResult.rows
      }
    });
  })
);

export default router;

