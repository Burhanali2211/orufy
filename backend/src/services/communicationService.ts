import { db } from '../db/db';
import { communications_log } from '../db/schema';
import { ResendService } from './resendService';
import { eq, and, desc } from 'drizzle-orm';

export type CommunicationEventType =
  | 'ORDER_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'ORDER_PACKED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'REFUND_PROCESSED'
  | 'EMAIL_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'WELCOME';

export interface CommunicationEventPayload {
  eventType: CommunicationEventType;
  storeId: string;
  storeName: string;
  storeHostname?: string;
  orderId?: string;
  orderNumber?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  totalAmountPaise?: number;
  subtotalPaise?: number;
  taxAmountPaise?: number;
  shippingAmountPaise?: number;
  discountAmountPaise?: number;
  items?: Array<{ name: string; quantity: number; pricePaise: number; sku?: string }>;
  shippingAddress?: any;
  carrier?: string;
  trackingNumber?: string;
  trackingToken?: string;
  verificationUrl?: string;
  resetUrl?: string;
  customSubject?: string;
  customHtml?: string;
  metadata?: Record<string, any>;
}

export class CommunicationService {
  /**
   * Dispatches a communication event via Resend and records it in the communications_log table.
   */
  public static async dispatchEvent(payload: CommunicationEventPayload): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
      const recipient = payload.recipientEmail || payload.recipientPhone || 'customer@store.local';
      const storeName = payload.storeName || 'Commerce Store';
      const orderNumber = payload.orderNumber || 'N/A';
      const formattedAmount = payload.totalAmountPaise ? (payload.totalAmountPaise / 100).toFixed(2) : '0.00';
      const storeUrl = payload.storeHostname ? `https://${payload.storeHostname}` : 'https://get-oru.com';

      let subject = payload.customSubject || '';
      let html = payload.customHtml || '';
      let plainText = '';

      // Template Selection & HTML Rendering
      if (!html) {
        switch (payload.eventType) {
          case 'EMAIL_VERIFICATION': {
            const tmpl = ResendService.renderVerificationTemplate({
              storeName,
              storeUrl,
              recipientName: payload.recipientName,
              recipientEmail: payload.recipientEmail || recipient,
              verificationUrl: payload.verificationUrl || `${storeUrl}/verify-email`,
            });
            subject = subject || tmpl.subject;
            html = tmpl.html;
            break;
          }

          case 'ORDER_CONFIRMED': {
            const trackingUrl = payload.orderId && payload.trackingToken
              ? `${storeUrl}/track-order/${payload.orderId}?token=${encodeURIComponent(payload.trackingToken)}`
              : (payload.orderNumber ? `${storeUrl}/track-order?number=${encodeURIComponent(payload.orderNumber)}` : undefined);

            const tmpl = ResendService.renderOrderConfirmationTemplate({
              storeName,
              storeUrl,
              orderNumber,
              recipientName: payload.recipientName,
              recipientEmail: payload.recipientEmail || recipient,
              totalAmountPaise: payload.totalAmountPaise || 0,
              subtotalPaise: payload.subtotalPaise,
              taxAmountPaise: payload.taxAmountPaise,
              shippingAmountPaise: payload.shippingAmountPaise,
              discountAmountPaise: payload.discountAmountPaise,
              items: payload.items || [],
              shippingAddress: payload.shippingAddress,
              trackingUrl,
            });
            subject = subject || tmpl.subject;
            html = tmpl.html;
            break;
          }

          case 'ORDER_SHIPPED': {
            const trackingUrl = payload.orderId && payload.trackingToken
              ? `${storeUrl}/track-order/${payload.orderId}?token=${encodeURIComponent(payload.trackingToken)}`
              : undefined;

            const tmpl = ResendService.renderOrderShippedTemplate({
              storeName,
              storeUrl,
              orderNumber,
              recipientName: payload.recipientName,
              carrier: payload.carrier,
              trackingNumber: payload.trackingNumber,
              trackingUrl,
            });
            subject = subject || tmpl.subject;
            html = tmpl.html;
            break;
          }

          case 'PASSWORD_RESET': {
            const tmpl = ResendService.renderPasswordResetTemplate({
              storeName,
              storeUrl,
              recipientName: payload.recipientName,
              recipientEmail: payload.recipientEmail || recipient,
              resetUrl: payload.resetUrl || `${storeUrl}/reset-password`,
            });
            subject = subject || tmpl.subject;
            html = tmpl.html;
            break;
          }

          case 'ORDER_DELIVERED': {
            subject = subject || `Order #${orderNumber} Delivered — ${storeName}`;
            html = `
              <div style="font-family: sans-serif; padding: 24px; color: #18181b;">
                <h2>Your order has arrived!</h2>
                <p>Hello ${payload.recipientName || 'Customer'},</p>
                <p>Your order <strong>#${orderNumber}</strong> from <strong>${storeName}</strong> has been successfully delivered.</p>
                <p>Thank you for shopping with us!</p>
              </div>
            `;
            break;
          }

          case 'ORDER_CANCELLED': {
            subject = subject || `Order #${orderNumber} Cancelled — ${storeName}`;
            html = `
              <div style="font-family: sans-serif; padding: 24px; color: #18181b;">
                <h2>Order #${orderNumber} Cancelled</h2>
                <p>Hello ${payload.recipientName || 'Customer'},</p>
                <p>Your order <strong>#${orderNumber}</strong> has been cancelled. Any pre-paid amounts totaling ₹${formattedAmount} will be refunded to your original payment method.</p>
              </div>
            `;
            break;
          }

          default: {
            subject = subject || `Update regarding Order #${orderNumber} — ${storeName}`;
            html = `
              <div style="font-family: sans-serif; padding: 24px; color: #18181b;">
                <h2>Order #${orderNumber} Update</h2>
                <p>Hello ${payload.recipientName || 'Customer'},</p>
                <p>There is an update on your order from <strong>${storeName}</strong>.</p>
              </div>
            `;
          }
        }
      }

