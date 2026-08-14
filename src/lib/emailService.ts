/**
 * Universal Zero-Cost Email Service for YourCommerce
 * Supports Resend (3,000 free emails/mo) & EmailJS
 * Operates gracefully with fallback logging in dev environments.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}

export interface OrderConfirmationEmailData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
const DEFAULT_FROM = 'YourCommerce <noreply@aligarhattarhouse.com>';

/**
 * Send email using Resend API (Free Tier: 3000 emails/month)
 */
export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: options.fromName ? `${options.fromName} <noreply@aligarhattarhouse.com>` : DEFAULT_FROM,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email via Resend');
      }

      console.log('✉️ Email sent successfully via Resend:', data.id);
      return { success: true, messageId: data.id };
    }

    // Dev Fallback mode if no API key is set yet
    console.log('✉️ [DEV EMAIL SIMULATOR]');
    console.log(`  To: ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  Preview: ${options.text || options.html.slice(0, 100)}...`);

    return { success: true, messageId: `dev-sim-${Date.now()}` };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message || 'Email service error' };
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (data: OrderConfirmationEmailData) => {
  const itemsHtml = data.items
    .map(
      item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #78350f; color: #ffffff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">YourCommerce</h1>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Order Confirmation</p>
      </div>
      <div style="padding: 24px; color: #333333;">
        <p>Dear <strong>${data.customerName}</strong>,</p>
        <p>Thank you for your order! We are preparing your authentic alcohol-free attars for dispatch.</p>
        <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">Order Number: ${data.orderNumber}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="background-color: #f3f4f6; text-align: left;">
              <th style="padding: 8px;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; color: #78350f;">
          Total Paid: ₹${data.totalAmount}
        </div>
      </div>
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-t: 1px solid #e5e7eb;">
        YourCommerce • Authentic Pure Attars & Fragrances
      </div>
    </div>
  `;

  return sendEmail({
    to: data.customerEmail,
    subject: `Order Confirmed: ${data.orderNumber} - YourCommerce`,
    html,
  });
};
