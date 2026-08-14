import { db } from '../db/db';
import { communications_log } from '../db/schema';

export type CommunicationEventType =
  | 'ORDER_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'ORDER_PACKED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'REFUND_PROCESSED';

export interface CommunicationEventPayload {
  eventType: CommunicationEventType;
  storeId: string;
  storeName: string;
  storeHostname?: string;
  orderId: string;
  orderNumber: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  totalAmountPaise?: number;
  carrier?: string;
  trackingNumber?: string;
  trackingToken?: string;
  metadata?: Record<string, any>;
}

export class CommunicationService {
  /**
   * Dispatches a domain communication event and records it in the communications log.
   */
  public static async dispatchEvent(payload: CommunicationEventPayload): Promise<{ success: boolean; logId?: string }> {
    try {
      const recipient = payload.recipientEmail || payload.recipientPhone || 'customer@store.local';
      const formattedAmount = payload.totalAmountPaise ? (payload.totalAmountPaise / 100).toFixed(2) : '0.00';
      const storeName = payload.storeName || 'Store';
      const orderNumber = payload.orderNumber;

      let subject = '';
      let content = '';

      switch (payload.eventType) {
        case 'ORDER_CONFIRMED':
          subject = `Order #${orderNumber} Confirmed — ${storeName}`;
          content = `Hello ${payload.recipientName || 'Customer'},\n\nThank you for your order at ${storeName}! Your order #${orderNumber} total is ₹${formattedAmount}. We will notify you when it's packed.`;
          break;

        case 'PAYMENT_RECEIVED':
          subject = `Payment Received for Order #${orderNumber} — ${storeName}`;
          content = `Hello ${payload.recipientName || 'Customer'},\n\nWe have successfully received your payment of ₹${formattedAmount} for Order #${orderNumber}.`;
          break;

        case 'ORDER_PACKED':
          subject = `Order #${orderNumber} Packed and Ready — ${storeName}`;
          content = `Hello ${payload.recipientName || 'Customer'},\n\nYour order #${orderNumber} has been carefully packed and is queued for courier pickup.`;
          break;

        case 'ORDER_SHIPPED':
          subject = `Your Order #${orderNumber} Has Shipped! — ${storeName}`;
          content = `Hello ${payload.recipientName || 'Customer'},\n\nGreat news! Your order #${orderNumber} has shipped via ${payload.carrier || 'Courier'}.\nTracking AWB: ${payload.trackingNumber || 'N/A'}`;
          break;

        case 'ORDER_DELIVERED':
          subject = `Order #${orderNumber} Delivered — ${storeName}`;
          content = `Hello ${payload.recipientName || 'Customer'},\n\nYour order #${orderNumber} has been delivered. Thank you for shopping with ${storeName}!`;
          break;

        case 'ORDER_CANCELLED':
          subject = `Order #${orderNumber} Cancelled — ${storeName}`;
          content = `Hello ${payload.recipientName || 'Customer'},\n\nYour order #${orderNumber} has been cancelled. If payment was made, a refund has been initiated.`;
          break;

        case 'REFUND_PROCESSED':
          subject = `Refund Processed for Order #${orderNumber} — ${storeName}`;
          content = `Hello ${payload.recipientName || 'Customer'},\n\nYour refund of ₹${formattedAmount} for Order #${orderNumber} has been processed and will reflect in your account shortly.`;
          break;

        default:
          subject = `Order #${orderNumber} Update — ${storeName}`;
          content = `Hello ${payload.recipientName || 'Customer'},\n\nYour order #${orderNumber} status has been updated.`;
      }

      // Record in communications log
      const [entry] = await db
        .insert(communications_log)
        .values({
          store_id: payload.storeId,
          order_id: payload.orderId,
          recipient,
          channel: payload.recipientEmail ? 'EMAIL' : 'SMS',
          event_type: payload.eventType,
          subject,
          content,
          status: 'DELIVERED',
          metadata: {
            ...payload.metadata,
            tracking_token: payload.trackingToken,
            carrier: payload.carrier,
            tracking_number: payload.trackingNumber,
          },
        })
        .returning();

      return { success: true, logId: entry?.id };
    } catch (error) {
      console.error('Error dispatching communication event:', error);
      return { success: false };
    }
  }
}
