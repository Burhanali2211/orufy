import { Router, Response } from 'express';
import { query } from '../../db/connection';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { asyncHandler, createError } from '../../middleware/errorHandler';

const router = Router();

/**
 * GET /api/seller/orders
 * Get all orders for products sold by this seller with pagination and filters
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
      status = '',
      payment_status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build WHERE clause for orders that contain products from this seller
    const conditions: string[] = ['p.seller_id = $1'];
    const params: any[] = [req.userId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(o.order_number ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex})`);
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
      `SELECT COUNT(DISTINCT o.id) as total 
       FROM public.orders o
       LEFT JOIN public.order_items oi ON o.id = oi.order_id
       LEFT JOIN public.products p ON oi.product_id = p.id
       LEFT JOIN public.profiles u ON o.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get orders
    const validSortColumns = ['order_number', 'total_amount', 'status', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const ordersResult = await query(
      `SELECT DISTINCT o.*, 
              u.full_name as customer_name, 
              u.email as customer_email,
              COUNT(oi.id) as item_count
       FROM public.orders o
       LEFT JOIN public.order_items oi ON o.id = oi.order_id
       LEFT JOIN public.products p ON oi.product_id = p.id
       LEFT JOIN public.profiles u ON o.user_id = u.id
       ${whereClause}
       GROUP BY o.id, u.full_name, u.email
       ORDER BY o.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
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
 * GET /api/seller/orders/:id
 * Get single order by ID with items (only if it contains seller's products)
 */
router.get(
  '/:id',
  authenticate,
  authorize('seller'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if order contains seller's products
    const orderCheck = await query(
      `SELECT o.id
       FROM public.orders o
       LEFT JOIN public.order_items oi ON o.id = oi.order_id
       LEFT JOIN public.products p ON oi.product_id = p.id
       WHERE o.id = $1 AND p.seller_id = $2`,
      [id, req.userId]
    );

    if (orderCheck.rows.length === 0) {
      throw createError('Order not found or does not contain your products', 404, 'NOT_FOUND');
    }

    // Get order details
    const orderResult = await query(
      `SELECT o.*, 
              u.full_name as customer_name, 
              u.email as customer_email,
              u.phone as customer_phone
       FROM public.orders o
       LEFT JOIN public.profiles u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      throw createError('Order not found', 404, 'NOT_FOUND');
    }

    // Get order items (only seller's products)
    const itemsResult = await query(
      `SELECT oi.*, 
              p.name as product_name,
              p.images as product_images
       FROM public.order_items oi
       LEFT JOIN public.products p ON oi.product_id = p.id
       WHERE oi.order_id = $1 AND p.seller_id = $2`,
      [id, req.userId]
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
 * PATCH /api/seller/orders/:id/status
 * Update order status for seller's products (limited to shipped/delivered)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('seller'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['shipped', 'delivered'];
    
    if (!status || !validStatuses.includes(status)) {
      throw createError('Invalid status. Sellers can only update to shipped or delivered', 400, 'VALIDATION_ERROR');
    }

    // Check if order exists and contains seller's products
    const existingOrder = await query(
      `SELECT o.id, o.status
       FROM public.orders o
       LEFT JOIN public.order_items oi ON o.id = oi.order_id
       LEFT JOIN public.products p ON oi.product_id = p.id
       WHERE o.id = $1 AND p.seller_id = $2`,
      [id, req.userId]
    );

    if (existingOrder.rows.length === 0) {
      throw createError('Order not found or does not contain your products', 404, 'NOT_FOUND');
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
 * PATCH /api/seller/orders/:id/tracking
 * Update order tracking number
 */
router.patch(
  '/:id/tracking',
  authenticate,
  authorize('seller'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { tracking_number } = req.body;

    if (!tracking_number) {
      throw createError('Tracking number is required', 400, 'VALIDATION_ERROR');
    }

    // Check if order contains seller's products
    const orderCheck = await query(
      `SELECT o.id
       FROM public.orders o
       LEFT JOIN public.order_items oi ON o.id = oi.order_id
       LEFT JOIN public.products p ON oi.product_id = p.id
       WHERE o.id = $1 AND p.seller_id = $2`,
      [id, req.userId]
    );

    if (orderCheck.rows.length === 0) {
      throw createError('Order not found or does not contain your products', 404, 'NOT_FOUND');
    }

    const result = await query(
      `UPDATE public.orders 
       SET tracking_number = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [tracking_number, id]
    );

    res.json({
      success: true,
      message: 'Tracking number updated successfully',
      data: result.rows[0]
    });
  })
);

export default router;