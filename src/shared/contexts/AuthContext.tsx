import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Store, AuthContextType } from '../types';
import { apiClient } from '../lib/apiClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileAuthOpen, setIsMobileAuthOpen] = useState(false);
  const [mobileAuthMode, setMobileAuthMode] = useState<'login' | 'signup' | 'profile'>('login');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            apiClient.setToken(data.token);
          }
          setUser({
            ...data.user,
            id: data.user.id,
            email: data.user.email,
            name: data.user.full_name || 'User',
            fullName: data.user.full_name || 'User',
            role: data.user.role || 'customer',
            avatar: data.user.avatar_url || data.user.avatar,
            phone: data.user.phone,
            gender: data.user.gender,
            dateOfBirth: data.user.date_of_birth || data.user.dateOfBirth,
          });
          setStore(data.store || null);
          if (data.store?.hostname) {
            apiClient.setStoreHostname(data.store.hostname);
          }
        } else {
          setUser(null);
          setStore(null);
          apiClient.setStoreHostname(null);
          apiClient.setToken(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
        setStore(null);
        apiClient.setStoreHostname(null);
        apiClient.setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to sign in');
    }

    const loginData = await response.json();
    if (loginData.token) {
      apiClient.setToken(loginData.token);
    }

    // Refresh user state after login
    const meResponse = await fetch('/api/auth/me', { credentials: 'include' });
    if (meResponse.ok) {
      const data = await meResponse.json();
      if (data.token) {
        apiClient.setToken(data.token);
      }
      setUser({
        ...data.user,
        id: data.user.id,
        email: data.user.email,
        name: data.user.full_name || 'User',
        fullName: data.user.full_name || 'User',
        role: data.user.role || 'customer',
        avatar: data.user.avatar_url || data.user.avatar,
        phone: data.user.phone,
        gender: data.user.gender,
        dateOfBirth: data.user.date_of_birth || data.user.dateOfBirth,
      });
      setStore(data.store || null);
      if (data.store?.hostname) {
        apiClient.setStoreHostname(data.store.hostname);
      }
    }
  };

  const signUp = async (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> => {
    let fullName = additionalData?.fullName as string;
    if (!fullName) {
      const firstName = (additionalData?.firstName as string) || '';
      const lastName = (additionalData?.lastName as string) || '';
      fullName = `${firstName} ${lastName}`.trim() || 'User';
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        phone: additionalData?.phone,
        role: additionalData?.role
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to sign up');
    }

    const signupData = await response.json();
    if (signupData.token) {
      apiClient.setToken(signupData.token);
    }

    // Refresh user state after signup
    const meResponse = await fetch('/api/auth/me', { credentials: 'include' });
    if (meResponse.ok) {
      const data = await meResponse.json();
      if (data.token) {
        apiClient.setToken(data.token);
      }
      setUser({
        ...data.user,
        id: data.user.id,
        email: data.user.email,
        name: data.user.full_name || 'User',
        fullName: data.user.full_name || 'User',
        role: data.user.role || 'customer',
        avatar: data.user.avatar_url || data.user.avatar,
        phone: data.user.phone,
      });
      setStore(data.store || null);
      if (data.store?.hostname) {
        apiClient.setStoreHostname(data.store.hostname);
      }
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
      setStore(null);
      apiClient.setStoreHostname(null);
      apiClient.setToken(null);
      localStorage.removeItem('user_preferences');
      localStorage.removeItem('cart_items');
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      await signIn(email, password);
      return null;
    } catch (error: any) {
      return error.message;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    console.warn("Reset password requested for", email);
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      const res = await apiClient.put<any>('/auth/profile', {
        fullName: updates.fullName || updates.name,
        phone: updates.phone,
        avatar_url: updates.avatar,
        gender: updates.gender,
        date_of_birth: updates.dateOfBirth,
      });
      if (res?.user) {
        setUser((prev) => prev ? {
          ...prev,
          name: res.user.full_name || prev.name,
          fullName: res.user.full_name || prev.fullName,
          phone: res.user.phone ?? prev.phone,
          avatar: res.user.avatar_url ?? prev.avatar,
          gender: res.user.gender ?? prev.gender,
          dateOfBirth: res.user.date_of_birth ?? prev.dateOfBirth,
        } : null);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const openMobileAuth = (mode: 'login' | 'signup' | 'profile' = 'login') => {
    setMobileAuthMode(mode);
    setIsMobileAuthOpen(true);
  };

  const closeMobileAuth = () => {
    setIsMobileAuthOpen(false);
  };

  const value: any = {
    user,
    store,
    loading,
    signIn,
    signUp,
    signOut,
    login,
    resetPassword,
    updateProfile,
    isMobileAuthOpen,
    mobileAuthMode,
    openMobileAuth,
    closeMobileAuth,
    setMobileAuthMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
