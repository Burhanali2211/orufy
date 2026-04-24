import { Hono } from 'hono';
import { Variables } from '../../types/context';
import { requireAuth } from '../../middleware/auth';
import { 
  createOrder, 
  createSubscription, 
  cancelSubscription, 
  verifyPaymentSignature, 
  verifyWebhookSignature 
} from '../../lib/razorpay';
import { billingService, RAZORPAY_PLAN_IDS } from './billing.service';
import { db, subscriptions, tenants, orders } from '../../lib/db';
import { eq } from 'drizzle-orm';
import { env } from '../../env';

export const billingRoutes = new Hono<any>();

/**
 * PUBLIC WEBHOOK: Handled at /webhooks/razorpay
 */
billingRoutes.post('/', async (c) => {
  // If this is called from the dashboard router, it won't be the webhook
  // We check the path to distinguish
  const path = c.req.path;
  if (!path.startsWith('/webhooks')) {
    return c.json({ error: 'Not found' }, 404);
  }

  const signature = c.req.header('x-razorpay-signature');
  if (!signature) return c.json({ error: 'Missing signature' }, 400);

  const body = await c.req.text();
  const isValid = verifyWebhookSignature(body, signature);

  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  const event = JSON.parse(body);
  await billingService.handleWebhookEvent(event);

  return c.json({ success: true });
});

/**
 * DASHBOARD ROUTES: requireAuth and resolveTenant are applied in index.ts
 */

// 1. Create One-time Order (for products)
billingRoutes.post('/create-order', async (c) => {
  const { amount } = await c.req.json();
  
  const order = await createOrder(
    Math.round(amount * 100), // paise
    'INR',
    `receipt_${Date.now()}`
  );

  return c.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: env.RAZORPAY_KEY_ID
  });
});

// 2. Subscribe to SaaS Plan
billingRoutes.post('/subscribe', async (c) => {
  const { plan } = await c.req.json() as { plan: 'basic' | 'standard' | 'premium' };
  const tenant = c.get('tenant');
  const tenantId = tenant?.id;

  const razorpayPlanId = RAZORPAY_PLAN_IDS[plan];
  if (!razorpayPlanId) return c.json({ error: 'Invalid plan' }, 400);

  const sub = await createSubscription(razorpayPlanId, 12, { tenantId });

  // Save to DB
  await db.insert(subscriptions).values({
    tenantId,
    razorpaySubscriptionId: sub.id,
    razorpayPlanId,
    plan,
    status: 'created',
  }).onConflictDoUpdate({
    target: subscriptions.tenantId,
    set: {
      razorpaySubscriptionId: sub.id,
      razorpayPlanId,
      plan,
      status: 'created',
      updatedAt: new Date(),
    }
  });

  return c.json({
    subscriptionId: sub.id,
    shortUrl: sub.short_url,
    key: env.RAZORPAY_KEY_ID
  });
});

// 3. Verify Payment Signature
billingRoutes.post('/verify', async (c) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = await c.req.json();

  const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid) {
    return c.json({ success: false, error: 'Invalid signature' }, 400);
  }

  // If order_id (from orders table) is provided, update its status
  if (order_id) {
    await db
      .update(orders)
      .set({
        paymentStatus: 'paid',
        status: 'confirmed',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order_id));
  }

  return c.json({ success: true });
});

// 4. Cancel Subscription
billingRoutes.post('/cancel', async (c) => {
  const tenant = c.get('tenant');
  const tenantId = tenant?.id;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);

  if (!sub) return c.json({ error: 'No active subscription' }, 404);

  await cancelSubscription(sub.razorpaySubscriptionId);

  await db
    .update(subscriptions)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));

  return c.json({ success: true });
});

// 5. Get Billing Status
billingRoutes.get('/status', async (c) => {
  const tenant = c.get('tenant');
  const tenantId = tenant?.id;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);

  if (!sub) return c.json({ plan: 'none', status: 'none' });

  return c.json({
    plan: sub.plan,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    failureCount: sub.failureCount
  });
});
