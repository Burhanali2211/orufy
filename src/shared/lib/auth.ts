/**
 * Client-side authentication utilities
 * Delegates all auth to the apiClient (Node.js/Postgres backend)
 */

import { apiClient } from '@/shared/lib/apiClient';

// User interface (client-side)
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'customer';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication result interface
interface AuthResult {
  user?: User;
  error?: string;
}

// Registration data interface
interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  role?: 'customer';
}

// Login data interface
interface LoginData {
  email: string;
  password: string;
}

/**
 * Register a new user
 */
export const registerUser = async (userData: RegistrationData): Promise<AuthResult> => {
  try {
    if (!userData.email || !userData.password || !userData.fullName) {
      return { error: 'Email, password, and full name are required' };
    }
    const result = await apiClient.post('/auth/register', {
      email: userData.email.toLowerCase(),
      password: userData.password,
      full_name: userData.fullName,
      role: userData.role || 'customer',
    });
    return { user: mapUser(result) };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { error: error?.message || 'Registration failed. Please try again.' };
  }
};

/**
 * Authenticate a user
 */
export const loginUser = async (loginData: LoginData): Promise<AuthResult> => {
  try {
    if (!loginData.email || !loginData.password) {
      return { error: 'Email and password are required' };
    }
    const result = await apiClient.post('/auth/login', {
      email: loginData.email.toLowerCase(),
      password: loginData.password,
    });
    return { user: mapUser(result) };
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: 'Invalid credentials' };
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const profile = await apiClient.get('/profiles/me');
    return profile ? mapUser(profile) : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<{ error?: string }> => {
  try {
    await apiClient.post('/auth/logout', {});
    return {};
  } catch (error: any) {
    return { error: 'Sign out failed' };
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<{ error?: string }> => {
  try {
    await apiClient.post('/auth/forgot-password', { email });
    return {};
  } catch (error: any) {
    return { error: 'Failed to send reset email' };
  }
};

/**
 * Update password
 */
export const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
  try {
    await apiClient.put('/auth/password', { password: newPassword });
    return {};
  } catch (error: any) {
    return { error: 'Failed to update password' };
  }
};

/**
 * Check if user has required role
 */
export const hasRole = (user: User, requiredRole: 'admin' | 'customer'): boolean => {
  if (requiredRole === 'admin') return user.role === 'admin';
  return user.isActive;
};

function mapUser(data: any): User {
  return {
    id: data.id,
    email: data.email || '',
    fullName: data.full_name || data.fullName || '',
    role: data.role || 'customer',
    isActive: data.is_active ?? true,
    emailVerified: data.email_verified ?? false,
    createdAt: new Date(data.created_at || Date.now()),
    updatedAt: new Date(data.updated_at || Date.now()),
  };
}

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  signOut,
  requestPasswordReset,
  updatePassword,
  hasRole,
};
