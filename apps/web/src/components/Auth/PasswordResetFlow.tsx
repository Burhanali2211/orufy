import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2,
  Eye, EyeOff, Shield, Clock, RefreshCw, X
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import * as authLib from '../../lib/auth';

interface PasswordResetFlowProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
}

type ResetStep = 'request' | 'verify' | 'reset' | 'success';

interface ResetData {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

export const PasswordResetFlow: React.FC<PasswordResetFlowProps> = ({
  isOpen,
  onClose,
  email: initialEmail = ''
}) => {
  const [step, setStep] = useState<ResetStep>('request');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const { showNotification } = useNotification();

  const [resetData, setResetData] = useState<ResetData>({
    email: initialEmail,
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setStep('request');
      setResetData({
        email: initialEmail,
        verificationCode: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
      setResendTimer(0);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');

    return { isValid: errors.length === 0, errors };
  };

  const handleRequestReset = async () => {
    if (!resetData.email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!validateEmail(resetData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await authLib.forgotPassword(resetData.email);

      showNotification({ type: 'success', title: 'Password reset link sent to your email!' });
      setStep('verify');
      setResendTimer(60);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset code';
      showNotification({ type: 'error', title: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetData.verificationCode) {
      setErrors({ verificationCode: 'Verification code is required' });
      return;
    }

    if (resetData.verificationCode.length !== 6) {
      setErrors({ verificationCode: 'Please enter the complete 6-digit code' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate code verification
      if (resetData.verificationCode === '123456') {
        setStep('reset');
      } else {
        setErrors({ verificationCode: 'Invalid verification code' });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify code';
      showNotification({ type: 'error', title: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!resetData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordValidation = validatePassword(resetData.newPassword);
      if (!passwordValidation.isValid) {
        newErrors.newPassword = passwordValidation.errors.join(', ');
      }
    }

    if (!resetData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (resetData.newPassword !== resetData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await authLib.resetPassword('', resetData.newPassword);

      setStep('success');
      showNotification({ type: 'success', title: 'Password reset successfully!' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      showNotification({ type: 'error', title: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      showNotification({ type: 'success', title: 'New verification code sent!' });
      setResendTimer(60);
    } catch {
      showNotification({ type: 'error', title: 'Failed to resend code' });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    const validation = validatePassword(password);
    const strength = Math.max(0, 5 - validation.errors.length);

    if (strength === 0) return { strength: 0, label: 'Very Weak', color: 'bg-red-500' };
    if (strength <= 2) return { strength: strength * 20, label: 'Weak', color: 'bg-orange-500' };
    if (strength <= 3) return { strength: strength * 20, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength: strength * 20, label: 'Good', color: 'bg-blue-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            {step !== 'request' && step !== 'success' && (
              <button
                onClick={() => {
                  if (step === 'verify') setStep('request');
                  else if (step === 'reset') setStep('verify');
                }}
                className="absolute top-4 left-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                {step === 'success' ? (
                  <CheckCircle className="h-8 w-8" />
                ) : step === 'verify' ? (
                  <Mail className="h-8 w-8" />
                ) : step === 'reset' ? (
                  <Lock className="h-8 w-8" />
                ) : (
                  <Shield className="h-8 w-8" />
                )}
              </div>
              <h2 className="text-2xl font-bold">
                {step === 'request' && 'Reset Password'}
                {step === 'verify' && 'Check Your Email'}
                {step === 'reset' && 'Create New Password'}
                {step === 'success' && 'Password Reset Complete'}
              </h2>
              <p className="text-indigo-100 mt-2">
                {step === 'request' && 'Enter your email to receive a reset code'}
                {step === 'verify' && 'Enter the 6-digit code we sent to your email'}
                {step === 'reset' && 'Choose a strong password for your account'}
                {step === 'success' && 'Your password has been successfully reset'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'request' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={resetData.email}
                      onChange={(e) => setResetData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Enter your email address"
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

                <button
                  onClick={handleRequestReset}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-gray-600">
                    We sent a 6-digit verification code to <strong>{resetData.email}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={resetData.verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setResetData(prev => ({ ...prev, verificationCode: value }));
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-center text-2xl font-mono tracking-widest ${errors.verificationCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                  />
                  {errors.verificationCode && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.verificationCode}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleVerifyCode}
                  disabled={loading || resetData.verificationCode.length !== 6}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                      onClick={handleResendCode}
                      disabled={resendTimer > 0 || loading}
                      className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendTimer > 0 ? (
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Resend in {resendTimer}s
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Resend Code
                        </span>
                      )}
                    </button>
                  </p>
                </div>
              </div>
            )}

            {step === 'reset' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={resetData.newPassword}
                      onChange={(e) => setResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.newPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Enter new password"
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
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.newPassword}
                    </p>
                  )}

                  {/* Password Strength Indicator */}
                  {resetData.newPassword && (
                    <div className="mt-2">
                      {(() => {
                        const strength = getPasswordStrength(resetData.newPassword);
                        return (
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Password Strength</span>
                              <span className={strength.strength >= 80 ? 'text-green-600' : strength.strength >= 60 ? 'text-blue-600' : 'text-orange-600'}>
                                {strength.label}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                                style={{ width: `${strength.strength}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={resetData.confirmPassword}
                      onChange={(e) => setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Confirm new password"
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

                <button
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Password Reset Complete!</h3>
                  <p className="text-gray-600 mt-2">
                    Your password has been successfully reset. You can now sign in with your new password.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Continue to Sign In
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};
