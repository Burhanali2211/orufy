import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/db';
import {
  stores,
  orders,
  order_items,
  products,
  store_members,
  profiles,
  inventory_reservations,
  email_verification_tokens,
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

// Helper: Ensure user is authorized merchant (owner/admin/seller) for the store
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
    return false;
  }
  return membership.role === 'owner' || membership.role === 'admin' || membership.role === 'seller';
}

// 0. Get Customers List for Merchant & Admin Dashboard (Strictly scoped to current store)
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

    const storeCustomers = await withStoreContext(store.id, async (tx) => {
      const orderRows = await tx
        .select({
          id: profiles.id,
          email: profiles.email,
          full_name: profiles.full_name,
          role: profiles.role,
          avatar_url: profiles.avatar_url,
          created_at: profiles.created_at,
          order_id: orders.id,
          order_amount: orders.total_amount,
        })
        .from(orders)
        .innerJoin(profiles, eq(orders.user_id, profiles.id))
        .where(eq(orders.store_id, store.id));

      const customerMap = new Map<string, any>();
      for (const row of orderRows) {
        if (!customerMap.has(row.id)) {
          customerMap.set(row.id, {
            id: row.id,
            email: row.email,
            full_name: row.full_name,
            role: row.role,
            avatar_url: row.avatar_url,
            created_at: row.created_at,
            is_active: true,
            order_count: 0,
            total_spent: 0,
          });
        }
        const record = customerMap.get(row.id);
        record.order_count += 1;
        record.total_spent += (row.order_amount || 0);
      }

      return Array.from(customerMap.values()).sort((a, b) => b.total_spent - a.total_spent);
    }, user.id);

    return res.status(200).json(storeCustomers);
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

// 9. Get Order Communication Logs
merchantOrdersRouter.get('/:id/communications', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const orderId = String(req.params.id);
    const store = await resolveMerchantStore(req, res);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Merchant access required' });

    const logs = await CommunicationService.getOrderCommunications(store.id, orderId);
    return res.status(200).json({ communications: logs });
  } catch (error: any) {
    console.error('Error fetching order communications:', error);
    return res.status(500).json({ error: 'Failed to fetch communication logs' });
  }
});

// 10. Resend Order Email (Order Confirmation, Shipping, Delivered, Cancelled, Invoice)
merchantOrdersRouter.post('/:id/resend-email', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const orderId = String(req.params.id);
    const eventType = (req.body.eventType || req.body.event_type || 'ORDER_CONFIRMED') as any;
    const customEmail = (req.body.recipientEmail || req.body.email || '').trim().toLowerCase();

    const store = await resolveMerchantStore(req, res);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Merchant access required' });

    const [ord] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.store_id, store.id)));

    if (!ord) return res.status(404).json({ error: 'Order not found' });

    const recipientEmail = customEmail || ord.guest_email || (ord.shipping_address as any)?.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required to resend notification' });
    }

    // Fetch order items
    const items = await db.select().from(order_items).where(eq(order_items.order_id, ord.id));
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
      eventType,
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
      carrier: ord.carrier || req.body.carrier || undefined,
      trackingNumber: ord.tracking_number || req.body.trackingNumber || undefined,
      trackingToken: ord.tracking_token || undefined,
      items: populatedItems,
      shippingAddress: ord.shipping_address,
      customSubject: req.body.customSubject,
    });

    // Log audit action
    AuditService.log({
      storeId: store.id,
      actorUserId: user.id,
      action: 'EMAIL_RESENT',
      resourceType: 'order',
      resourceId: ord.id,
      metadata: {
        event_type: eventType,
        recipient: recipientEmail,
        success: result.success,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    if (!result.success && result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      message: `Email (${eventType}) sent successfully to ${recipientEmail}`,
    });
  } catch (error: any) {
    console.error('Error resending merchant order email:', error);
    return res.status(500).json({ error: 'Failed to resend email' });
  }
});

// 11. Resend Verification Email to Customer
merchantOrdersRouter.post('/customers/:id/resend-verification', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const customerId = String(req.params.id);
    const store = await resolveMerchantStore(req, res);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const isAuthorized = await verifyMerchantAccess(user.id, store.id, user.role);
    if (!isAuthorized && user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Merchant access required' });

    const [targetUser] = await db.select().from(profiles).where(eq(profiles.id, customerId));
    if (!targetUser) return res.status(404).json({ error: 'Customer not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.delete(email_verification_tokens).where(
      and(
        eq(email_verification_tokens.user_id, targetUser.id),
        eq(email_verification_tokens.token_type, 'EMAIL_VERIFICATION')
      )
    );

    await db.insert(email_verification_tokens).values({
      user_id: targetUser.id,
      token,
      token_type: 'EMAIL_VERIFICATION',
      expires_at: expiresAt,
    });

    const baseUrl = store.hostname ? `https://${store.hostname}` : (process.env.FRONTEND_URL || 'https://get-oru.com');
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    const result = await CommunicationService.dispatchEvent({
      eventType: 'EMAIL_VERIFICATION',
      storeId: store.id,
      storeName: store.name,
      storeHostname: store.hostname,
      recipientEmail: targetUser.email,
      recipientName: targetUser.full_name || 'Customer',
      verificationUrl,
    });

    return res.status(200).json({
      success: true,
      message: `Verification email dispatched to ${targetUser.email}`,
    });
  } catch (error: any) {
    console.error('Error sending customer verification email:', error);
    return res.status(500).json({ error: 'Failed to send verification email' });
  }
});

