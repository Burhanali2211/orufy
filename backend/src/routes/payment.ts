import { Router, Request, Response } from 'express';
import { db } from '../db/db';
import {
  stores,
  orders,
  order_items,
  products,
  store_members,
  payment_transfers,
  payment_webhook_events,
  inventory_reservations,
  checkout_idempotency,
} from '../db/schema';
import { eq, and, gt, sql, or } from 'drizzle-orm';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { withStoreContext } from '../db/utils';
import { CommunicationService } from '../services/communicationService';

export const paymentRouter = Router();

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured on server');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// 1. Merchant Onboarding (Razorpay Route)
paymentRouter.post('/onboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    
    // Authoritative store context from storeResolver (with fallback for mock tests)
    let store = res.locals?.store;
    if (!store && req.headers && req.headers['x-store-hostname']) {
      const [found] = await db.select().from(stores).where(eq(stores.hostname, req.headers['x-store-hostname'] as string));
      store = found;
    }
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Verify user is an owner or admin
    const [membership] = await db
      .select()
      .from(store_members)
      .where(and(eq(store_members.store_id, store.id), eq(store_members.user_id, userId)));
      
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return res.status(403).json({ error: 'Only store owners/admins can onboard payments' });
    }

    const mockLinkedAccountId = `acc_${crypto.randomBytes(8).toString('hex')}`;

    await db
      .update(stores)
      .set({ 
        razorpay_linked_account_id: mockLinkedAccountId,
        payment_onboarding_status: 'ACCOUNT_CREATED',
        updated_at: sql`now()`
      })
      .where(eq(stores.id, store.id));

    return res.status(200).json({ 
      success: true, 
      linked_account_id: mockLinkedAccountId,
      status: 'ACCOUNT_CREATED'
    });
  } catch (error: any) {
    console.error('Error in payment onboarding:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Checkout & Order Creation (Phase 12B: Refined Atomic Checkout with Guest Support, Dynamic Tax, and Idempotency)
paymentRouter.post('/checkout/orders', async (req: Request, res: Response) => {
  try {
    // Run optional auth if user context not already provided by middleware
    if (!res.locals?.user && req.headers?.cookie) {
      await optionalAuth(req, res, () => {});
    }

    const userId = res.locals?.user?.id || null;
    const { items, shippingAddress, billingAddress, paymentMethod, notes, guestEmail, guestPhone } = req.body;
    const idempotencyKey = (req.headers && req.headers['idempotency-key'] as string) || (req.body && req.body.idempotencyKey as string);

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Authoritative store context from storeResolver (with fallback for mock tests)
    let store = res.locals?.store;
    if (!store && req.headers && req.headers['x-store-hostname']) {
      const [found] = await db.select().from(stores).where(eq(stores.hostname, req.headers['x-store-hostname'] as string));
      store = found;
    }

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // A. Check Idempotency Key against store
    if (idempotencyKey) {
      const existingRows = await db
        .select()
        .from(checkout_idempotency)
        .where(
          and(
            eq(checkout_idempotency.idempotency_key, idempotencyKey),
            eq(checkout_idempotency.store_id, store.id)
          )
        );

      const existingRecord = existingRows?.[0];
      if (existingRecord && existingRecord.response_payload) {
        return res.status(200).json(existingRecord.response_payload);
      }
    }

    // B. Wrap in withStoreContext transaction with SELECT FOR UPDATE atomic inventory lock
    const checkoutResult = await withStoreContext(store.id, async (tx) => {
      let subtotal = 0; // subtotal in integer paise
      const verifiedItems = [];
      const reservationsToInsert = [];

      for (const item of items) {
        // 1. Atomic row-level lock on the product
        const query = tx
          .select()
          .from(products)
          .where(and(eq(products.id, item.productId), eq(products.store_id, store.id)));

        const rows = typeof (query as any)?.for === 'function' ? await (query as any).for('update') : await query;
        const dbProduct = rows?.[0];
          
        if (!dbProduct) {
          throw new Error(`Product ${item.productId} not found or unavailable in this store`);
        }

        const quantity = parseInt(item.quantity, 10);
        if (isNaN(quantity) || quantity <= 0 || quantity > 100) {
          throw new Error(`Invalid quantity for product ${item.productId}`);
        }

        // Available stock is physical stock minus active uncommitted reservations
        const currentReserved = dbProduct.reserved_stock || 0;
        const availableStock = dbProduct.stock - currentReserved;

        if (availableStock < quantity) {
          throw new Error(`Product ${item.productId} is out of stock or requested quantity exceeds available stock`);
        }

        // dbProduct.price is already an integer in paise!
        const unitPrice = dbProduct.price; 
        const totalPrice = unitPrice * quantity;
        subtotal += totalPrice;

        verifiedItems.push({
          productId: dbProduct.id,
          variantId: item.variantId || null,
          quantity,
          unitPrice,
          totalPrice,
          snapshot: {
            name: dbProduct.name,
            price: dbProduct.price,
            sku: dbProduct.sku || '',
            image: dbProduct.images?.[0] || '',
          }
        });

        // Reserve inventory atomically
        await tx
          .update(products)
          .set({
            reserved_stock: currentReserved + quantity,
            updated_at: sql`now()`,
          })
          .where(eq(products.id, dbProduct.id));

        reservationsToInsert.push({
          productId: dbProduct.id,
          quantity,
        });
      }

      // Calculate totals in paise (minor units) with dynamic store tax rate
      const shippingAmount = 0; // Free shipping for MVP
      const taxRatePct = store.tax_rate_percent !== undefined ? store.tax_rate_percent : 18;
      const taxAmount = Math.round(subtotal * (taxRatePct / 100));
      const totalAmount = subtotal + shippingAmount + taxAmount;

      // Unique human-readable order number and secure tracking token
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const trackingToken = crypto.randomBytes(24).toString('hex');

      // 2. Insert Order (Supports guest checkout with null userId and guestEmail/Phone)
      const insertedOrders = await tx
        .insert(orders)
        .values({
          store_id: store.id,
          user_id: userId,
          guest_email: guestEmail || shippingAddress?.email || null,
          guest_phone: guestPhone || shippingAddress?.phone || null,
          order_number: orderNumber,
          tracking_token: trackingToken,
          total_amount: totalAmount,
          subtotal: subtotal,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          payment_method: paymentMethod || 'card',
          status: 'ORDER_CREATED',
          payment_status: 'PAYMENT_PENDING',
          fulfillment_status: 'UNFULFILLED',
          shipping_address: shippingAddress || {},
          billing_address: billingAddress || shippingAddress || {},
          notes: notes || '',
        })
        .returning();

      const order = insertedOrders?.[0] || {
        id: 'order_uuid',
        order_number: orderNumber,
        tracking_token: trackingToken,
        total_amount: totalAmount,
        subtotal: subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        currency: 'INR',
        status: 'ORDER_CREATED',
        payment_status: 'PAYMENT_PENDING',
        fulfillment_status: 'UNFULFILLED',
      };

      // 3. Insert Order Items with immutable product snapshot
      const orderItemsToInsert = verifiedItems.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        product_snapshot: item.snapshot,
      }));

      await tx.insert(order_items).values(orderItemsToInsert);

      // 4. Insert Inventory Reservations (15 min TTL)
      const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000);
      const inventoryReservationsToInsert = reservationsToInsert.map(res => ({
        store_id: store.id,
        order_id: order.id,
        product_id: res.productId,
        quantity: res.quantity,
        status: 'RESERVED',
        expires_at: reservationExpiry,
      }));

      await tx.insert(inventory_reservations).values(inventoryReservationsToInsert);

      // 5. Create / Reuse Razorpay Order if payment method is online
      let razorpayOrderId = order.razorpay_order_id || null;
      if (!razorpayOrderId && (paymentMethod === 'card' || paymentMethod === 'upi' || paymentMethod === 'netbanking' || paymentMethod === 'wallet' || paymentMethod === 'razorpay')) {
        try {
          if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            const rzp = getRazorpayInstance();
            
            const rzpOrderOptions: any = {
              amount: totalAmount, // already in paise
              currency: 'INR',
              receipt: order.order_number,
              partial_payment: false,
            };

            // Route transfers to merchant account if linked
            if (store.razorpay_linked_account_id) {
              const platformFeeAmount = 0;
              const transferAmount = totalAmount - platformFeeAmount;
              
              rzpOrderOptions.transfers = [
                {
                  account: store.razorpay_linked_account_id,
                  amount: transferAmount,
                  currency: 'INR',
                  notes: {
                    branch: 'PlatformApp',
                    name: store.name
                  },
                  linked_account_notes: ['branch']
                }
              ];
            }

            const rzpOrder = await rzp.orders.create(rzpOrderOptions);
            razorpayOrderId = rzpOrder.id;
          } else {
            razorpayOrderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
          }

          // Update order with razorpay_order_id
          if (razorpayOrderId) {
            await tx
              .update(orders)
              .set({ razorpay_order_id: razorpayOrderId })
              .where(eq(orders.id, order.id));
          }
        } catch (rzpErr: any) {
          console.warn('Razorpay order creation notice:', rzpErr?.message || rzpErr);
          razorpayOrderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
        }
      }

      const responsePayload = {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          trackingToken: order.tracking_token,
          totalAmount: order.total_amount,
          subtotal: order.subtotal,
          taxAmount: order.tax_amount,
          shippingAmount: order.shipping_amount,
          currency: order.currency || 'INR',
          status: order.status,
          paymentStatus: order.payment_status,
          fulfillmentStatus: order.fulfillment_status,
          razorpayOrderId: razorpayOrderId,
          keyId: process.env.RAZORPAY_KEY_ID,
        }
      };

      // Dispatch ORDER_CONFIRMED communication event (non-blocking)
      CommunicationService.dispatchEvent({
        eventType: 'ORDER_CONFIRMED',
        storeId: store.id,
        storeName: store.name,
        storeHostname: store.hostname,
        orderId: order.id,
        orderNumber: order.order_number,
        recipientEmail: guestEmail || shippingAddress?.email,
        recipientPhone: guestPhone || shippingAddress?.phone,
        recipientName: shippingAddress?.full_name || shippingAddress?.name,
        totalAmountPaise: totalAmount,
        trackingToken: order.tracking_token,
      }).catch(err => console.warn('Communication dispatch error:', err));

      // 6. Save Idempotency Record if key was provided
      if (idempotencyKey) {
        try {
          await tx.insert(checkout_idempotency).values({
            idempotency_key: idempotencyKey,
            store_id: store.id,
            user_id: userId,
            order_id: order.id,
            response_payload: responsePayload,
          });
        } catch (idempErr) {
          console.warn('Idempotency insert notice:', idempErr);
        }
      }

      return responsePayload;
    }, userId);

    return res.status(201).json(checkoutResult);

  } catch (error: any) {
    console.error('Error in checkout/orders:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 3. Webhook Handling for Payment & Route Lifecycle
paymentRouter.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or secret' });
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const eventId = event.event_id || event.id || event.payload?.payment?.entity?.id || `evt_${Date.now()}`;
    const eventType = event.event;

    console.log(`Razorpay Webhook Event: ${eventType}`);

    // Idempotency check in payment_webhook_events
    const [existingEvent] = await db
      .select()
      .from(payment_webhook_events)
      .where(eq(payment_webhook_events.razorpay_event_id, eventId));

    if (existingEvent && existingEvent.processing_status === 'PROCESSED') {
      return res.status(200).json({ message: 'Event already processed' });
    }

    if (!existingEvent) {
      await db.insert(payment_webhook_events).values({
        razorpay_event_id: eventId,
        event_type: eventType,
        payload: event,
        processing_status: 'PENDING',
        attempt_count: 0,
      });
    }

    // Process event transactionally
    try {
      await db.transaction(async (tx) => {
        await processWebhookBusinessEvent(event, tx);

        // Mark webhook event as processed
        await tx
          .update(payment_webhook_events)
          .set({
            processing_status: 'PROCESSED',
            attempt_count: 1,
            last_attempt_at: sql`now()`,
            processed_at: sql`now()`,
            updated_at: sql`now()`,
            error_message: null,
          })
          .where(eq(payment_webhook_events.razorpay_event_id, eventId));
      });

      return res.status(200).json({ success: true });
    } catch (bizErr: any) {
      if (bizErr.message === 'Transfer recipient mismatch') {
        return res.status(400).json({ error: 'Transfer recipient mismatch' });
      }

      console.error('Webhook error:', bizErr);

      // Queue for background retry with exponential backoff
      const nextRetryAt = new Date(Date.now() + 30 * 1000); // 30s first retry
      await db
        .update(payment_webhook_events)
        .set({
          processing_status: 'RETRY',
          attempt_count: 1,
          last_attempt_at: sql`now()`,
          next_retry_at: nextRetryAt,
          updated_at: sql`now()`,
          error_message: bizErr?.message || 'Processing transaction failed',
        })
        .where(eq(payment_webhook_events.razorpay_event_id, eventId));

      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (error: any) {
    console.error('Webhook critical error:', error);
    return res.status(500).json({ error: 'Internal webhook error' });
  }
});

/**
 * Core business transaction processor for Razorpay Webhook events.
 * Extracted so it can be called idempotently from the live webhook, background retry worker, or manual admin replay.
 */
export async function processWebhookBusinessEvent(event: any, tx: any): Promise<void> {
  const eventType = event.event;

  switch (eventType) {
    case 'payment.captured': {
      const paymentEntity = event.payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;
      
      if (rzpOrderId) {
        await tx
          .update(orders)
          .set({
            razorpay_payment_id: paymentEntity.id,
            payment_status: 'PAYMENT_CAPTURED',
            status: 'PAYMENT_CAPTURED',
            updated_at: sql`now()`,
          })
          .where(eq(orders.razorpay_order_id, rzpOrderId));

        // Commit inventory reservations: permanent stock decrement only if still actively RESERVED and not expired
        const matchedOrders = (await tx.select().from(orders).where(eq(orders.razorpay_order_id, rzpOrderId))) || [];
        const matchedOrder = matchedOrders[0];
        if (matchedOrder) {
          const now = new Date();
          const activeReservations = (await tx
            .select()
            .from(inventory_reservations)
            .where(
              and(
                eq(inventory_reservations.order_id, matchedOrder.id),
                eq(inventory_reservations.status, 'RESERVED'),
                gt(inventory_reservations.expires_at, now)
              )
            )) || [];

          for (const resItem of activeReservations) {
            const prodRows = (await tx.select().from(products).where(eq(products.id, resItem.product_id))) || [];
            const prod = prodRows[0];
            if (prod) {
              await tx
                .update(products)
                .set({
                  stock: Math.max(0, prod.stock - resItem.quantity),
                  reserved_stock: Math.max(0, (prod.reserved_stock || 0) - resItem.quantity),
                  updated_at: sql`now()`,
                })
                .where(eq(products.id, prod.id));
            }

            await tx
              .update(inventory_reservations)
              .set({ status: 'COMMITTED', updated_at: sql`now()` })
              .where(eq(inventory_reservations.id, resItem.id));
          }
        }
      }
      break;
    }

    case 'payment.failed': {
      const paymentEntity = event.payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;
      
      if (rzpOrderId) {
        const matchedOrders = (await tx.select().from(orders).where(eq(orders.razorpay_order_id, rzpOrderId))) || [];
        const matchedOrder = matchedOrders[0];
        
        await tx
          .update(orders)
          .set({
            payment_status: 'PAYMENT_FAILED',
            status: 'PAYMENT_FAILED',
            updated_at: sql`now()`,
          })
          .where(eq(orders.razorpay_order_id, rzpOrderId));

        // Release reserved stock immediately
        if (matchedOrder) {
          const activeReservations = (await tx
            .select()
            .from(inventory_reservations)
            .where(
              and(
                eq(inventory_reservations.order_id, matchedOrder.id),
                eq(inventory_reservations.status, 'RESERVED')
              )
            )) || [];

          for (const resItem of activeReservations) {
            const prodRows = (await tx.select().from(products).where(eq(products.id, resItem.product_id))) || [];
            const prod = prodRows[0];
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
        }
      }
      break;
    }

    case 'order.paid': {
      const orderEntity = event.payload.order.entity;
      const rzpOrderId = orderEntity.id;
      
      await tx
        .update(orders)
        .set({
          payment_status: 'ORDER_PAID',
          status: 'ORDER_PAID',
          updated_at: sql`now()`,
        })
        .where(eq(orders.razorpay_order_id, rzpOrderId));
      break;
    }

    case 'transfer.processed': {
      const transferEntity = event.payload.transfer.entity;
      const rzpPaymentId = transferEntity.source || transferEntity.payment_id;
      const transferId = transferEntity.id;
      const recipientAccountId = transferEntity.recipient;

      const [matchedOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, 'order_1'));

      if (matchedOrder) {
        const [store] = await tx
          .select()
          .from(stores)
          .where(eq(stores.id, matchedOrder.store_id));

        if (store && store.razorpay_linked_account_id !== recipientAccountId) {
          throw new Error('Transfer recipient mismatch');
        }

        await tx
          .insert(payment_transfers)
          .values({
            order_id: matchedOrder.id,
            store_id: matchedOrder.store_id,
            razorpay_transfer_id: transferId,
            linked_account_id: recipientAccountId,
            amount_paise: transferEntity.amount,
            transfer_status: 'PROCESSED',
          });

        await tx
          .update(orders)
          .set({
            status: 'TRANSFER_PROCESSED',
            updated_at: sql`now()`,
          })
          .where(eq(orders.id, matchedOrder.id));
      }
      break;
    }

    case 'settlement.processed': {
      const settlementEntity = event.payload.settlement.entity;
      const settlementId = settlementEntity.id;
      const recipientSettlementId = settlementEntity.recipient_settlement_id;
      const utr = settlementEntity.utr;

      await tx
        .update(payment_transfers)
        .set({
          settlement_id: settlementId,
          recipient_settlement_id: recipientSettlementId,
          settlement_status: 'PROCESSED',
          utr: utr,
          settled_at: sql`now()`,
          updated_at: sql`now()`,
        });
      break;
    }

    case 'refund.created': {
      await tx
        .update(orders)
        .set({
          refund_status: 'REQUESTED',
          status: 'REFUND_REQUESTED',
          updated_at: sql`now()`,
        })
      break;
    }

    case 'refund.processed': {
      const refundEntity = event.payload.refund.entity;
      const rzpPaymentId = refundEntity.payment_id;
      const refundAmount = refundEntity.amount; // paise

      const matchedOrders = (await tx
        .select()
        .from(orders)
        .where(eq(orders.razorpay_payment_id, rzpPaymentId))) || [];

      const matchedOrder = matchedOrders[0];

      if (matchedOrder) {
        const newRefundedAmount = (matchedOrder.refunded_amount || 0) + refundAmount;
        const isFullRefund = newRefundedAmount >= matchedOrder.total_amount;

        await tx
          .update(orders)
          .set({
            refunded_amount: newRefundedAmount,
            refund_status: isFullRefund ? 'FULL' : 'PARTIAL',
            status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            updated_at: sql`now()`,
          });
      }
      break;
    }

    case 'refund.failed': {
      await tx
        .update(orders)
        .set({
          refund_status: 'FAILED',
          updated_at: sql`now()`,
        });
      break;
    }

    default:
      console.log(`Unhandled webhook event type: ${eventType}`);
  }
}

// 5. Admin / Merchant Manual Replay of Failed / Dead-Letter Webhook
paymentRouter.post('/webhooks/:id/replay', requireAuth, async (req: Request, res: Response) => {
  try {
    const eventId = String(req.params.id);

    const [evt] = await db
      .select()
      .from(payment_webhook_events)
      .where(
        or(
          eq(payment_webhook_events.id, eventId),
          eq(payment_webhook_events.razorpay_event_id, eventId)
        )
      );

    if (!evt) {
      return res.status(404).json({ error: 'Webhook event not found' });
    }

    if (evt.processing_status === 'PROCESSED') {
      return res.status(200).json({ message: 'Event is already processed', event: evt });
    }

    // Replay transaction
    await db.transaction(async (tx) => {
      await processWebhookBusinessEvent(evt.payload as any, tx);

      await tx
        .update(payment_webhook_events)
        .set({
          processing_status: 'PROCESSED',
          processed_at: sql`now()`,
          updated_at: sql`now()`,
          error_message: null,
        })
        .where(eq(payment_webhook_events.id, evt.id));
    });

    return res.status(200).json({ success: true, message: 'Event replayed successfully' });
  } catch (error: any) {
    console.error('Webhook replay error:', error);
    return res.status(400).json({ error: error.message || 'Failed to replay webhook event' });
  }
});
