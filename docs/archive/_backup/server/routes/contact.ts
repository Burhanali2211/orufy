import { Router, Response } from 'express';
import { query } from '../db/connection';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/contact
 * Submit a contact form
 */
router.post(
  '/',
  apiLimiter,
  asyncHandler(async (req, res: Response) => {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      throw createError('Name, email, subject, and message are required', 400, 'VALIDATION_ERROR');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError('Invalid email format', 400, 'VALIDATION_ERROR');
    }

    // Get user_id if user is authenticated
    let userId = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET || '') as any;
        userId = decoded.userId || null;
      } catch (error) {
        // If token is invalid, continue as guest
        logger.debug('Invalid token in contact submission, proceeding as guest');
      }
    }

    // Insert contact submission
    try {
      const result = await query(
        `INSERT INTO public.contact_submissions 
         (name, email, phone, subject, message, user_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, name, email, phone, subject, message, status, created_at`,
        [name.trim(), email.trim().toLowerCase(), phone?.trim() || null, subject.trim(), message.trim(), userId]
      );

      const submission = result.rows[0];

      logger.info('Contact form submitted', {
        context: 'Contact',
        data: {
          submissionId: submission.id,
          email: submission.email,
          subject: submission.subject,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you soon.',
        data: {
          id: submission.id,
          name: submission.name,
          email: submission.email,
          subject: submission.subject,
          createdAt: submission.created_at,
        },
      });
    } catch (error: any) {
      // Check if table doesn't exist
      if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        logger.error('Contact submissions table does not exist', {
          context: 'Contact',
          error: error.message,
        });
        
        // Try to create the table automatically
        try {
          const { initializeSchema } = await import('../db/init');
          await initializeSchema();
          logger.info('Contact submissions table created automatically', { context: 'Contact' });
          
          // Retry the insert
          const result = await query(
            `INSERT INTO public.contact_submissions 
             (name, email, phone, subject, message, user_id) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, name, email, phone, subject, message, status, created_at`,
            [name.trim(), email.trim().toLowerCase(), phone?.trim() || null, subject.trim(), message.trim(), userId]
          );

          const submission = result.rows[0];

          res.status(201).json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.',
            data: {
              id: submission.id,
              name: submission.name,
              email: submission.email,
              subject: submission.subject,
              createdAt: submission.created_at,
            },
          });
        } catch (retryError: any) {
          logger.error('Failed to create contact submissions table', {
            context: 'Contact',
            error: retryError.message,
          });
          throw createError(
            'Database setup incomplete. Please contact the administrator.',
            500,
            'DATABASE_ERROR',
            { originalError: retryError.message },
            'We are currently setting up our system. Please try again in a few moments.'
          );
        }
      } else {
        // Re-throw other errors
        logger.error('Error submitting contact form', {
          context: 'Contact',
          error: error.message,
          stack: error.stack,
        });
        throw createError(
          'Failed to submit contact form',
          500,
          'DATABASE_ERROR',
          { originalError: error.message },
          'Unable to submit your message. Please try again later.'
        );
      }
    }
  })
);

export default router;

