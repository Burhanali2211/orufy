/**
 * Resend Email Engine for Multi-tenant Commerce
 * Handles direct Resend API communication (3,000 free emails/month)
 * with robust templates and graceful dev simulation.
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export interface VerificationEmailProps {
  storeName: string;
  storeUrl: string;
  recipientName?: string;
  recipientEmail: string;
  verificationUrl: string;
}

export interface OrderItemProps {
  name: string;
  quantity: number;
  pricePaise: number;
  sku?: string;
}

export interface OrderEmailProps {
  storeName: string;
  storeUrl: string;
  orderNumber: string;
  recipientName?: string;
  recipientEmail: string;
  totalAmountPaise: number;
  subtotalPaise?: number;
  taxAmountPaise?: number;
  shippingAmountPaise?: number;
  discountAmountPaise?: number;
  items: OrderItemProps[];
  shippingAddress?: any;
  paymentMethod?: string;
  trackingUrl?: string;
}

export interface ShippingEmailProps {
  storeName: string;
  storeUrl: string;
  orderNumber: string;
  recipientName?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface PasswordResetEmailProps {
  storeName: string;
  storeUrl: string;
  recipientName?: string;
  recipientEmail: string;
  resetUrl: string;
}

const fmtCurrency = (paise: number) => {
  const rs = (paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${rs}`;
};

export class ResendService {
  private static getApiKey(): string | undefined {
    return process.env.RESEND_API_KEY || (typeof process !== 'undefined' ? process.env.VITE_RESEND_API_KEY : undefined);
  }

  private static getDefaultFrom(fromName?: string): string {
    const name = fromName || process.env.STORE_DEFAULT_NAME || 'Commerce Portal';
    const email = process.env.RESEND_FROM_EMAIL || 'notifications@get-oru.com';
    return `${name} <${email}>`;
  }

  /**
   * Dispatches email via Resend REST API or logs to dev simulator
   */
  public static async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const apiKey = this.getApiKey();
    const recipient = Array.isArray(options.to) ? options.to : [options.to];
    const fromAddress = options.from || this.getDefaultFrom(options.fromName);

    try {
      if (apiKey) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: fromAddress,
            to: recipient,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim(),
            reply_to: options.replyTo,
            tags: options.tags,
          }),
        });

        const data: any = await response.json();
        if (!response.ok) {
          console.error('❌ Resend API error response:', data);
          return {
            success: false,
            error: data.message || data.error?.message || 'Failed to send email via Resend',
          };
        }

        console.log(`✉️ Email dispatched via Resend [ID: ${data.id}] to ${recipient.join(', ')}`);
        return {
          success: true,
          messageId: data.id,
          simulated: false,
        };
      }

      // Dev Simulator Fallback
      const simId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✉️  [RESEND DEV SIMULATOR] Email Dispatched');
      console.log(`  To:      ${recipient.join(', ')}`);
      console.log(`  From:    ${fromAddress}`);
      console.log(`  Subject: ${options.subject}`);
      console.log(`  Message: ${simId}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return {
        success: true,
        messageId: simId,
        simulated: true,
      };
    } catch (error: any) {
      console.error('❌ Resend send error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while sending email',
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EMAIL TEMPLATE GENERATORS
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * 1. Email Verification Template
   */
  public static renderVerificationTemplate(props: VerificationEmailProps): { subject: string; html: string } {
    const { storeName, recipientName, verificationUrl } = props;
    const name = recipientName || 'Valued Customer';
    const subject = `Confirm your email address — ${storeName}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .header { background: #09090b; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #a1a1aa; }
    .body { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #3f3f46; margin: 0 0 20px; }
    .button-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #09090b; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.2px; }
    .link-fallback { background: #f4f4f5; padding: 12px 16px; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all; color: #52525b; margin-top: 16px; }
    .footer { background: #fafafa; border-top: 1px solid #f4f4f5; padding: 20px 24px; text-align: center; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${storeName}</h1>
      <p>Account Security & Verification</p>
    </div>
    <div class="body">
      <div class="greeting">Hello ${name},</div>
      <p class="text">Thank you for registering with <strong>${storeName}</strong>. Please confirm your email address to activate your account and access your order history, tracking, and wishlist.</p>
      
      <div class="button-container">
        <a href="${verificationUrl}" class="btn" target="_blank">Verify Email Address</a>
      </div>

      <p class="text" style="font-size: 12px; color: #71717a;">This verification link will expire in 24 hours. If you did not create an account with ${storeName}, please disregard this message.</p>

      <div class="link-fallback">
        ${verificationUrl}
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
    </div>
  </div>
</body>
</html>`;

    return { subject, html };
  }

  /**
   * 2. Order Confirmation Template
   */
  public static renderOrderConfirmationTemplate(props: OrderEmailProps): { subject: string; html: string } {
    const { storeName, orderNumber, recipientName, totalAmountPaise, items, shippingAddress, trackingUrl } = props;
    const name = recipientName || 'Valued Customer';
    const subject = `Order Confirmed: #${orderNumber} — ${storeName}`;

    const itemsRows = (items || []).map(item => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f4f4f5; font-size: 13px; font-weight: 600; color: #18181b;">
          ${item.name}
          ${item.sku ? `<div style="font-size: 11px; color: #71717a; font-weight: normal; font-family: monospace;">SKU: ${item.sku}</div>` : ''}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f4f4f5; font-size: 13px; text-align: center; color: #52525b;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f4f4f5; font-size: 13px; text-align: right; font-weight: 700; color: #18181b;">${fmtCurrency(item.pricePaise * item.quantity)}</td>
      </tr>
    `).join('');

    const addressText = shippingAddress
      ? `${shippingAddress.streetAddress || shippingAddress.street_address || shippingAddress.street || ''}, ${shippingAddress.city || ''} ${shippingAddress.postalCode || shippingAddress.postal_code || ''}`
      : 'Address on file';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .header { background: #09090b; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .order-badge { display: inline-block; background: #27272a; color: #f4f4f5; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-family: monospace; font-weight: 700; margin-top: 10px; }
    .body { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    .text { font-size: 14px; line-height: 1.6; color: #3f3f46; margin: 0 0 20px; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th { background: #f4f4f5; padding: 8px; font-size: 11px; text-transform: uppercase; color: #71717a; text-align: left; }
    .total-box { background: #fafafa; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #f4f4f5; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #52525b; margin-bottom: 6px; }
    .total-grand { display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #09090b; border-top: 1px solid #e4e4e7; padding-top: 10px; margin-top: 10px; }
    .btn { display: inline-block; background: #09090b; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; }
    .footer { background: #fafafa; border-top: 1px solid #f4f4f5; padding: 20px 24px; text-align: center; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${storeName}</h1>
      <div class="order-badge">ORDER #${orderNumber}</div>
    </div>
    <div class="body">
      <div class="greeting">Thank you for your order, ${name}!</div>
      <p class="text">We've received your order and our fulfillment team is preparing it for dispatch. You can track your order status live at any time.</p>

      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="total-box">
        <table style="width: 100%;">
          <tr>
            <td style="font-size: 14px; font-weight: bold; color: #09090b;">Total Paid:</td>
            <td style="font-size: 16px; font-weight: 800; color: #09090b; text-align: right;">${fmtCurrency(totalAmountPaise)}</td>
          </tr>
        </table>
      </div>

      <div style="background: #f4f4f5; padding: 14px 16px; border-radius: 10px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: bold; color: #71717a; text-transform: uppercase;">Delivery Address</div>
        <div style="font-size: 13px; color: #18181b; margin-top: 4px;">${addressText}</div>
      </div>

      ${trackingUrl ? `
      <div style="text-align: center; margin-top: 24px;">
        <a href="${trackingUrl}" class="btn" target="_blank">Track Order Status</a>
      </div>` : ''}
    </div>
    <div class="footer">
      Have questions? Reply directly to this email or contact support at ${storeName}.<br>
      &copy; ${new Date().getFullYear()} ${storeName}.
    </div>
  </div>
</body>
</html>`;

    return { subject, html };
  }

  /**
   * 3. Order Shipped Template
   */
  public static renderOrderShippedTemplate(props: ShippingEmailProps): { subject: string; html: string } {
    const { storeName, orderNumber, recipientName, carrier, trackingNumber, trackingUrl } = props;
    const name = recipientName || 'Valued Customer';
    const subject = `Your Order #${orderNumber} Has Shipped! — ${storeName}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .header { background: #09090b; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .body { padding: 32px 28px; }
    .tracking-card { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
    .tracking-num { font-family: monospace; font-size: 18px; font-weight: bold; color: #09090b; margin: 8px 0; }
    .btn { display: inline-block; background: #09090b; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: 700; margin-top: 12px; }
    .footer { background: #fafafa; border-top: 1px solid #f4f4f5; padding: 20px 24px; text-align: center; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${storeName}</h1>
      <p style="margin: 6px 0 0; color: #a1a1aa; font-size: 13px;">Package in Transit</p>
    </div>
    <div class="body">
      <h2 style="font-size: 16px; margin: 0 0 12px;">Great news, ${name}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #3f3f46; margin: 0 0 20px;">Your order <strong>#${orderNumber}</strong> has been handed over to our courier partner and is on its way to you.</p>

      <div class="tracking-card">
        <div style="font-size: 12px; text-transform: uppercase; color: #71717a; font-weight: 700;">Carrier: ${carrier || 'Express Courier'}</div>
        <div class="tracking-num">AWB: ${trackingNumber || 'Available shortly'}</div>
        ${trackingUrl ? `<a href="${trackingUrl}" class="btn" target="_blank">Track Shipment Live</a>` : ''}
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
    </div>
  </div>
</body>
</html>`;

    return { subject, html };
  }

  /**
   * 4. Password Reset Template
   */
  public static renderPasswordResetTemplate(props: PasswordResetEmailProps): { subject: string; html: string } {
    const { storeName, recipientName, resetUrl } = props;
    const name = recipientName || 'Valued Customer';
    const subject = `Reset your password — ${storeName}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; }
    .header { background: #09090b; padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .body { padding: 32px 28px; }
    .btn { display: inline-block; background: #09090b; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; }
    .footer { background: #fafafa; border-top: 1px solid #f4f4f5; padding: 20px 24px; text-align: center; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${storeName}</h1>
      <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 13px;">Password Reset Request</p>
    </div>
    <div class="body">
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Hello ${name},</div>
      <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 24px;">We received a request to reset the password for your ${storeName} account. Click the button below to set a new password.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      </div>

      <p style="font-size: 12px; color: #71717a;">If you did not request a password reset, you can safely ignore this email. This link will expire in 1 hour.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${storeName}.
    </div>
  </div>
</body>
</html>`;

    return { subject, html };
  }
}
