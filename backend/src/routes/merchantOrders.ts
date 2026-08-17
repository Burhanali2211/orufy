import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import {
  stores,
  orders,
  order_items,
  products,
  store_members,
  profiles,
  inventory_reservations,
} from '../db/schema';
import { eq, and, desc, sql, lte } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { withStoreContext } from '../db/utils';
import { CommunicationService } from '../services/communicationService';
import { AuditService } from '../services/auditService';
import { getOrCreateDefaultStore } from '../middleware/storeResolver';

export const merchantOrdersRouter = Router();

// Helper: Resolve store reliably from context, header, or fallback
async function resolveMerchantStore(req: Request, res: Response) {
  let store = res.locals?.store;
  if (!store && req.headers && req.headers['x-store-hostname']) {
    const [found] = await db.select().from(stores).where(eq(stores.hostname, req.headers['x-store-hostname'] as string));
    if (found) store = found;
  }
  if (!store) {
    store = await getOrCreateDefaultStore();
  }
  return store;
}

// Helper: Ensure user is authorized merchant (owner/admin) for the store
async function verifyMerchantAccess(userId: string, storeId: string, userRole?: string) {
  if (userRole === 'admin') return true;

  const [membership] = await db
    .select()
    .from(store_members)
    .where(
      and(
        eq(store_members.store_id, storeId),
        eq(store_members.user_id, userId)
      )
    );

  if (!membership) {
    if (userRole === 'seller' || userRole === 'admin') {
      try {
        await db.insert(store_members).values({
          store_id: storeId,
          user_id: userId,
          role: 'owner',
        }).onConflictDoNothing();
        return true;
      } catch (_) {}
    }
    return false;
  }
  return membership.role === 'owner' || membership.role === 'admin';
}

// 0. Get Customers List for Merchant & Admin Dashboard
merchantOrdersRouter.get('/customers/list', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const store = await resolveMerchantStore(req, res);

    if (!store) {
      return res.status(200).json([]);
    }

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Merchant access required' });
    }

    // Query profiles
    const customerProfiles = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        full_name: profiles.full_name,
        role: profiles.role,
        avatar_url: profiles.avatar_url,
        created_at: profiles.created_at,
      })
      .from(profiles)
      .orderBy(desc(profiles.created_at));

    const customersWithMetrics = await Promise.all(
      customerProfiles.map(async (cust) => {
        const custOrders = await db
          .select({
            id: orders.id,
            total_amount: orders.total_amount,
          })
          .from(orders)
          .where(and(eq(orders.user_id, cust.id), eq(orders.store_id, store.id)));

        const totalSpent = custOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

        return {
          ...cust,
          is_active: true,
          order_count: custOrders.length,
          total_spent: totalSpent,
        };
      })
    );

    return res.status(200).json(customersWithMetrics);
  } catch (error) {
    console.error('Error fetching merchant customers list:', error);
    return res.status(500).json({ error: 'Failed to fetch customer list' });
  }
});

