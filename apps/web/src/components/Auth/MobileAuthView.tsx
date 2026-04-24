import React, { useState } from 'react';
import {
  X, Mail, Lock, User, Eye, EyeOff, ArrowLeft,
  Fingerprint, Shield, Star, Gift,
  Heart, ShoppingCart, Bell, Settings, LogOut,
  Sparkles, Crown, AlertCircle, Loader2, Phone, Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MobileAuthViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'verify' | 'profile';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
}

export const MobileAuthView: React.FC<MobileAuthViewProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [rememberMe, setRememberMe] = useState(false);

  const { user, signIn, signUp, logout } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    dateOfBirth: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // Simple validation for mobile - at least 8 characters
    return password.length >= 8;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (mode === 'signup' && step === 1) {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (mode === 'signup' && step === 2 && !formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(formData.email, formData.password);
        onClose();
      } else if (mode === 'signup') {
        if (step === 1) {
          setStep(2);
        } else {
          await signUp(formData.email, formData.password, {
            fullName: formData.fullName,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
          });
          setMode('verify');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'Authentication failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      />

      {/* Mobile auth panel */}
      <div
        className="absolute inset-0 bg-white flex flex-col"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            {(mode !== 'login' && mode !== 'profile') && (
              <button
                onClick={() => {
                  if (mode === 'signup' && step === 2) {
                    setStep(1);
                  } else {
                    setMode('login');
                  }
                }}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-20"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            )}

            <div className="flex-1 text-center">
              <h2 className="text-xl font-bold">
                {mode === 'login' && 'Welcome to Aligarh Attar House'}
                {mode === 'signup' && (step === 1 ? 'Create Account' : 'Complete Profile')}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'verify' && 'Verify Email'}
                {mode === 'profile' && 'My Account'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'verify' ? (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Verification Email Sent</h3>
                <p className="text-gray-600 mt-2">
                  We've sent a verification link to <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                    resend verification email
                  </button>
                </p>
              </div>
              <button
                onClick={() => setMode('login')}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Back to Login
              </button>
            </div>
          ) : mode === 'profile' && user ? (
            <div className="space-y-6">
              {/* User Profile Header */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{(user.name ?? user.email ?? '?').charAt(0)}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <p className="text-gray-600">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full capitalize">
                  {user.role}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-4">
                <button className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Heart className="h-6 w-6 text-red-500 mb-2" />
                  <span className="text-xs text-gray-700">Wishlist</span>
                </button>
                <button className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <ShoppingCart className="h-6 w-6 text-green-500 mb-2" />
                  <span className="text-xs text-gray-700">Cart</span>
                </button>
                <button className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Bell className="h-6 w-6 text-blue-500 mb-2" />
                  <span className="text-xs text-gray-700">Notifications</span>
                </button>
              </div>

              {/* Account Options */}
              <div className="space-y-3">
                <button className="w-full flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Settings className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Account Settings</span>
                </button>
                <button className="w-full flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Gift className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">My Orders</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-red-600"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Branding Section */}
              {(mode === 'login' || (mode === 'signup' && step === 1)) && (
                <div className="text-center mb-2">
                  <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full px-4 py-2 mb-3">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-800">Premium Attar Collection</span>
                    <Crown className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {mode === 'login'
                      ? 'Sign in to discover premium attars'
                      : 'Join our community of fragrance lovers'}
                  </p>
                </div>
              )}

              {/* General Error Message */}
              {errors.general && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {errors.general}
                </div>
              )}

              {/* Email Field */}
              {(mode === 'login' || mode === 'forgot' || (mode === 'signup' && step === 1)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              )}

              {/* Password Field */}
              {(mode === 'login' || mode === 'forgot' || (mode === 'signup' && step === 1)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>
              )}

              {/* Confirm Password Field (Signup Step 1) */}
              {mode === 'signup' && step === 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Confirm your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {/* Full Name Field (Signup Step 2) */}
              {mode === 'signup' && step === 2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.fullName ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.fullName}
                    </p>
                  )}
                </div>
              )}

              {/* Phone Field (Signup Step 2) */}
              {mode === 'signup' && step === 2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your phone number"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Date of Birth Field (Signup Step 2) */}
              {mode === 'signup' && step === 2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Remember Me (Login) */}
              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me-mobile"
                      name="remember-me-mobile"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      disabled={loading}
                    />
                    <label htmlFor="remember-me-mobile" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    disabled={loading}
                  >
                    Forgot?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : mode === 'login' ? (
                    'Sign In'
                  ) : mode === 'signup' && step === 1 ? (
                    'Continue'
                  ) : mode === 'signup' && step === 2 ? (
                    'Create Account'
                  ) : mode === 'forgot' ? (
                    'Send Reset Link'
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="text-center text-sm text-gray-600">
                {mode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                      disabled={loading}
                    >
                      Sign up
                    </button>
                  </p>
                ) : mode === 'signup' ? (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                      disabled={loading}
                    >
                      Sign in
                    </button>
                  </p>
                ) : mode === 'forgot' ? (
                  <p>
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                      disabled={loading}
                    >
                      Sign in
                    </button>
                  </p>
                ) : null}
              </div>

              {/* Trust Indicators */}
              {(mode === 'login' || (mode === 'signup' && step === 1)) && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-1 text-green-500" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center">
                      <Fingerprint className="h-4 w-4 mr-1 text-blue-500" />
                      <span>Private</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-purple-500" />
                      <span>Trusted</span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
