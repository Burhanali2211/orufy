import { Router, Response } from 'express';
import { query } from '../../db/connection';
import { asyncHandler, createError } from '../../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { adminLimiter } from '../../middleware/rateLimiter';
import { logger } from '../../utils/logger';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

/**
 * GET /api/admin/contact-submissions
 * Get all contact submissions with pagination and filtering
 */
router.get(
  '/',
  adminLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Declare variables outside try block so they're accessible in catch block
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    // Build query with proper parameter indexing
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;
    let whereClause = '';

    // Build WHERE conditions
    if (status) {
      whereConditions.push(`cs.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      const searchParam = `%${search}%`;
      whereConditions.push(
        `(cs.name ILIKE $${paramIndex} OR cs.email ILIKE $${paramIndex} OR cs.subject ILIKE $${paramIndex} OR cs.message ILIKE $${paramIndex})`
      );
      queryParams.push(searchParam);
      paramIndex++;
    }

    whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    try {

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM public.contact_submissions cs ${whereClause}`;
      const countResult = await query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0]?.total || '0');

      // Get submissions - properly index limit and offset parameters
      // After WHERE conditions, limit and offset are the next parameters
      const limitParamIndex = paramIndex;
      const offsetParamIndex = paramIndex + 1;
      
      const submissionsQuery = `SELECT 
        cs.id,
        cs.name,
        cs.email,
        cs.phone,
        cs.subject,
        cs.message,
        cs.status,
        cs.admin_notes,
        cs.user_id,
        cs.replied_at,
        cs.replied_by,
        cs.created_at,
        cs.updated_at,
        p.full_name as user_name,
        p.email as user_email,
        admin.full_name as replied_by_name
      FROM public.contact_submissions cs
      LEFT JOIN public.profiles p ON cs.user_id = p.id
      LEFT JOIN public.profiles admin ON cs.replied_by = admin.id
      ${whereClause}
      ORDER BY cs.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;
      
      const submissionsResult = await query(
        submissionsQuery,
        [...queryParams, limit, offset]
      );

      const submissions = submissionsResult.rows || [];

      res.json({
        success: true,
        data: {
          submissions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      // Check if table doesn't exist
      if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        logger.error('Contact submissions table does not exist', {
          context: 'ContactSubmissions',
          error: error.message,
        });
        
        // Try to create the table automatically
        try {
          const { initializeSchema } = await import('../../db/init');
          await initializeSchema();
          logger.info('Contact submissions table created automatically', { context: 'ContactSubmissions' });
          
          // Retry the query
          const countResult = await query(
            `SELECT COUNT(*) as total FROM public.contact_submissions cs ${whereClause}`,
            queryParams
          );
          const total = parseInt(countResult.rows[0]?.total || '0');

          const limitParamIndex = paramIndex;
          const offsetParamIndex = paramIndex + 1;
          
          const submissionsQuery = `SELECT 
            cs.id,
            cs.name,
            cs.email,
            cs.phone,
            cs.subject,
            cs.message,
            cs.status,
            cs.admin_notes,
            cs.user_id,
            cs.replied_at,
            cs.replied_by,
            cs.created_at,
            cs.updated_at,
            p.full_name as user_name,
            p.email as user_email,
            admin.full_name as replied_by_name
          FROM public.contact_submissions cs
          LEFT JOIN public.profiles p ON cs.user_id = p.id
          LEFT JOIN public.profiles admin ON cs.replied_by = admin.id
          ${whereClause}
          ORDER BY cs.created_at DESC
          LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;
          
          const submissionsResult = await query(
            submissionsQuery,
            [...queryParams, limit, offset]
          );

          const submissions = submissionsResult.rows || [];

          return res.json({
            success: true,
            data: {
              submissions,
              pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
              },
            },
          });
        } catch (retryError: any) {
          logger.error('Failed to create contact submissions table', {
            context: 'ContactSubmissions',
            error: retryError.message,
          });
          throw createError(
            'Database setup incomplete. Please contact the administrator.',
            500,
            'DATABASE_ERROR',
            { originalError: retryError.message },
            'The contact submissions table is being set up. Please try again in a few moments.'
          );
        }
      }
      
      logger.error('Error fetching contact submissions', {
        context: 'ContactSubmissions',
        error: error.message,
        stack: error.stack,
        query: req.query,
      });
      throw createError(
        'Failed to fetch contact submissions',
        500,
        'DATABASE_ERROR',
        { originalError: error.message },
        'Unable to load contact submissions. Please try again later.'
      );
    }
  })
);

/**
 * GET /api/admin/contact-submissions/:id
 * Get a single contact submission
 */
router.get(
  '/:id',
  adminLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        cs.id,
        cs.name,
        cs.email,
        cs.phone,
        cs.subject,
        cs.message,
        cs.status,
        cs.admin_notes,
        cs.user_id,
        cs.replied_at,
        cs.replied_by,
        cs.created_at,
        cs.updated_at,
        p.full_name as user_name,
        p.email as user_email,
        admin.full_name as replied_by_name
      FROM public.contact_submissions cs
      LEFT JOIN public.profiles p ON cs.user_id = p.id
      LEFT JOIN public.profiles admin ON cs.replied_by = admin.id
      WHERE cs.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw createError('Contact submission not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  })
);

/**
 * PATCH /api/admin/contact-submissions/:id
 * Update contact submission status and admin notes
 */
router.patch(
  '/:id',
  adminLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    // Validate status if provided
    if (status && !['new', 'read', 'replied', 'archived'].includes(status)) {
      throw createError('Invalid status value', 400, 'VALIDATION_ERROR');
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;

      // If marking as replied, set replied_at and replied_by
      if (status === 'replied') {
        updates.push(`replied_at = NOW()`);
        updates.push(`replied_by = $${paramIndex}`);
        params.push(req.userId!);
        paramIndex++;
      }
    }

    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${paramIndex}`);
      params.push(admin_notes);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400, 'VALIDATION_ERROR');
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await query(
      `UPDATE public.contact_submissions 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw createError('Contact submission not found', 404, 'NOT_FOUND');
    }

    logger.info('Contact submission updated', {
      context: 'ContactSubmissions',
      data: {
        submissionId: id,
        updatedBy: req.userId!,
        changes: { status, admin_notes: admin_notes !== undefined },
      },
    });

    res.json({
      success: true,
      message: 'Contact submission updated successfully',
      data: result.rows[0],
    });
  })
);

/**
 * DELETE /api/admin/contact-submissions/:id
 * Delete a contact submission (soft delete by archiving)
 */
router.delete(
  '/:id',
  adminLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
      `UPDATE public.contact_submissions 
       SET status = 'archived', updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      throw createError('Contact submission not found', 404, 'NOT_FOUND');
    }

    logger.info('Contact submission archived', {
      context: 'ContactSubmissions',
      data: {
        submissionId: id,
        archivedBy: req.userId!,
      },
    });

    res.json({
      success: true,
      message: 'Contact submission archived successfully',
    });
  })
);

export default router;

