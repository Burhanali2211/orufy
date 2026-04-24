import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from './postgres';
import { performanceMonitor } from '../utils/performance';
import { DatabaseError, handleDatabaseError } from '../utils/errorHandling';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

// User interface
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'seller' | 'customer';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Authentication result interface
interface AuthResult {
  user?: User;
  token?: string;
  error?: string;
}

// Registration data interface
interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  role?: 'customer' | 'seller';
}

// Login data interface
interface LoginData {
  email: string;
  password: string;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

/**
 * Verify a password against its hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns Boolean indicating if password matches hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Password verification failed');
  }
};

/**
 * Generate a JWT token for a user
 * @param user - User object
 * @returns JWT token
 */
export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify a JWT token
 * @param token - JWT token
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Register a new user
 * @param userData - Registration data
 * @returns Authentication result with user and token
 */
export const registerUser = async (userData: RegistrationData): Promise<AuthResult> => {
  performanceMonitor.startMeasure('auth-register');
  
  try {
    // Validate input
    if (!userData.email || !userData.password || !userData.fullName) {
      return { error: 'Email, password, and full name are required' };
    }
    
    // Check if user already exists
    const existingUserResult = await executeQuery(
      'SELECT id FROM public.profiles WHERE email = $1',
      [userData.email.toLowerCase()]
    );
    
    if (existingUserResult.rows.length > 0) {
      performanceMonitor.endMeasure('auth-register', false);
      return { error: 'User with this email already exists' };
    }
    
    // Hash password
    const passwordHash = await hashPassword(userData.password);
    
    // Determine role (default to customer)
    const role = userData.role || 'customer';
    
    // Insert new user
    const insertResult = await executeQuery(
      `INSERT INTO public.profiles (
        id, email, full_name, role, password_hash, is_active, email_verified, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, email, full_name, role, is_active, email_verified, created_at, updated_at`,
      [
        uuidv4(),
        userData.email.toLowerCase(),
        userData.fullName,
        role,
        passwordHash,
        true, // is_active
        false // email_verified (will be verified through email confirmation)
      ]
    );
    
    if (insertResult.rows.length === 0) {
      performanceMonitor.endMeasure('auth-register', false);
      return { error: 'Failed to create user' };
    }
    
    // Transform database result to User interface
    const user: User = {
      id: insertResult.rows[0].id,
      email: insertResult.rows[0].email,
      fullName: insertResult.rows[0].full_name,
      role: insertResult.rows[0].role,
      isActive: insertResult.rows[0].is_active,
      emailVerified: insertResult.rows[0].email_verified,
      createdAt: insertResult.rows[0].created_at,
      updatedAt: insertResult.rows[0].updated_at
    };
    
    // Generate JWT token
    const token = generateToken(user);
    
    performanceMonitor.endMeasure('auth-register', true);
    
    return { user, token };
  } catch (error) {
    performanceMonitor.endMeasure('auth-register', false);
    
    console.error('Registration error:', error);
    return { error: 'Registration failed. Please try again.' };
  }
};

/**
 * Authenticate a user
 * @param loginData - Login credentials
 * @returns Authentication result with user and token
 */
export const loginUser = async (loginData: LoginData): Promise<AuthResult> => {
  performanceMonitor.startMeasure('auth-login');
  
  try {
    // Validate input
    if (!loginData.email || !loginData.password) {
      return { error: 'Email and password are required' };
    }
    
    // Find user by email
    const result = await executeQuery(
      `SELECT 
        id, email, full_name, role, password_hash, is_active, email_verified, created_at, updated_at
      FROM public.profiles 
      WHERE email = $1 AND is_active = true`,
      [loginData.email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      performanceMonitor.endMeasure('auth-login', false);
      return { error: 'Invalid credentials' };
    }
    
    const userRow = result.rows[0];
    
    // Verify password
    const isValidPassword = await verifyPassword(loginData.password, userRow.password_hash);
    if (!isValidPassword) {
      // Log failed attempt for security monitoring
      console.warn(`Failed login attempt for email: ${loginData.email}`);
      performanceMonitor.endMeasure('auth-login', false);
      return { error: 'Invalid credentials' };
    }
    
    // Transform database result to User interface
    const user: User = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      role: userRow.role,
      isActive: userRow.is_active,
      emailVerified: userRow.email_verified,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at
    };
    
    // Generate JWT token
    const token = generateToken(user);
    
    performanceMonitor.endMeasure('auth-login', true);
    
    return { user, token };
  } catch (error) {
    performanceMonitor.endMeasure('auth-login', false);
    
    console.error('Login error:', error);
    return { error: 'Login failed. Please try again.' };
  }
};

/**
 * Get user by ID
 * @param userId - User ID
 * @returns User object or null if not found
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const result = await executeQuery(
      `SELECT 
        id, email, full_name, role, is_active, email_verified, created_at, updated_at
      FROM public.profiles 
      WHERE id = $1 AND is_active = true`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const userRow = result.rows[0];
    
    return {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      role: userRow.role,
      isActive: userRow.is_active,
      emailVerified: userRow.email_verified,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at
    };
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw handleDatabaseError(error);
  }
};

/**
 * Get user by email
 * @param email - User email
 * @returns User object or null if not found
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const result = await executeQuery(
      `SELECT 
        id, email, full_name, role, is_active, email_verified, created_at, updated_at
      FROM public.profiles 
      WHERE email = $1 AND is_active = true`,
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const userRow = result.rows[0];
    
    return {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      role: userRow.role,
      isActive: userRow.is_active,
      emailVerified: userRow.email_verified,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at
    };
  } catch (error) {
    console.error('Get user by email error:', error);
    throw handleDatabaseError(error);
  }
};

/**
 * Update user profile
 * @param userId - User ID
 * @param updates - Profile updates
 * @returns Updated user object
 */
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Build dynamic update query
    if (updates.fullName !== undefined) {
      fields.push(`full_name = $${paramIndex}`);
      values.push(updates.fullName);
      paramIndex++;
    }
    
