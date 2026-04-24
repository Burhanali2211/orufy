/**
 * Frontend Auth Library
 * Replaces Supabase Auth with custom Better Auth implementation
 */
import { User, Tenant } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface AuthResponse {
  user: User | null;
  tenant: Tenant | null;
  error?: string;
}

/**
 * Multi-tenant signup
 */
export const signUp = async (email: string, password: string, name: string, shopName: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, shopName }),
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Signup failed');
  return data;
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data;
};

/**
 * Sign out and clear session
 */
export const signOut = async (): Promise<void> => {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
};

/**
 * Get current authenticated user session
 */
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.status === 401) return { user: null, tenant: null };
    if (!response.ok) return { user: null, tenant: null };

    const ct = response.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) return { user: null, tenant: null };

    return await response.json();
  } catch {
    return { user: null, tenant: null };
  }
};

/**
 * Email verification
 */
export const verifyEmail = async (token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    credentials: 'include'
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Verification failed');
  }
};

/**
 * Forgot password request
 */
export const forgotPassword = async (email: string): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include'
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Forgot password request failed');
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, password: string): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
    credentials: 'include'
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Password reset failed');
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (data: Partial<User>): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/update-profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include'
  });

  const resData = await response.json();
  if (!response.ok) throw new Error(resData.error || 'Profile update failed');
  return resData;
};

/**
 * OAuth sign in
 */
export const signInWithOAuth = async (provider: string): Promise<void> => {
  const redirectTo = `${window.location.origin}/auth/callback`;
  window.location.href = `${API_URL}/auth/login/${provider}?redirectTo=${encodeURIComponent(redirectTo)}`;
};
