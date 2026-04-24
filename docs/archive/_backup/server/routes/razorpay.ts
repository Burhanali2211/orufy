/**
 * Razorpay Payment Routes
 *
 * Handles Razorpay payment integration with security best practices
 * Reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
 */

import express, { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { query } from '../db/connection';
import { logger } from '../utils/logger';
import { checkoutLimiter, webhookLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Lazy initialization of Razorpay instance
// Only create when credentials are available
let razorpay: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    // Validate Razorpay Key ID format
    // Should start with 'rzp_test_' or 'rzp_live_'
    if (!keyId.match(/^rzp_(test|live)_/)) {
      logger.error('Invalid Razorpay Key ID format', undefined, { 
        context: 'Payment',
        data: {
          keyIdPrefix: keyId.substring(0, 15) + '...' // Log partial key for debugging
        }
      });
      throw new Error(`Invalid Razorpay Key ID format. Key ID should start with "rzp_test_" or "rzp_live_". Found: ${keyId.substring(0, 15)}...`);
    }
    
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  
  return razorpay;
}

// Helper function to validate Razorpay webhook signature
function validateWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * POST /api/razorpay/create-order
 * Create a Razorpay order
 *
 * Request body:
 * {
 *   amount: number (in rupees),
 *   currency: string (default: 'INR'),
 *   receipt: string (optional),
 *   notes: object (optional)
 * }
 */
router.post(
  '/create-order',
  checkoutLimiter, // Rate limit: 10 attempts per 15 minutes
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      throw createError('Invalid amount. Amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    // Validate amount is not too large (max 10 lakhs)
    if (amount > 1000000) {
      throw createError('Amount exceeds maximum limit', 400, 'VALIDATION_ERROR');
    }

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      logger.error('Razorpay credentials not configured', undefined, { context: 'Payment' });
      const missingVars = [];
      if (!process.env.RAZORPAY_KEY_ID) missingVars.push('RAZORPAY_KEY_ID');
      if (!process.env.RAZORPAY_KEY_SECRET) missingVars.push('RAZORPAY_KEY_SECRET');
      
      // Provide different instructions for serverless (Netlify) vs local development
      const isServerless = process.env.IS_SERVERLESS === 'true' || process.env.NETLIFY === 'true';
      let instruction = '';
      if (isServerless) {
        instruction = 'Please add them in Netlify Dashboard → Site settings → Environment variables, then redeploy your site.';
      } else {
        instruction = 'Please add them to your .env file and restart the server.';
      }
      
      throw createError(
        `Payment service is not configured. Missing environment variables: ${missingVars.join(', ')}. ${instruction}`,
        500,
        'CONFIGURATION_ERROR'
      );
    }

    try {
      // Create Razorpay order with proper options
      const options: any = {
        amount: Math.round(amount * 100), // Amount in paise (smallest currency unit)
        currency,
        receipt: receipt || `receipt_${req.userId}_${Date.now()}`,
        notes: {
          user_id: req.userId,
          ...notes
        }
      };

      logger.payment('Creating Razorpay order', undefined, amount);

      const razorpayInstance = getRazorpayInstance();
      const order = await razorpayInstance.orders.create(options);

      logger.payment('Razorpay order created successfully', order.id, Number(order.amount));

      res.json({
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt
        }
      });
    } catch (error: any) {
      logger.error('Razorpay order creation error', error, {
        context: 'Payment',
        data: { userId: req.userId, amount }
      });

      throw createError(
        error.message || 'Failed to create Razorpay order',
        500,
        'RAZORPAY_ERROR'
      );
    }
  })
);

/**
 * POST /api/razorpay/verify-payment
 * Verify Razorpay payment signature and update order status
 *
 * Request body:
 * {
 *   razorpay_order_id: string,
 *   razorpay_payment_id: string,
 *   razorpay_signature: string
 * }
 */
