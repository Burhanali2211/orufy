import { Router, Response } from 'express';
import { query } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/addresses
 * Get all addresses for the authenticated user
 */
// Helper function to transform address row to camelCase
const transformAddress = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  fullName: row.full_name,
  phone: row.phone,
  streetAddress: row.street_address,
  city: row.city,
  state: row.state,
  postalCode: row.postal_code,
  country: row.country,
  isDefault: row.is_default,
  type: row.type || row.address_type,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await query(
      `SELECT id, user_id, full_name, phone, street_address, city, state, 
              postal_code, country, is_default, type as address_type, 
              created_at, updated_at
       FROM public.addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.userId]
    );

    res.json({
      success: true,
      data: result.rows.map(transformAddress)
    });
  })
);

/**
 * GET /api/addresses/:id
 * Get a specific address
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
      `SELECT id, user_id, full_name, phone, street_address, city, state, 
              postal_code, country, is_default, type as address_type, 
              created_at, updated_at
       FROM public.addresses
       WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      throw createError('Address not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: transformAddress(result.rows[0])
    });
  })
);

/**
 * POST /api/addresses
 * Create a new address
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      fullName,
      phone,
      streetAddress,
      city,
      state,
      postalCode,
      country,
      isDefault,
      type
    } = req.body;

    // Validation
    if (!fullName || !streetAddress || !city || !state || !postalCode || !country) {
      throw createError('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await query(
        'UPDATE public.addresses SET is_default = false WHERE user_id = $1',
        [req.userId]
      );
    }

    const result = await query(
      `INSERT INTO public.addresses 
       (user_id, full_name, phone, street_address, city, state, postal_code, 
        country, is_default, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.userId,
        fullName,
        phone || null,
        streetAddress,
        city,
        state,
        postalCode,
        country,
        isDefault || false,
        type || 'home'
      ]
    );

    res.status(201).json({
      success: true,
      data: transformAddress(result.rows[0]),
      message: 'Address created successfully'
    });
  })
);

/**
 * PUT /api/addresses/:id
 * Update an address
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
      fullName,
      phone,
      streetAddress,
      city,
      state,
      postalCode,
      country,
      isDefault,
      type
    } = req.body;

    // Check if address exists and belongs to user
    const existing = await query(
      'SELECT id FROM public.addresses WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      throw createError('Address not found', 404, 'NOT_FOUND');
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await query(
        'UPDATE public.addresses SET is_default = false WHERE user_id = $1 AND id != $2',
        [req.userId, id]
      );
    }

    const result = await query(
      `UPDATE public.addresses
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           street_address = COALESCE($3, street_address),
           city = COALESCE($4, city),
           state = COALESCE($5, state),
           postal_code = COALESCE($6, postal_code),
           country = COALESCE($7, country),
           is_default = COALESCE($8, is_default),
           type = COALESCE($9, type),
           updated_at = NOW()
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        fullName,
        phone,
        streetAddress,
        city,
        state,
        postalCode,
        country,
        isDefault,
        type,
        id,
        req.userId
      ]
    );

    res.json({
      success: true,
      data: transformAddress(result.rows[0]),
      message: 'Address updated successfully'
    });
  })
);

/**
 * PUT /api/addresses/:id/default
 * Set an address as default
 */
router.put(
  '/:id/default',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const existing = await query(
      'SELECT id FROM public.addresses WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      throw createError('Address not found', 404, 'NOT_FOUND');
    }

    // Unset all defaults for this user
    await query(
      'UPDATE public.addresses SET is_default = false WHERE user_id = $1',
      [req.userId]
    );

    // Set this address as default
    const result = await query(
      `UPDATE public.addresses
       SET is_default = true, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.userId]
    );

    res.json({
      success: true,
      data: transformAddress(result.rows[0]),
      message: 'Default address updated successfully'
    });
  })
);

/**
 * DELETE /api/addresses/:id
 * Delete an address
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM public.addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      throw createError('Address not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  })
);

export default router;