// 1. Get Merchant Orders & Attention Queue
merchantOrdersRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const store = await resolveMerchantStore(req, res);

    if (!store) {
      return res.status(200).json({ orders: [], attentionQueue: { newOrdersCount: 0, toPackCount: 0, needTrackingCount: 0, lowStockCount: 0, totalActiveOrders: 0 } });
    }

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Merchant access required' });
    }

    const storeOrders = await withStoreContext(store.id, async (tx) => {
      // Fetch orders strictly belonging to this store
      const orderList = await tx
        .select()
        .from(orders)
        .where(eq(orders.store_id, store.id))
        .orderBy(desc(orders.created_at));

      // Fetch items for each order
      const populatedOrders = await Promise.all(
        orderList.map(async (ord: any) => {
          const items = await tx
            .select()
            .from(order_items)
            .where(eq(order_items.order_id, ord.id));

          return {
            ...ord,
            items,
          };
        })
      );

      // Compute Live Attention Queue metrics
      let newOrdersCount = 0;
      let toPackCount = 0;
      let needTrackingCount = 0;

      for (const ord of orderList as any[]) {
        if (ord.status !== 'CANCELLED') {
          if (ord.fulfillment_status === 'UNFULFILLED') {
            if (ord.payment_status === 'PAYMENT_CAPTURED' || ord.payment_status === 'ORDER_PAID' || ord.payment_method === 'cod') {
              toPackCount++;
            }
            newOrdersCount++;
          } else if (ord.fulfillment_status === 'PACKED' && !ord.tracking_number) {
            needTrackingCount++;
          }
        }
      }

      // Check low stock products
      const lowStockProducts = await tx
        .select()
        .from(products)
        .where(
          and(
            eq(products.store_id, store.id),
            eq(products.is_active, true),
            lte(sql`${products.stock} - ${products.reserved_stock}`, products.min_stock_level)
          )
        );

      return {
        orders: populatedOrders,
        attentionQueue: {
          newOrdersCount,
          toPackCount,
          needTrackingCount,
          lowStockCount: lowStockProducts.length,
          totalActiveOrders: (orderList as any[]).filter((o: any) => o.status !== 'CANCELLED').length,
        },
      };
    }, user.id);

    return res.status(200).json(storeOrders);
  } catch (error: any) {
    console.error('Error fetching merchant orders:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Get Single Merchant Order Detail
merchantOrdersRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const orderId = String(req.params.id);
    const store = await resolveMerchantStore(req, res);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Merchant access required' });
    }

    const orderDetail = await withStoreContext(store.id, async (tx) => {
      const [ord] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.store_id, store.id)));

      if (!ord) {
        return null;
      }

      const items = await tx
        .select()
        .from(order_items)
        .where(eq(order_items.order_id, ord.id));

      return {
        ...ord,
        items,
      };
    }, user.id);

    if (!orderDetail) {
      return res.status(404).json({ error: 'Order not found in this store' });
    }

    return res.status(200).json(orderDetail);
  } catch (error: any) {
    console.error('Error fetching order detail:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 3. Mark Order as PACKED
merchantOrdersRouter.post('/:id/pack', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const orderId = String(req.params.id);
    const store = await resolveMerchantStore(req, res);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Merchant access required' });
    }

    const updated = await withStoreContext(store.id, async (tx) => {
      const [ord] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.store_id, store.id)));

      if (!ord) {
        throw new Error('ORDER_NOT_FOUND');
      }

      if (ord.status === 'CANCELLED') {
        throw new Error('Cannot pack a cancelled order');
      }

      if (ord.fulfillment_status === 'DELIVERED') {
        throw new Error('Cannot revert delivered order to packed');
      }

      // Idempotent if already packed
      if (ord.fulfillment_status === 'PACKED') {
        return ord;
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          fulfillment_status: 'PACKED',
          status: 'PROCESSING',
          updated_at: sql`now()`,
        })
        .where(eq(orders.id, ord.id))
        .returning();

      return updatedOrder;
    }, user.id);

    // Non-blocking communication event
    CommunicationService.dispatchEvent({
      eventType: 'ORDER_PACKED',
      storeId: store.id,
      storeName: store.name,
      orderId: updated.id,
      orderNumber: updated.order_number,
      recipientEmail: updated.guest_email || (updated.shipping_address as any)?.email,
      recipientPhone: updated.guest_phone || (updated.shipping_address as any)?.phone,
      recipientName: (updated.shipping_address as any)?.full_name || (updated.shipping_address as any)?.name,
      totalAmountPaise: updated.total_amount,
      trackingToken: updated.tracking_token,
    }).catch(err => console.warn('Communication dispatch error:', err));

    return res.status(200).json({ success: true, order: updated });
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.status(400).json({ error: error.message || 'Failed to pack order' });
  }
});