router.post(
  '/verify-payment',
  checkoutLimiter, // Rate limit: 10 attempts per 15 minutes
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw createError('Missing payment verification parameters', 400, 'VALIDATION_ERROR');
    }

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      logger.error('Razorpay secret key not configured', undefined, { context: 'Payment' });
      const isServerless = process.env.IS_SERVERLESS === 'true' || process.env.NETLIFY === 'true';
      const instruction = isServerless 
        ? 'Please add it in Netlify Dashboard → Site settings → Environment variables, then redeploy your site.'
        : 'Please add it to your .env file and restart the server.';
      throw createError(
        `Payment service is not configured. Missing RAZORPAY_KEY_SECRET. ${instruction}`,
        500,
        'CONFIGURATION_ERROR'
      );
    }

    try {
      console.log('Verifying payment:', {
        userId: req.userId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });

      // Step 1: Verify signature (CRITICAL SECURITY CHECK)
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      // Use constant-time comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpay_signature)
      );

      if (!isValid) {
        console.error('Invalid payment signature detected:', {
          userId: req.userId,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id
        });
        throw createError('Invalid payment signature. Payment verification failed.', 400, 'INVALID_SIGNATURE');
      }

      // Step 2: Fetch payment details from Razorpay API
      const razorpayInstance = getRazorpayInstance();
      const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

      console.log('Payment fetched from Razorpay:', {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount
      });

      // Step 3: Verify payment status is captured
      if (payment.status !== 'captured') {
        console.warn('Payment not captured:', {
          paymentId: razorpay_payment_id,
          status: payment.status
        });
        throw createError('Payment not captured. Please try again.', 400, 'PAYMENT_NOT_CAPTURED');
      }

      // Step 4: Update order payment status in database
      try {
        // Find order by razorpay_order_id first (if order was created with it)
        // Otherwise, find the most recent pending order for the user that doesn't have a payment yet
        // This handles the case where order is created before payment
        const orderResult = await query(
          `SELECT id FROM public.orders
           WHERE (razorpay_order_id = $1)
           OR (user_id = $2 AND status = 'pending' AND payment_status = 'pending' AND razorpay_payment_id IS NULL)
           ORDER BY 
             CASE WHEN razorpay_order_id = $1 THEN 1 ELSE 2 END,
             created_at DESC
           LIMIT 1`,
          [razorpay_order_id, req.userId]
        );

        if (orderResult.rows.length === 0) {
          console.warn('No order found to update payment status:', {
            userId: req.userId,
            razorpayOrderId: razorpay_order_id
          });
        } else {
          const orderId = orderResult.rows[0].id;
          const paymentAmount = Number(payment.amount) / 100; // Convert from paise to rupees

          // Prepare payment method details
          const paymentMethodDetails = {
            method: payment.method,
            card: payment.card || null,
            bank: payment.bank || null,
            wallet: payment.wallet || null,
            vpa: payment.vpa || null,
            email: payment.email,
            contact: payment.contact,
            created_at: payment.created_at,
            international: payment.international || false
          };

          // Update order with payment information
          await query(
            `UPDATE public.orders
             SET payment_status = $1,
                 razorpay_payment_id = $2,
                 razorpay_order_id = $3,
                 payment_method_details = $4,
                 payment_id = $2,
                 updated_at = NOW()
             WHERE id = $5`,
            ['paid', razorpay_payment_id, razorpay_order_id, JSON.stringify(paymentMethodDetails), orderId]
          );

          // Create payment log entry for audit trail
          await query(
            `INSERT INTO public.payment_logs
             (order_id, razorpay_payment_id, razorpay_order_id, event_type, status, amount, currency, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              orderId,
              razorpay_payment_id,
              razorpay_order_id,
              'payment_captured',
              'captured',
              paymentAmount,
              payment.currency || 'INR',
              JSON.stringify({
                method: payment.method,
                email: payment.email,
                contact: payment.contact,
                created_at: payment.created_at
              })
            ]
          );

          console.log('Order payment status updated successfully:', {
            userId: req.userId,
            orderId: orderId,
            paymentId: razorpay_payment_id,
            amount: paymentAmount,
            status: 'paid'
          });
        }
      } catch (dbError) {
        console.error('Failed to update order payment status:', dbError);
        // Don't throw error here - payment is verified, just log the issue
        // But we should still return success since payment was verified
      }

      res.json({
        success: true,
        data: {
          verified: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: payment.status,
          method: payment.method,
          amount: Number(payment.amount) / 100, // Convert from paise to rupees
          email: payment.email,
          contact: payment.contact,
          createdAt: payment.created_at
        }
      });
    } catch (error: any) {
      console.error('Razorpay payment verification error:', {
        userId: req.userId,
        error: error.message,
        errorCode: error.code
      });

      if (error.code === 'INVALID_SIGNATURE' || error.code === 'PAYMENT_NOT_CAPTURED') {
        throw error;
      }

      throw createError(
        error.message || 'Failed to verify payment',
        500,
        'RAZORPAY_ERROR'
      );
    }
  })
);

/**
 * GET /api/razorpay/payment/:paymentId
 * Get payment details
 */
router.get(
  '/payment/:paymentId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { paymentId } = req.params;

    if (!paymentId) {
      throw createError('Payment ID is required', 400, 'VALIDATION_ERROR');
    }

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      const missingVars = [];
      if (!process.env.RAZORPAY_KEY_ID) missingVars.push('RAZORPAY_KEY_ID');
      if (!process.env.RAZORPAY_KEY_SECRET) missingVars.push('RAZORPAY_KEY_SECRET');
      
      const isServerless = process.env.IS_SERVERLESS === 'true' || process.env.NETLIFY === 'true';
      const instruction = isServerless 
        ? 'Please add them in Netlify Dashboard → Site settings → Environment variables, then redeploy your site.'
        : 'Please add them to your .env file and restart the server.';
      
      throw createError(
        `Payment service is not configured. Missing environment variables: ${missingVars.join(', ')}. ${instruction}`,
        500,
        'CONFIGURATION_ERROR'
      );
    }

    try {
      const razorpayInstance = getRazorpayInstance();
      const payment = await razorpayInstance.payments.fetch(paymentId);

      res.json({
        success: true,
        data: {
          id: payment.id,
          orderId: payment.order_id,
          status: payment.status,
          method: payment.method,
          amount: Number(payment.amount) / 100,
          currency: payment.currency,
          email: payment.email,
          contact: payment.contact,
          createdAt: payment.created_at
        }
      });
    } catch (error: any) {
      console.error('Razorpay payment fetch error:', error);
      throw createError(
        error.message || 'Failed to fetch payment details',
        500,
        'RAZORPAY_ERROR'
      );
    }
  })
);

/**
 * POST /api/razorpay/refund
 * Create a refund
 */
router.post(
  '/refund',
  checkoutLimiter, // Rate limit: 10 attempts per 15 minutes
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { paymentId, amount, notes } = req.body;

    if (!paymentId) {
      throw createError('Payment ID is required', 400, 'VALIDATION_ERROR');
    }

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      const missingVars = [];
      if (!process.env.RAZORPAY_KEY_ID) missingVars.push('RAZORPAY_KEY_ID');
      if (!process.env.RAZORPAY_KEY_SECRET) missingVars.push('RAZORPAY_KEY_SECRET');
      
      const isServerless = process.env.IS_SERVERLESS === 'true' || process.env.NETLIFY === 'true';
      const instruction = isServerless 
        ? 'Please add them in Netlify Dashboard → Site settings → Environment variables, then redeploy your site.'
        : 'Please add them to your .env file and restart the server.';
      
      throw createError(
        `Payment service is not configured. Missing environment variables: ${missingVars.join(', ')}. ${instruction}`,
        500,
        'CONFIGURATION_ERROR'
      );
    }

    try {
      const refundOptions: any = {
        payment_id: paymentId
      };

      if (amount) {
        refundOptions.amount = Math.round(Number(amount) * 100); // Amount in paise
      }

      if (notes) {
        refundOptions.notes = notes;
      }

      const razorpayInstance = getRazorpayInstance();
      const refund = await razorpayInstance.payments.refund(paymentId, refundOptions);

      res.json({
        success: true,
        data: {
          id: refund.id,
          paymentId: refund.payment_id,
          amount: refund.amount / 100,
          status: refund.status,
          createdAt: refund.created_at
        }
      });
    } catch (error: any) {
      console.error('Razorpay refund error:', error);
      throw createError(
        error.message || 'Failed to create refund',
        500,
        'RAZORPAY_ERROR'
      );
    }
  })
);

/**
 * POST /api/razorpay/webhook
 * Handle Razorpay webhook events
 *
 * Events handled:
 * - payment.authorized: Payment authorized
 * - payment.failed: Payment failed
 * - refund.created: Refund created
 */
router.post(
  '/webhook',
  webhookLimiter, // Rate limit: 100 requests per 15 minutes
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);

    // Validate webhook signature
    if (!validateWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature detected');
      throw createError('Invalid webhook signature', 401, 'INVALID_SIGNATURE');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Razorpay webhook received:', {
      event: event,
      paymentId: payload?.payment?.entity?.id
    });

    try {
      switch (event) {
        case 'payment.authorized':
          // Handle payment authorized
          console.log('Payment authorized:', payload.payment.entity.id);
          break;

        case 'payment.failed':
          // Handle payment failed
          console.log('Payment failed:', {
            paymentId: payload.payment.entity.id,
            reason: payload.payment.entity.error_reason
          });

          // Update order status to failed
          try {
            await query(
              `UPDATE public.orders
               SET payment_status = $1, updated_at = NOW()
               WHERE razorpay_payment_id = $2`,
              ['failed', payload.payment.entity.id]
            );
          } catch (dbError) {
            console.error('Failed to update order status for failed payment:', dbError);
          }
          break;

        case 'refund.created':
          // Handle refund created
          console.log('Refund created:', {
            refundId: payload.refund.entity.id,
            paymentId: payload.refund.entity.payment_id
          });

          // Update order status to refunded
          try {
            await query(
              `UPDATE public.orders
               SET payment_status = $1, updated_at = NOW()
               WHERE razorpay_payment_id = $2`,
              ['refunded', payload.refund.entity.payment_id]
            );
          } catch (dbError) {
            console.error('Failed to update order status for refund:', dbError);
          }
          break;

        default:
          console.log('Unhandled webhook event:', event);
      }

      // Always return 200 OK to acknowledge receipt
      res.json({ success: true, message: 'Webhook processed' });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      // Still return 200 to prevent Razorpay from retrying
      res.json({ success: false, message: 'Webhook processing failed' });
    }
  })
);

export default router;

