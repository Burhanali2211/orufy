import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Store, AuthContextType } from '../types';

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
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser({
            ...data.user,
            id: data.user.id,
            email: data.user.email,
            name: data.user.full_name || 'User',
            fullName: data.user.full_name || 'User',
            role: data.user.role || 'customer'
          });
          setStore(data.store || null);
        } else {
          setUser(null);
          setStore(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
        setStore(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to login');
    }

    // Refresh user state after login
    const meResponse = await fetch('/api/auth/me');
    if (meResponse.ok) {
      const data = await meResponse.json();
      setUser({
        ...data.user,
        id: data.user.id,
        email: data.user.email,
        name: data.user.full_name || 'User',
        fullName: data.user.full_name || 'User',
        role: data.user.role || 'customer'
      });
      setStore(data.store || null);
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role: additionalData?.role }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to sign up');
    }

    // Refresh user state after signup
    const meResponse = await fetch('/api/auth/me');
    if (meResponse.ok) {
      const data = await meResponse.json();
      setUser({
        ...data.user,
        id: data.user.id,
        email: data.user.email,
        name: data.user.full_name || 'User',
        fullName: data.user.full_name || 'User',
        role: data.user.role || 'customer'
      });
      setStore(data.store || null);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setStore(null);
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
    // Phase 4: Reset password needs backend implementation later.
    console.warn("Reset password not yet implemented on local backend");
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    // Phase 4: Update profile needs backend implementation.
    console.warn("Update profile not yet implemented on local backend");
  };

  const openMobileAuth = (mode: 'login' | 'signup' | 'profile' = 'login') => {
    setMobileAuthMode(mode);
    setIsMobileAuthOpen(true);
  };

  const closeMobileAuth = () => {
    setIsMobileAuthOpen(false);
  };

  const value: AuthContextType = {
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