    if (updates.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(updates.email.toLowerCase());
      paramIndex++;
    }
    
    // Always update the updated_at timestamp
    fields.push(`updated_at = NOW()`);
    
    if (fields.length === 1) {
      // Only timestamp would be updated, skip update
      return await getUserById(userId);
    }
    
    values.push(userId); // For WHERE clause
    
    const query = `
      UPDATE public.profiles 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, role, is_active, email_verified, created_at, updated_at
    `;
    
    const result = await executeQuery(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const userRow = result.rows[0];
    
    return {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      role: userRow.role,
      isActive: userRow.is_active,
      emailVerified: userRow.email_verified,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at
    };
  } catch (error) {
    console.error('Update user profile error:', error);
    throw handleDatabaseError(error);
  }
};

/**
 * Change user password
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @returns Success status
 */
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get current password hash
    const result = await executeQuery(
      'SELECT password_hash FROM public.profiles WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'User not found' };
    }
    
    const currentHash = result.rows[0].password_hash;
    
    // Verify current password
    const isValid = await verifyPassword(currentPassword, currentHash);
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }
    
    // Hash new password
    const newHash = await hashPassword(newPassword);
    
    // Update password
    await executeQuery(
      'UPDATE public.profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'Failed to change password' };
  }
};

/**
 * Request password reset
 * @param email - User email
 * @returns Reset token or error
 */
export const requestPasswordReset = async (email: string): Promise<{ resetToken?: string; error?: string }> => {
  try {
    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return { resetToken: 'dummy-token' };
    }
    
    // Generate reset token (in a real implementation, this would be stored in the database)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, action: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );
    
    // In a real implementation, you would:
    // 1. Store the reset token in the database
    // 2. Send an email with the reset link
    // 3. Implement rate limiting for password reset requests
    
    return { resetToken };
  } catch (error) {
    console.error('Password reset request error:', error);
    return { error: 'Failed to process password reset request' };
  }
};

/**
 * Reset password with token
 * @param token - Reset token
 * @param newPassword - New password
 * @returns Success status
 */
export const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify token
    const payload = verifyToken(token);
    if (!payload || payload.action !== 'password-reset') {
      return { success: false, error: 'Invalid or expired reset token' };
    }
    
    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      return { success: false, error: 'Reset token has expired' };
    }
    
    // Hash new password
    const newHash = await hashPassword(newPassword);
    
    // Update password
    await executeQuery(
      'UPDATE public.profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, payload.userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
};

/**
 * Check if user has required role
 * @param user - User object
 * @param requiredRole - Required role
 * @returns Boolean indicating if user has required role
 */
export const hasRole = (user: User, requiredRole: 'admin' | 'seller' | 'customer'): boolean => {
  if (requiredRole === 'admin') {
    return user.role === 'admin';
  }
  
  if (requiredRole === 'seller') {
    return user.role === 'admin' || user.role === 'seller';
  }
  
  // For customer role, all active users qualify
  return user.isActive;
};

/**
 * Validate JWT token and return user
 * @param token - JWT token
 * @returns User object or null if invalid
 */
export const validateTokenAndGetUser = async (token: string): Promise<User | null> => {
  try {
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }
    
    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }
    
    // Get user from database
    const user = await getUserById(payload.userId);
    if (!user || !user.isActive) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
};

export default {
  registerUser,
  loginUser,
  getUserById,
  getUserByEmail,
  updateUserProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  hasRole,
  validateTokenAndGetUser,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken
};