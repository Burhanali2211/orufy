import { apiClient } from '@/lib/apiClient';
/**
 * Client-side authentication utilities
 * Uses Supabase Auth directly
 */

import { supabase } from './legacyDb';

// User interface (client-side)
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
  role?: 'customer' | 'seller';
}

// Login data interface
interface LoginData {
  email: string;
  password: string;
}

/**
 * Register a new user using Supabase Auth
 */
export const registerUser = async (userData: RegistrationData): Promise<AuthResult> => {
  try {
    if (!userData.email || !userData.password || !userData.fullName) {
      return { error: 'Email, password, and full name are required' };
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email.toLowerCase(),
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
          role: userData.role || 'customer',
        },
      },
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Failed to create user' };
    }

    const user: User = {
      id: authData.user.id,
      email: authData.user.email || '',
      fullName: userData.fullName,
      role: userData.role || 'customer',
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { user };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { error: 'Registration failed. Please try again.' };
  }
};

/**
 * Authenticate a user using Supabase Auth
 */
export const loginUser = async (loginData: LoginData): Promise<AuthResult> => {
  try {
    if (!loginData.email || !loginData.password) {
      return { error: 'Email and password are required' };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginData.email.toLowerCase(),
      password: loginData.password,
    });

    if (authError) {
      return { error: 'Invalid credentials' };
    }

    if (!authData.user) {
      return { error: 'Login failed' };
    }

    // Fetch profile data
    const { data: profile } = await apiClient.get('/profiles');

    const user: User = {
      id: authData.user.id,
      email: authData.user.email || '',
      fullName: profile?.full_name || authData.user.user_metadata?.full_name || '',
      role: profile?.role || 'customer',
      isActive: profile?.is_active ?? true,
      emailVerified: authData.user.email_confirmed_at ? true : false,
      createdAt: new Date(authData.user.created_at),
      updatedAt: profile?.updated_at ? new Date(profile.updated_at) : new Date(),
    };

    return { user };
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: 'Login failed. Please try again.' };
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return null;
    }

    const { data: profile } = await apiClient.get('/profiles');

    return {
      id: authUser.id,
      email: authUser.email || '',
      fullName: profile?.full_name || authUser.user_metadata?.full_name || '',
      role: profile?.role || 'customer',
      isActive: profile?.is_active ?? true,
      emailVerified: authUser.email_confirmed_at ? true : false,
      createdAt: new Date(authUser.created_at),
      updatedAt: profile?.updated_at ? new Date(profile.updated_at) : new Date(),
    };
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      return { error: error.message };
    }
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
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      return { error: error.message };
    }
    return {};
  } catch (error: any) {
    return { error: 'Failed to update password' };
  }
};

/**
 * Check if user has required role
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

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  signOut,
  requestPasswordReset,
  updatePassword,
  hasRole,
};
