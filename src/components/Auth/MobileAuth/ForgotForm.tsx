import React from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface ForgotFormProps {
  formData: any;
  errors: any;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
  onInputChange: (field: string, value: string) => void;
  onModeSwitch: (mode: 'login') => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ForgotForm: React.FC<ForgotFormProps> = ({
  formData,
  errors,
  loading,
  showPassword,
  setShowPassword,
  onInputChange,
  onModeSwitch,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
        <p className="text-sm text-gray-500 mt-1">Enter your email and new password to reset</p>
      </div>

      {errors.general && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          {errors.general}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
            placeholder="Enter your email"
            disabled={loading}
          />
        </div>
        {errors.email && <p className="mt-1 text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => onInputChange('password', e.target.value)}
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
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
        {errors.password && <p className="mt-1 text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.password}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <><></>Processing...</> : 'Send Reset Link'}
      </button>

      <div className="text-center text-sm text-gray-600">
        Remember your password?{' '}
        <button type="button" onClick={() => onModeSwitch('login')} className="font-medium text-indigo-600 hover:text-indigo-500" disabled={loading}>Sign in</button>
      </div>
    </form>
  );
};