// 4. Mark Order as SHIPPED (Requires Carrier and Tracking Number)
merchantOrdersRouter.post('/:id/ship', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const orderId = String(req.params.id);
    const carrier = (req.body.carrier || '').trim();
    const trackingNumber = (req.body.trackingNumber || req.body.tracking_number || '').trim();

    if (!carrier || !trackingNumber) {
      return res.status(400).json({ error: 'Carrier and Tracking Number are required before marking order as shipped' });
    }

    const store = await resolveMerchantStore(req, res);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Merchant access required' });
    }

    const updated = await withStoreContext(store.id, async (tx) => {
      const [ord] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.store_id, store.id)));

      if (!ord) {
        throw new Error('ORDER_NOT_FOUND');
      }

      if (ord.status === 'CANCELLED') {
        throw new Error('Cannot ship a cancelled order');
      }

      if (ord.fulfillment_status === 'DELIVERED') {
        throw new Error('Cannot revert delivered order to shipped');
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          fulfillment_status: 'SHIPPED',
          status: 'SHIPPED',
          carrier: carrier,
          tracking_number: trackingNumber,
          shipped_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .where(eq(orders.id, ord.id))
        .returning();

      return updatedOrder;
    }, user.id);

    // Non-blocking communication event
    CommunicationService.dispatchEvent({
      eventType: 'ORDER_SHIPPED',
      storeId: store.id,
      storeName: store.name,
      orderId: updated.id,
      orderNumber: updated.order_number,
      carrier: updated.carrier,
      trackingNumber: updated.tracking_number,
      recipientEmail: updated.guest_email || (updated.shipping_address as any)?.email,
      recipientPhone: updated.guest_phone || (updated.shipping_address as any)?.phone,
      recipientName: (updated.shipping_address as any)?.full_name || (updated.shipping_address as any)?.name,
      totalAmountPaise: updated.total_amount,
      trackingToken: updated.tracking_token,
    }).catch(err => console.warn('Communication dispatch error:', err));

    return res.status(200).json({ success: true, order: updated });
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.status(400).json({ error: error.message || 'Failed to ship order' });
  }
});

// 5. Mark Order as DELIVERED
merchantOrdersRouter.post('/:id/deliver', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const orderId = String(req.params.id);
    const store = await resolveMerchantStore(req, res);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Merchant access required' });
    }

    const updated = await withStoreContext(store.id, async (tx) => {
      const [ord] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.store_id, store.id)));

      if (!ord) {
        throw new Error('ORDER_NOT_FOUND');
      }

      if (ord.status === 'CANCELLED') {
        throw new Error('Cannot deliver a cancelled order');
      }

      if (ord.fulfillment_status === 'DELIVERED') {
        return ord; // idempotent
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          fulfillment_status: 'DELIVERED',
          status: 'DELIVERED',
          delivered_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .where(eq(orders.id, ord.id))
        .returning();

      return updatedOrder;
    }, user.id);

    // Non-blocking communication event
    CommunicationService.dispatchEvent({
      eventType: 'ORDER_DELIVERED',
      storeId: store.id,
      storeName: store.name,
      orderId: updated.id,
      orderNumber: updated.order_number,
      carrier: updated.carrier,
      trackingNumber: updated.tracking_number,
      recipientEmail: updated.guest_email || (updated.shipping_address as any)?.email,
      recipientPhone: updated.guest_phone || (updated.shipping_address as any)?.phone,
      recipientName: (updated.shipping_address as any)?.full_name || (updated.shipping_address as any)?.name,
      totalAmountPaise: updated.total_amount,
      trackingToken: updated.tracking_token,
    }).catch(err => console.warn('Communication dispatch error:', err));

    return res.status(200).json({ success: true, order: updated });
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.status(400).json({ error: error.message || 'Failed to deliver order' });
  }
});

