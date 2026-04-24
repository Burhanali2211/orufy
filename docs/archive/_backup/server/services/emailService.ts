import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'orders@yourdomain.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'HimalayanSpicesExports';
// FRONTEND_URL is required for email links - should be set in environment
const FRONTEND_URL = process.env.FRONTEND_URL || 
                     (process.env.NODE_ENV === 'development' 
                       ? `http://localhost:${process.env.PORT || 5173}` 
                       : undefined);

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  logger.warn('SendGrid API key not configured. Email functionality will be disabled.', { context: 'Email' });
}

/**
 * Email Service for sending transactional emails
 */

interface OrderDetails {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  createdAt: string;
}

interface ShippingDetails {
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  trackingUrl?: string;
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(order: OrderDetails): Promise<void> {
  if (!SENDGRID_API_KEY) {
    logger.info(`[DEMO] Order confirmation email would be sent to: ${order.customerEmail}`, { context: 'Email' });
    return;
  }

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">${EMAIL_FROM_NAME}</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your order!</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">Order Confirmation</h2>
        
        <p>Dear ${order.customerName},</p>
        
        <p>Thank you for your order! We're excited to prepare your authentic Kashmir perfumes for delivery.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #667eea;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #667eea;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #667eea;">Price</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #667eea;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Subtotal:</strong></td>
                <td style="padding: 10px; text-align: right; border-top: 2px solid #eee;">₹${order.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
                <td style="padding: 10px; text-align: right;">₹${order.shipping.toFixed(2)}</td>
              </tr>
              ${order.tax > 0 ? `
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax (GST):</strong></td>
                <td style="padding: 10px; text-align: right;">₹${order.tax.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #667eea; font-size: 18px;"><strong>Total:</strong></td>
                <td style="padding: 10px; text-align: right; border-top: 2px solid #667eea; font-size: 18px; color: #667eea;"><strong>₹${order.total.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Shipping Address</h3>
          <p style="margin: 5px 0;">${order.shippingAddress.fullName}</p>
          <p style="margin: 5px 0;">${order.shippingAddress.addressLine1}</p>
          ${order.shippingAddress.addressLine2 ? `<p style="margin: 5px 0;">${order.shippingAddress.addressLine2}</p>` : ''}
          <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
          <p style="margin: 5px 0;">${order.shippingAddress.country}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>📦 What's Next?</strong></p>
          <p style="margin: 10px 0 0 0;">We'll send you another email with tracking information once your order ships. Orders typically ship within 1-2 business days.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${FRONTEND_URL}/orders/${order.id}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Track Your Order</a>
        </div>
        
        <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>Need help? Contact us at <a href="mailto:${process.env.EMAIL_SUPPORT || EMAIL_FROM}" style="color: #667eea;">${process.env.EMAIL_SUPPORT || EMAIL_FROM}</a></p>
          <p>or call us at ${process.env.BUSINESS_PHONE || '+91-XXXXXXXXXX'}</p>
          <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} ${EMAIL_FROM_NAME}. All rights reserved.</p>
          <p style="font-size: 12px; color: #999;">Authentic Kashmir Perfumes & Attars</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const msg = {
    to: order.customerEmail,
    from: {
      email: EMAIL_FROM,
      name: EMAIL_FROM_NAME
    },
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: html,
    text: `
      Order Confirmation - ${order.orderNumber}
      
      Dear ${order.customerName},
      
      Thank you for your order! We're excited to prepare your authentic Kashmir perfumes for delivery.
      
      Order Number: ${order.orderNumber}
      Order Date: ${new Date(order.createdAt).toLocaleDateString()}
      Total: ₹${order.total.toFixed(2)}
      
      We'll send you tracking information once your order ships.
      
      Track your order: ${FRONTEND_URL}/orders/${order.id}
      
      Need help? Contact us at ${process.env.EMAIL_SUPPORT || EMAIL_FROM}
      
      ${EMAIL_FROM_NAME}
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✓ Order confirmation email sent to ${order.customerEmail}`);
  } catch (error: any) {
    console.error('✗ Failed to send order confirmation email:', error.response?.body || error.message);
    throw error;
  }
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotification(
  customerEmail: string,
  customerName: string,
  shipping: ShippingDetails
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log('📧 [DEMO] Shipping notification would be sent to:', customerEmail);
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Has Shipped!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">📦 Your Order Has Shipped!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Dear ${customerName},</p>
        
        <p>Great news! Your order <strong>${shipping.orderNumber}</strong> has been shipped and is on its way to you.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Shipping Details</h3>
          <p><strong>Tracking Number:</strong> ${shipping.trackingNumber}</p>
          <p><strong>Carrier:</strong> ${shipping.carrier}</p>
          <p><strong>Estimated Delivery:</strong> ${shipping.estimatedDelivery}</p>
        </div>
        
        ${shipping.trackingUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${shipping.trackingUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Track Your Package</a>
        </div>
        ` : ''}
        
        <div style="background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>💡 Tip:</strong></p>
          <p style="margin: 10px 0 0 0;">Keep your tracking number handy. You can use it to check the status of your delivery at any time.</p>
        </div>
        
        <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>Questions about your order? Contact us at <a href="mailto:${process.env.EMAIL_SUPPORT || EMAIL_FROM}" style="color: #667eea;">${process.env.EMAIL_SUPPORT || EMAIL_FROM}</a></p>
          <p>&copy; ${new Date().getFullYear()} ${EMAIL_FROM_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const msg = {
    to: customerEmail,
    from: {
      email: EMAIL_FROM,
      name: EMAIL_FROM_NAME
    },
    subject: `Your Order ${shipping.orderNumber} Has Shipped! 📦`,
    html: html
  };

  try {
    await sgMail.send(msg);
    console.log(`✓ Shipping notification sent to ${customerEmail}`);
  } catch (error: any) {
    console.error('✗ Failed to send shipping notification:', error.response?.body || error.message);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log('📧 [DEMO] Password reset email would be sent to:', email);
    return;
  }

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hello ${userName},</p>
        
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: white; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">${resetUrl}</p>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
          <p style="margin: 10px 0 0 0;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
        </div>
        
        <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>Need help? Contact us at <a href="mailto:${process.env.EMAIL_SUPPORT || EMAIL_FROM}" style="color: #667eea;">${process.env.EMAIL_SUPPORT || EMAIL_FROM}</a></p>
          <p>&copy; ${new Date().getFullYear()} ${EMAIL_FROM_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const msg = {
    to: email,
    from: {
      email: EMAIL_FROM,
      name: EMAIL_FROM_NAME
    },
    subject: 'Reset Your Password',
    html: html
  };

  try {
    await sgMail.send(msg);
    console.log(`✓ Password reset email sent to ${email}`);
  } catch (error: any) {
    console.error('✗ Failed to send password reset email:', error.response?.body || error.message);
    throw error;
  }
}

export default {
  sendOrderConfirmation,
  sendShippingNotification,
  sendPasswordResetEmail
};