      plainText = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

      // Dispatch via Resend if email recipient provided
      let sendSuccess = true;
      let resendMessageId: string | undefined;
      let sendError: string | undefined;

      if (payload.recipientEmail) {
        let fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@get-oru.com';
        if (payload.eventType === 'EMAIL_VERIFICATION' || payload.eventType === 'PASSWORD_RESET') {
          fromEmail = process.env.RESEND_AUTH_FROM_EMAIL || 'auth@get-oru.com';
        } else if (payload.eventType.startsWith('ORDER_') || payload.eventType === 'PAYMENT_RECEIVED' || payload.eventType === 'REFUND_PROCESSED') {
          fromEmail = process.env.RESEND_ORDERS_FROM_EMAIL || 'orders@get-oru.com';
        }

        const sendResult = await ResendService.sendEmail({
          to: payload.recipientEmail,
          subject,
          html,
          text: plainText,
          from: `${storeName} <${fromEmail}>`,
          fromName: storeName,
        });

        sendSuccess = sendResult.success;
        resendMessageId = sendResult.messageId;
        sendError = sendResult.error;
      }

      // Record in communications log
      const [entry] = await db
        .insert(communications_log)
        .values({
          store_id: payload.storeId,
          order_id: payload.orderId || null,
          recipient,
          channel: payload.recipientEmail ? 'EMAIL' : 'SMS',
          event_type: payload.eventType,
          subject,
          content: plainText,
          status: sendSuccess ? 'DELIVERED' : 'FAILED',
          metadata: {
            ...payload.metadata,
            html_content: html,
            resend_message_id: resendMessageId,
            error: sendError,
            carrier: payload.carrier,
            tracking_number: payload.trackingNumber,
            tracking_token: payload.trackingToken,
          },
        })
        .returning();

      return {
        success: sendSuccess,
        logId: entry?.id,
        error: sendError,
      };
    } catch (error: any) {
      console.error('Error dispatching communication event:', error);
      return { success: false, error: error.message || 'Communication error' };
    }
  }

  /**
   * Fetches all communication log entries for a given store order.
   */
  public static async getOrderCommunications(storeId: string, orderId: string) {
    return db
      .select()
      .from(communications_log)
      .where(
        and(
          eq(communications_log.store_id, storeId),
          eq(communications_log.order_id, orderId)
        )
      )
      .orderBy(desc(communications_log.created_at));
  }
}
