import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import * as auth from '../lib/auth';

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
  const [loading, setLoading] = useState(true);
  const [isMobileAuthOpen, setIsMobileAuthOpen] = useState(false);
  const [mobileAuthMode, setMobileAuthMode] = useState<'login' | 'signup' | 'profile'>('login');

  const mapAuthUser = (data: auth.AuthResponse): User | null => {
    if (!data || !data.user) return null;
    const { user: authUser } = data;
    return {
      id: authUser.id,
      tenantId: authUser.tenantId,
      email: authUser.email,
      name: authUser.name,
      role: authUser.role,
      avatar: authUser.avatar,
      emailVerified: authUser.emailVerified,
      createdAt: authUser.createdAt,
    } as User;
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const data = await auth.getCurrentUser();
      setUser(mapAuthUser(data));
    } catch {
      // Silent — no session is the expected state for logged-out users
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const data = await auth.signIn(email, password);
    setUser(mapAuthUser(data));
  };

  const signUp = async (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> => {
    const name = (additionalData?.name as string) || 'User';
    const shopName = (additionalData?.shopName as string) || 'My Store';
    
    const data = await auth.signUp(email, password, name, shopName);
    setUser(mapAuthUser(data));
  };

  const signOut = async (): Promise<void> => {
    await auth.signOut();
    setUser(null);
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      await signIn(email, password);
      return null;
    } catch (error: unknown) {
      return error instanceof Error ? error.message : 'Login failed';
    }
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    try {
      await signUp((userData.email as string), (userData.password as string), {
        name: userData.name,
        shopName: userData.shopName || 'My Store'
      });
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await signOut();
  };

  const resetPassword = async (email: string): Promise<void> => {
    await auth.forgotPassword(email);
  };

  const updatePassword = async (newPassword: string, token?: string): Promise<void> => {
    if (token) {
      await auth.resetPassword(token, newPassword);
    }
  };

  const resendVerification = async (email?: string): Promise<void> => {
    console.warn('Resend verification not implemented');
  };

  const signInWithOAuth = async (provider: string): Promise<void> => {
    await auth.signInWithOAuth(provider);
  };

  const getSession = async (): Promise<{ session: boolean }> => {
    const data = await auth.getCurrentUser();
    return { session: !!data.user };
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const response = await auth.updateProfile(data);
      if (response.user) {
        setUser(mapAuthUser(response));
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

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    getSession,
    resetPassword,
    updatePassword,
    resendVerification,
    updateProfile,
    refreshUser,
    openMobileAuth,
    closeMobileAuth,
    isMobileAuthOpen,
    mobileAuthMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
