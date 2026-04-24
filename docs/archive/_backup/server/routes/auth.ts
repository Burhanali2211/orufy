import { Router, Response } from 'express';
import { query } from '../db/connection';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter, registerLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  registerLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // CRITICAL: Log what we're receiving for debugging
    console.log('Register route - Request received:', {
      bodyType: typeof req.body,
      bodyIsArray: Array.isArray(req.body),
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodyValue: req.body,
      contentType: req.headers['content-type'],
      hasBody: !!req.body,
      bodyString: typeof req.body === 'string' ? req.body.substring(0, 200) : null
    });

    // CRITICAL FIX: Manually parse body if it's still a string
    if (typeof req.body === 'string' && req.body.length > 0) {
      try {
        req.body = JSON.parse(req.body);
        console.log('Register route - Parsed body from string:', { keys: Object.keys(req.body) });
      } catch (parseError) {
        console.error('Register route - Failed to parse body:', parseError);
      }
    }

    // Extract data from request body
    const { email, password, fullName, firstName, lastName, role = 'customer' } = req.body || {};

    console.log('Register route - Extracted data:', {
      hasEmail: !!email,
      emailType: typeof email,
      emailValue: email ? email.substring(0, 10) + '...' : null,
      hasPassword: !!password,
      hasFullName: !!fullName
    });

    // Support both fullName and firstName/lastName
    let userFullName = fullName;
    if (!userFullName && (firstName || lastName)) {
      userFullName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    // Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw createError('Email is required', 400, 'VALIDATION_ERROR');
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      throw createError('Password is required', 400, 'VALIDATION_ERROR');
    }

    if (!userFullName || typeof userFullName !== 'string' || !userFullName.trim()) {
      throw createError('Full name is required', 400, 'VALIDATION_ERROR');
    }

    if (password.trim().length < 8) {
      throw createError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
    }

    // Normalize email
    const normalizedEmail = String(email).toLowerCase().trim();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw createError('Invalid email format', 400, 'VALIDATION_ERROR');
    }

    // Public registrations are always customer role
    const userRole = 'customer';

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM public.profiles WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      throw createError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await query(
      `INSERT INTO public.profiles (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, created_at`,
      [normalizedEmail, passwordHash, userFullName.trim(), userRole]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    });
  })
);

/**
 * GET /api/auth/login
 * Returns information about the login endpoint (for browser access)
 */
router.get(
  '/login',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(405).json({
      error: {
        status: 405,
        code: 'METHOD_NOT_ALLOWED',
        message: 'GET method is not allowed for /api/auth/login',
        userMessage: 'This endpoint only accepts POST requests. Please use POST method with email and password in the request body.',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        allowedMethods: ['POST'],
        example: {
          method: 'POST',
          url: '/api/auth/login',
          body: {
            email: 'user@example.com',
            password: 'your-password'
          }
        }
      }
    });
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // CRITICAL: Log what we're receiving for debugging
    console.log('Login route - Request received:', {
      bodyType: typeof req.body,
      bodyIsArray: Array.isArray(req.body),
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodyValue: req.body,
      contentType: req.headers['content-type'],
      hasBody: !!req.body,
      bodyString: typeof req.body === 'string' ? req.body.substring(0, 200) : null
    });

    // CRITICAL FIX: Manually parse body if it's still a string
    if (typeof req.body === 'string' && req.body.length > 0) {
      try {
        req.body = JSON.parse(req.body);
        console.log('Login route - Parsed body from string:', { keys: Object.keys(req.body) });
      } catch (parseError) {
        console.error('Login route - Failed to parse body:', parseError);
      }
    }

    // Extract data from request body
    const { email, password } = req.body || {};

    console.log('Login route - Extracted data:', {
      hasEmail: !!email,
      emailType: typeof email,
      emailValue: email ? email.substring(0, 10) + '...' : null,
      hasPassword: !!password,
      passwordType: typeof password
    });

    // Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw createError('Email is required', 400, 'VALIDATION_ERROR');
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      throw createError('Password is required', 400, 'VALIDATION_ERROR');
    }

    // Normalize email
    const normalizedEmail = String(email).toLowerCase().trim();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw createError('Invalid email format', 400, 'VALIDATION_ERROR');
    }

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, full_name, role, is_active FROM public.profiles WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.is_active === false) {
      throw createError('Account is deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    if (!user.password_hash) {
      logger.error('User has no password hash', undefined, { context: 'Auth', data: { email } });
      throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await query(
      `SELECT id, email, full_name, avatar_url, role, phone, date_of_birth, gender,
              is_active, email_verified, business_name, business_address, business_phone, tax_id,
              preferred_language, newsletter_subscribed, created_at, updated_at
       FROM public.profiles WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      throw createError('User not found', 404, 'NOT_FOUND');
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatar: user.avatar_url,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        businessName: user.business_name,
        businessAddress: user.business_address,
        businessPhone: user.business_phone,
        taxId: user.tax_id,
        preferredLanguage: user.preferred_language,
        newsletterSubscribed: user.newsletter_subscribed,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  })
);

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      fullName,
      phone,
      dateOfBirth,
      avatarUrl,
      gender,
      businessName,
      businessAddress,
      businessPhone,
      taxId,
      preferredLanguage,
      newsletterSubscribed
    } = req.body;

    const result = await query(
      `UPDATE public.profiles
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           date_of_birth = COALESCE($3, date_of_birth),
           avatar_url = COALESCE($4, avatar_url),
           gender = COALESCE($5, gender),
           business_name = COALESCE($7, business_name),
           business_address = COALESCE($8, business_address),
           business_phone = COALESCE($9, business_phone),
           tax_id = COALESCE($10, tax_id),
           preferred_language = COALESCE($11, preferred_language),
           newsletter_subscribed = COALESCE($12, newsletter_subscribed),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, full_name, avatar_url, role, phone, date_of_birth, gender, business_name, business_address, business_phone, tax_id, preferred_language, newsletter_subscribed, updated_at`,
      [fullName, phone, dateOfBirth, avatarUrl, gender, req.userId, businessName, businessAddress, businessPhone, taxId, preferredLanguage, newsletterSubscribed]
    );

    if (result.rows.length === 0) {
      throw createError('User not found', 404, 'NOT_FOUND');
    }

    const user = result.rows[0];
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatar: user.avatar_url,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        businessName: user.business_name,
        businessAddress: user.business_address,
        businessPhone: user.business_phone,
        taxId: user.tax_id,
        preferredLanguage: user.preferred_language,
        newsletterSubscribed: user.newsletter_subscribed,
        updatedAt: user.updated_at,
      },
    });
  })
);

export default router;
