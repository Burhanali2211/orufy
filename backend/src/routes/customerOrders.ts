import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import { orders, order_items, stores, products, profiles } from '../db/schema';
import { eq, and, sql, or, inArray } from 'drizzle-orm';
import { optionalAuth } from '../middleware/auth';
import { requireStore } from '../middleware/storeResolver';
import { withStoreContext } from '../db/utils';
import { CommunicationService } from '../services/communicationService';

export const customerOrdersRouter = Router();

// In-memory rate limiting for resend confirmation (60 second cooldown per order)
const orderResendCooldowns = new Map<string, number>();

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

    if (userOrders.length === 0) {
      return res.status(200).json({ orders: [] });
    }

    const orderIds = userOrders.map(o => o.id);
    const allItems = await db
      .select()
      .from(order_items)
      .where(inArray(order_items.order_id, orderIds));

    const itemsByOrder = new Map<string, any[]>();
    for (const itm of allItems) {
      if (!itemsByOrder.has(itm.order_id)) {
        itemsByOrder.set(itm.order_id, []);
      }
      itemsByOrder.get(itm.order_id)!.push(itm);
    }

    const ordersWithItems = userOrders.map(ord => ({
      ...ord,
      items: itemsByOrder.get(ord.id) || [],
    }));

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

      // Fetch order items in a single query
      const items = await tx
        .select()
        .from(order_items)
        .where(eq(order_items.order_id, ord.id));

      const productIds = items
        .map((i: any) => i.product_id)
        .filter((id: any): id is string => Boolean(id));

      const productMap = new Map<string, any>();
      if (productIds.length > 0) {
        const prodList = await tx
          .select()
          .from(products)
          .where(inArray(products.id, productIds));
        for (const p of prodList) {
          productMap.set(p.id, p);
        }
      }

      const populatedItems = items.map((item: any) => {
        const p = item.product_id ? productMap.get(item.product_id) : null;
        const productName = (item.product_snapshot as any)?.name || p?.name || 'Product';
        const productImage = (item.product_snapshot as any)?.images?.[0] || (Array.isArray(p?.images) ? p.images[0] : '');
        return {
          id: item.id,
          product_id: item.product_id,
          product_name: productName,
          product_image: productImage,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        };
      });

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
 * 2. POST /api/customer/orders/:id/resend-confirmation
 * Resends order confirmation / receipt email to customer or guest with 60s cooldown.
 */
customerOrdersRouter.post('/:id/resend-confirmation', optionalAuth, async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.id);
    const trackingToken = typeof req.query.token === 'string' ? req.query.token.trim() : (req.body.token || req.body.trackingToken || null);
    const customEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : null;
    const userId = res.locals.user?.id;

    const store = await resolveStoreContext(req, res);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Cooldown check (60s)
    const now = Date.now();
    const lastSent = orderResendCooldowns.get(orderId);
    if (lastSent && now - lastSent < 60000) {
      const waitSeconds = Math.ceil((60000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: `Please wait ${waitSeconds}s before resending confirmation email.`,
        retryAfterSeconds: waitSeconds,
      });
    }

    const [ord] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.store_id, store.id)));

    if (!ord) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access authorization
    const isOwnerSession = userId && ord.user_id && userId === ord.user_id;
    const isValidToken = trackingToken && ord.tracking_token && trackingToken === ord.tracking_token;

    if (!isOwnerSession && !isValidToken) {
      return res.status(403).json({ error: 'Access denied: Valid session or tracking token required' });
    }

    // Target email recipient
    const recipientEmail = customEmail || ord.guest_email || (ord.shipping_address as any)?.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'No recipient email found for this order. Please specify an email.' });
    }

    // Record cooldown
    orderResendCooldowns.set(orderId, now);

    // Fetch items
    const items = await db
      .select()
      .from(order_items)
      .where(eq(order_items.order_id, ord.id));

    const populatedItems = await Promise.all(
      items.map(async (item: any) => {
        let productName = 'Product';
        if (item.product_id) {
          const [p] = await db.select().from(products).where(eq(products.id, item.product_id));
          if (p) productName = p.name;
        }
        return {
          name: (item.product_snapshot as any)?.name || productName,
          quantity: item.quantity,
          pricePaise: item.unit_price,
          sku: item.variant_id || undefined,
        };
      })
    );

    const result = await CommunicationService.dispatchEvent({
      eventType: 'ORDER_CONFIRMED',
      storeId: store.id,
      storeName: store.name,
      storeHostname: store.hostname,
      orderId: ord.id,
      orderNumber: ord.order_number,
      recipientEmail,
      recipientPhone: ord.guest_phone || (ord.shipping_address as any)?.phone,
      recipientName: (ord.shipping_address as any)?.full_name || (ord.shipping_address as any)?.name || 'Valued Customer',
      totalAmountPaise: ord.total_amount,
      subtotalPaise: ord.subtotal,
      taxAmountPaise: ord.tax_amount,
      shippingAmountPaise: ord.shipping_amount,
      discountAmountPaise: ord.discount_amount || undefined,
      items: populatedItems,
      shippingAddress: ord.shipping_address,
      trackingToken: ord.tracking_token || undefined,
    });

    if (!result.success && result.error) {
      return res.status(500).json({ error: result.error || 'Failed to dispatch email' });
    }

    return res.status(200).json({
      success: true,
      message: `Order confirmation receipt has been sent to ${recipientEmail}`,
    });
  } catch (error: any) {
    console.error('Error resending order confirmation email:', error);
    return res.status(500).json({ error: 'Failed to resend confirmation email' });
  }
});

/**
 * 3. POST /api/customer/orders/lookup
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
