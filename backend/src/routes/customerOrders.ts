import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { orders, order_items, stores, products, profiles } from '../db/schema';
import { eq, and, sql, or } from 'drizzle-orm';
import { optionalAuth } from '../middleware/auth';
import { requireStore } from '../middleware/storeResolver';
import { withStoreContext } from '../db/utils';

export const customerOrdersRouter = Router();

/**
 * Helper to resolve store from res.locals or x-store-hostname header.
 */
async function resolveStoreContext(req: Request, res: Response) {
  let store = res.locals?.store;
  if (!store && res.locals?.storeId) {
    const [found] = await db.select().from(stores).where(eq(stores.id, res.locals.storeId));
    store = found;
  }
  if (!store && req.headers && req.headers['x-store-hostname']) {
    const [found] = await db.select().from(stores).where(eq(stores.hostname, req.headers['x-store-hostname'] as string));
    store = found;
  }
  return store;
}

/**
 * 0. GET /api/customer/orders/
 * Returns all orders placed by the currently authenticated user.
 */
customerOrdersRouter.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please login to view orders.' });
    }

    const store = await resolveStoreContext(req, res);

    const whereClause = store?.id
      ? and(eq(orders.user_id, userId), eq(orders.store_id, store.id))
      : eq(orders.user_id, userId);

    const userOrders = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(sql`${orders.created_at} DESC`);

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      userOrders.map(async (ord) => {
        const items = await db
          .select()
          .from(order_items)
          .where(eq(order_items.order_id, ord.id));
        return {
          ...ord,
          items,
        };
      })
    );

    return res.status(200).json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Fetch customer orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * 1. GET /api/customer/orders/:id
 * Fetches order details with strict multi-tenant and customer authorization checks.
 * Requires either matching customer session or valid tracking_token query parameter.
 */
customerOrdersRouter.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const trackingToken = typeof req.query.token === 'string' ? req.query.token.trim() : null;
    const userId = res.locals.user?.id;

    const store = await resolveStoreContext(req, res);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const orderDetail = await withStoreContext(store.id, async (tx) => {
      const [ord] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.store_id, store.id)));

      if (!ord) {
        return null;
      }

      // Authorization verification:
      // 1. Authenticated user matches order.user_id
      // 2. Or tracking_token query matches ord.tracking_token
      const isOwnerSession = userId && ord.user_id && userId === ord.user_id;
      const isValidToken = trackingToken && ord.tracking_token && trackingToken === ord.tracking_token;

      if (!isOwnerSession && !isValidToken) {
        return { isForbidden: true };
      }

      // Fetch order items with snapshot / product details
      const items = await tx
        .select()
        .from(order_items)
        .where(eq(order_items.order_id, ord.id));

      const populatedItems = await Promise.all(
        items.map(async (item: any) => {
          let productName = 'Product';
          let productImage = '';
          if (item.product_id) {
            const [p] = await tx.select().from(products).where(eq(products.id, item.product_id));
            if (p) {
              productName = p.name;
              productImage = Array.isArray(p.images) ? p.images[0] : '';
            }
          }
          return {
            id: item.id,
            product_id: item.product_id,
            product_name: (item.product_snapshot as any)?.name || productName,
            product_image: (item.product_snapshot as any)?.images?.[0] || productImage,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          };
        })
      );

      // Customer-safe Sanitized Order Projection (merchant internals hidden)
      return {
        order: {
          id: ord.id,
          order_number: ord.order_number,
          status: ord.status,
          payment_status: ord.payment_status,
          fulfillment_status: ord.fulfillment_status,
          payment_method: ord.payment_method,
          subtotal: ord.subtotal,
          tax_amount: ord.tax_amount,
          shipping_amount: ord.shipping_amount,
          discount_amount: ord.discount_amount || 0,
          total_amount: ord.total_amount,
          currency: ord.currency,
          shipping_address: ord.shipping_address,
          carrier: ord.carrier,
          tracking_number: ord.tracking_number,
          shipped_at: ord.shipped_at,
          delivered_at: ord.delivered_at,
          created_at: ord.created_at,
          tracking_token: ord.tracking_token,
          items: populatedItems,
        },
        store: {
          id: store.id,
          name: store.name,
          hostname: store.hostname,
          subdomain: store.subdomain,
          logo_url: store.logo_url,
          primary_color: store.primary_color,
          currency: store.currency,
        },
      };
    }, userId);

    if (!orderDetail) {
      return res.status(404).json({ error: 'Order not found in this store' });
    }

    if ((orderDetail as any).isForbidden) {
      return res.status(403).json({ error: 'Access denied: Valid session or tracking token required' });
    }

    return res.status(200).json(orderDetail);
  } catch (error: any) {
    console.error('Error fetching customer order:', error);
    return res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

/**
 * 2. POST /api/customer/orders/lookup
 * Allows customers to track an order with Order Number + Email / Phone.
 */
customerOrdersRouter.post('/lookup', async (req: Request, res: Response) => {
  try {
    const orderNumber = (req.body.orderNumber || req.body.order_number || '').trim();
    const emailOrPhone = (req.body.emailOrPhone || req.body.email_or_phone || req.body.identifier || '').trim().toLowerCase();

    if (!orderNumber || !emailOrPhone) {
      return res.status(400).json({ error: 'Order Number and Email or Phone Number are required' });
    }

    const store = await resolveStoreContext(req, res);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const result = await withStoreContext(store.id, async (tx) => {
      // Find orders matching order_number in current store
      const [ord] = await tx
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.order_number, orderNumber),
            eq(orders.store_id, store.id)
          )
        );

      if (!ord) {
        return null;
      }

      // Check if emailOrPhone matches guest_email, guest_phone, or shipping address
      const guestEmail = (ord.guest_email || '').toLowerCase();
      const guestPhone = (ord.guest_phone || '').toLowerCase();
      const shippingPhone = (ord.shipping_address as any)?.phone || (ord.shipping_address as any)?.phoneNumber || '';
      const shippingEmail = (ord.shipping_address as any)?.email || '';

      const isMatch =
        guestEmail === emailOrPhone ||
        guestPhone === emailOrPhone ||
        shippingPhone.toLowerCase() === emailOrPhone ||
        shippingEmail.toLowerCase() === emailOrPhone;

      if (!isMatch && ord.user_id) {
        // Also check profile
        const [profile] = await tx.select().from(profiles).where(eq(profiles.id, ord.user_id));
        if (profile) {
          if (profile.email?.toLowerCase() === emailOrPhone || profile.phone?.toLowerCase() === emailOrPhone) {
            return ord;
          }
        }
      }

      return isMatch ? ord : null;
    });

    if (!result) {
      return res.status(404).json({ error: 'No matching order found for the provided details in this store' });
    }

    return res.status(200).json({
      orderId: result.id,
      orderNumber: result.order_number,
      trackingToken: result.tracking_token,
      status: result.status,
      fulfillmentStatus: result.fulfillment_status,
      carrier: result.carrier,
      trackingNumber: result.tracking_number,
    });
  } catch (error: any) {
    console.error('Error looking up customer order:', error);
    return res.status(500).json({ error: 'Failed to lookup order' });
  }
});
