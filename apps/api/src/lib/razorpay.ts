import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../env';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
}

export interface RazorpaySubscription {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number;
  current_end?: number;
  short_url?: string;
}

export interface RazorpayWebhookEvent {
  event: string;
  payload: any;
}

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

/**
 * Creates a one-time payment order
 */
export async function createOrder(amount: number, currency: string, receipt: string): Promise<RazorpayOrder> {
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt,
  });
  return order as RazorpayOrder;
}

/**
 * Creates a subscription for a recurring plan
 */
export async function createSubscription(planId: string, totalCount: number, notes: object): Promise<RazorpaySubscription> {
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    notes: notes as any,
    customer_notify: 1,
  });
  return subscription as RazorpaySubscription;
}

/**
 * Cancels an active subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await razorpay.subscriptions.cancel(subscriptionId);
}

/**
 * Verifies the signature of an incoming webhook event
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * Verifies the signature of a successful payment from the frontend
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expectedSignature === signature;
}