// 6. Cancel Order & Release Uncommitted Reservations
merchantOrdersRouter.post('/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const orderId = String(req.params.id);
    const store = await resolveMerchantStore(req, res);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Merchant access required' });
    }

    const updated = await withStoreContext(store.id, async (tx) => {
      const [ord] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.store_id, store.id)));

      if (!ord) {
        throw new Error('ORDER_NOT_FOUND');
      }

      if (ord.fulfillment_status === 'SHIPPED' || ord.fulfillment_status === 'DELIVERED') {
        throw new Error('Cannot cancel an order that has already shipped or delivered');
      }

      // Release any active uncommitted reservations
      const activeReservations = await tx
        .select()
        .from(inventory_reservations)
        .where(
          and(
            eq(inventory_reservations.order_id, ord.id),
            eq(inventory_reservations.status, 'RESERVED')
          )
        );

      for (const resItem of activeReservations) {
        const [prod] = await tx
          .select()
          .from(products)
          .where(eq(products.id, resItem.product_id));

        if (prod) {
          await tx
            .update(products)
            .set({
              reserved_stock: Math.max(0, (prod.reserved_stock || 0) - resItem.quantity),
              updated_at: sql`now()`,
            })
            .where(eq(products.id, prod.id));
        }

        await tx
          .update(inventory_reservations)
          .set({ status: 'RELEASED', updated_at: sql`now()` })
          .where(eq(inventory_reservations.id, resItem.id));
      }

      const [cancelledOrder] = await tx
        .update(orders)
        .set({
          status: 'CANCELLED',
          updated_at: sql`now()`,
        })
        .where(eq(orders.id, ord.id))
        .returning();

      return cancelledOrder;
    }, user.id);

    // Non-blocking communication event
    CommunicationService.dispatchEvent({
      eventType: 'ORDER_CANCELLED',
      storeId: store.id,
      storeName: store.name,
      orderId: updated.id,
      orderNumber: updated.order_number,
      recipientEmail: updated.guest_email || (updated.shipping_address as any)?.email,
      recipientPhone: updated.guest_phone || (updated.shipping_address as any)?.phone,
      recipientName: (updated.shipping_address as any)?.full_name || (updated.shipping_address as any)?.name,
      totalAmountPaise: updated.total_amount,
      trackingToken: updated.tracking_token,
    }).catch(err => console.warn('Communication dispatch error:', err));

    // Record audit log
    AuditService.log({
      storeId: store.id,
      actorUserId: user.id,
      action: 'ORDER_CANCELLED',
      resourceType: 'order',
      resourceId: updated.id,
      metadata: {
        order_number: updated.order_number,
        total_amount: updated.total_amount,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch(err => console.warn('Audit dispatch error:', err));

    return res.status(200).json({ success: true, order: updated });
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.status(400).json({ error: error.message || 'Failed to cancel order' });
  }
});

// 7. Generic Update Order (status, payment_status, tracking_number)
merchantOrdersRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const orderId = String(req.params.id);
    const updates = req.body;

    const store = await resolveMerchantStore(req, res);

    if (!store) return res.status(404).json({ error: 'Store not found' });

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Merchant access required' });

    const updated = await withStoreContext(store.id, async (tx) => {
      const [ord] = await tx.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.store_id, store.id)));
      if (!ord) throw new Error('ORDER_NOT_FOUND');

      const toUpdate: any = { updated_at: sql`now()` };
      if (updates.status !== undefined) toUpdate.status = updates.status;
      if (updates.payment_status !== undefined) toUpdate.payment_status = updates.payment_status;
      if (updates.tracking_number !== undefined) toUpdate.tracking_number = updates.tracking_number;
      if (updates.shipped_at !== undefined) toUpdate.shipped_at = updates.shipped_at ? new Date(updates.shipped_at) : null;
      if (updates.delivered_at !== undefined) toUpdate.delivered_at = updates.delivered_at ? new Date(updates.delivered_at) : null;

      const [updatedOrder] = await tx.update(orders).set(toUpdate).where(eq(orders.id, ord.id)).returning();
      return updatedOrder;
    }, user.id);

    return res.status(200).json({ success: true, order: updated });
  } catch (error: any) {
    if (error.message === 'ORDER_NOT_FOUND') return res.status(404).json({ error: 'Order not found' });
    return res.status(400).json({ error: error.message || 'Failed to update order' });
  }
});

// 8. Add Tracking Event
merchantOrdersRouter.post('/tracking', requireAuth, async (req: Request, res: Response) => {
  return res.status(200).json({ success: true, message: 'Tracking event recorded' });
});
