import { Resend } from 'resend';
import { env } from '../env';
import { logger } from './logger';

const resend = new Resend(env.RESEND_API_KEY);
const FROM_EMAIL = `noreply@${env.APP_DOMAIN}`;
const BRAND_COLOR = '#1a1a2e';

/**
 * Base email template wrapper
 */
const emailLayout = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background-color: ${BRAND_COLOR}; padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${title}</h1>
    </div>
    <div style="padding: 40px; line-height: 1.6; color: #333333;">
      ${content}
    </div>
    <div style="padding: 24px; background-color: #f1f5f9; text-align: center; color: #64748b; font-size: 12px;">
      <p>&copy; ${new Date().getFullYear()} ${env.APP_DOMAIN}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const buttonStyle = `display: inline-block; padding: 12px 24px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px;`;

export async function sendWelcomeEmail(to: string, data: { shopName: string; shopUrl: string; ownerName: string }): Promise<void> {
  const html = emailLayout(`
    <p>Hi ${data.ownerName},</p>
    <p>Welcome to ${env.APP_DOMAIN}! Your shop, <strong>${data.shopName}</strong>, is now ready for setup.</p>
    <p>You can start managing your products and orders by logging into your dashboard.</p>
    <a href="${data.shopUrl}/dashboard" style="${buttonStyle}">Go to Dashboard</a>
  `, 'Welcome to the Platform');

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to ${env.APP_DOMAIN}!`,
      html,
    });
  } catch (error) {
    logger.error({ error, to }, 'Failed to send welcome email');
  }
}

export async function sendEmailVerification(to: string, data: { verificationUrl: string; ownerName: string }): Promise<void> {
  const html = emailLayout(`
    <p>Hi ${data.ownerName},</p>
    <p>Please verify your email address to secure your account and get full access to your shop.</p>
    <a href="${data.verificationUrl}" style="${buttonStyle}">Verify Email Address</a>
    <p style="margin-top: 24px; font-size: 14px; color: #64748b;">If you didn't create an account, you can safely ignore this email.</p>
  `, 'Verify Your Email');

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Verify your email address',
      html,
    });
  } catch (error) {
    logger.error({ error, to }, 'Failed to send verification email');
  }
}

export async function sendPasswordReset(to: string, data: { resetUrl: string; ownerName: string }): Promise<void> {
  const html = emailLayout(`
    <p>Hi ${data.ownerName},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <a href="${data.resetUrl}" style="${buttonStyle}">Reset Password</a>
    <p style="margin-top: 24px; font-size: 14px; color: #64748b;">If you didn't request this, your password will remain unchanged.</p>
  `, 'Reset Your Password');

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset your password',
      html,
    });
  } catch (error) {
    logger.error({ error, to }, 'Failed to send password reset email');
  }
}

export async function sendPaymentFailed(to: string, data: { shopName: string; retryUrl: string; failureCount: number }): Promise<void> {
  const html = emailLayout(`
    <p>Important: Payment failed for <strong>${data.shopName}</strong>.</p>
    <p>We were unable to process your subscription payment. This was attempt #${data.failureCount}.</p>
    <p>To avoid service interruption, please update your payment method:</p>
    <a href="${data.retryUrl}" style="${buttonStyle}">Update Payment Info</a>
  `, 'Payment Failed');

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Payment failed for ${data.shopName}`,
      html,
    });
  } catch (error) {
    logger.error({ error, to }, 'Failed to send payment failure email');
  }
}

export async function sendSubscriptionCancelled(to: string, data: { shopName: string; ownerName: string }): Promise<void> {
  const html = emailLayout(`
    <p>Hi ${data.ownerName},</p>
    <p>Your subscription for <strong>${data.shopName}</strong> has been cancelled. Your shop will remain active until the end of your current billing period.</p>
    <p>We're sorry to see you go! If you change your mind, you can reactivate your subscription anytime from the billing dashboard.</p>
  `, 'Subscription Cancelled');

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Subscription cancelled for ${data.shopName}`,
      html,
    });
  } catch (error) {
    logger.error({ error, to }, 'Failed to send subscription cancellation email');
  }
}

export async function sendSubscriptionActivated(to: string, data: { shopName: string; plan: string; renewalDate: string }): Promise<void> {
  const html = emailLayout(`
    <p>Success! Your subscription for <strong>${data.shopName}</strong> is now active.</p>
    <p>Plan: <strong>${data.plan}</strong><br>Next Renewal: <strong>${data.renewalDate}</strong></p>
    <p>Thank you for choosing our platform!</p>
    <a href="https://${env.APP_DOMAIN}/dashboard" style="${buttonStyle}">Go to Dashboard</a>
  `, 'Subscription Activated');

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Subscription activated: ${data.shopName}`,
      html,
    });
  } catch (error) {
    logger.error({ error, to }, 'Failed to send subscription activation email');
  }
}
