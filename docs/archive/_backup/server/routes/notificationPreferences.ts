import { Router, Response } from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/notification-preferences
 * Get notification preferences for the authenticated user
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await query(
      `SELECT id, user_id, email_notifications, sms_notifications, push_notifications,
              order_updates, promotional_emails, newsletter, product_updates, price_alerts,
              created_at, updated_at
       FROM public.notification_preferences
       WHERE user_id = $1`,
      [req.userId]
    );

    // If no preferences exist, return default values
    if (result.rows.length === 0) {
      res.json({
        success: true,
        data: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          orderUpdates: true,
          promotionalEmails: false,
          newsletter: true,
          productUpdates: true,
          priceAlerts: false
        }
      });
      return;
    }

    // Transform snake_case to camelCase
    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        emailNotifications: row.email_notifications,
        smsNotifications: row.sms_notifications,
        pushNotifications: row.push_notifications,
        orderUpdates: row.order_updates,
        promotionalEmails: row.promotional_emails,
        newsletter: row.newsletter,
        productUpdates: row.product_updates,
        priceAlerts: row.price_alerts ?? false
      }
    });
  })
);

/**
 * POST /api/notification-preferences
 * Create notification preferences for the user
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      orderUpdates,
      promotionalEmails,
      newsletter,
      productUpdates,
      priceAlerts
    } = req.body;

    // Check if preferences already exist
    const existing = await query(
      'SELECT id FROM public.notification_preferences WHERE user_id = $1',
      [req.userId]
    );

    if (existing.rows.length > 0) {
      throw createError('Notification preferences already exist. Use PUT to update.', 400, 'ALREADY_EXISTS');
    }

    const result = await query(
      `INSERT INTO public.notification_preferences 
       (user_id, email_notifications, sms_notifications, push_notifications,
        order_updates, promotional_emails, newsletter, product_updates, price_alerts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.userId,
        emailNotifications !== undefined ? emailNotifications : true,
        smsNotifications !== undefined ? smsNotifications : false,
        pushNotifications !== undefined ? pushNotifications : true,
        orderUpdates !== undefined ? orderUpdates : true,
        promotionalEmails !== undefined ? promotionalEmails : false,
        newsletter !== undefined ? newsletter : true,
        productUpdates !== undefined ? productUpdates : true,
        priceAlerts !== undefined ? priceAlerts : false
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        emailNotifications: row.email_notifications,
        smsNotifications: row.sms_notifications,
        pushNotifications: row.push_notifications,
        orderUpdates: row.order_updates,
        promotionalEmails: row.promotional_emails,
        newsletter: row.newsletter,
        productUpdates: row.product_updates,
        priceAlerts: row.price_alerts
      },
      message: 'Notification preferences created successfully'
    });
  })
);

/**
 * PUT /api/notification-preferences
 * Update notification preferences for the user
 */
router.put(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      orderUpdates,
      promotionalEmails,
      newsletter,
      productUpdates,
      priceAlerts
    } = req.body;

    // Check if preferences exist
    const existing = await query(
      'SELECT id FROM public.notification_preferences WHERE user_id = $1',
      [req.userId]
    );

    if (existing.rows.length === 0) {
      // Create new preferences if they don't exist
      const result = await query(
        `INSERT INTO public.notification_preferences 
         (user_id, email_notifications, sms_notifications, push_notifications,
          order_updates, promotional_emails, newsletter, product_updates, price_alerts)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.userId,
          emailNotifications !== undefined ? emailNotifications : true,
          smsNotifications !== undefined ? smsNotifications : false,
          pushNotifications !== undefined ? pushNotifications : true,
          orderUpdates !== undefined ? orderUpdates : true,
          promotionalEmails !== undefined ? promotionalEmails : false,
          newsletter !== undefined ? newsletter : true,
          productUpdates !== undefined ? productUpdates : true,
          priceAlerts !== undefined ? priceAlerts : false
        ]
      );

      const row = result.rows[0];
      res.json({
        success: true,
        data: {
          id: row.id,
          emailNotifications: row.email_notifications,
          smsNotifications: row.sms_notifications,
          pushNotifications: row.push_notifications,
          orderUpdates: row.order_updates,
          promotionalEmails: row.promotional_emails,
          newsletter: row.newsletter,
          productUpdates: row.product_updates,
          priceAlerts: row.price_alerts
        },
        message: 'Notification preferences created successfully'
      });
      return;
    }

    // Update existing preferences
    const result = await query(
      `UPDATE public.notification_preferences
       SET email_notifications = COALESCE($1, email_notifications),
           sms_notifications = COALESCE($2, sms_notifications),
           push_notifications = COALESCE($3, push_notifications),
           order_updates = COALESCE($4, order_updates),
           promotional_emails = COALESCE($5, promotional_emails),
           newsletter = COALESCE($6, newsletter),
           product_updates = COALESCE($7, product_updates),
           price_alerts = COALESCE($8, price_alerts),
           updated_at = NOW()
       WHERE user_id = $9
       RETURNING *`,
      [
        emailNotifications,
        smsNotifications,
        pushNotifications,
        orderUpdates,
        promotionalEmails,
        newsletter,
        productUpdates,
        priceAlerts,
        req.userId
      ]
    );

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        emailNotifications: row.email_notifications,
        smsNotifications: row.sms_notifications,
        pushNotifications: row.push_notifications,
        orderUpdates: row.order_updates,
        promotionalEmails: row.promotional_emails,
        newsletter: row.newsletter,
        productUpdates: row.product_updates,
        priceAlerts: row.price_alerts
      },
      message: 'Notification preferences updated successfully'
    });
  })
);

export default router;