import React from 'react';
import { Mail, Lock, User, Eye, EyeOff, Phone, Calendar, AlertCircle, Crown } from 'lucide-react';

interface SignupFormProps {
  formData: any;
  errors: any;
  loading: boolean;
  step: number;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (s: boolean) => void;
  onInputChange: (field: string, value: string) => void;
  onModeSwitch: (mode: 'login') => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  formData,
  errors,
  loading,
  step,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  onInputChange,
  onModeSwitch,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {step === 1 && (
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full px-4 py-2 mb-3">
            <></>
            <span className="text-xs font-semibold text-purple-800">Premium Attar Collection</span>
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-sm text-gray-600 mb-4">Join our community of fragrance lovers</p>
        </div>
      )}

      {errors.general && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          {errors.general}
        </div>
      )}

      {step === 1 ? (
        <>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => onInputChange('password', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
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
            {errors.password && <p className="mt-1 text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => onInputChange('confirmPassword', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
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
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.confirmPassword}</p>}
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => onInputChange('fullName', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.fullName ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>
            {errors.fullName && <p className="mt-1 text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => onInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your phone number"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => onInputChange('dateOfBirth', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              />
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <><></>Processing...</> : (step === 1 ? 'Continue' : 'Create Account')}
      </button>

      {step === 1 && (
        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button type="button" onClick={() => onModeSwitch('login')} className="font-medium text-indigo-600 hover:text-indigo-500" disabled={loading}>Sign in</button>
        </div>
      )}
    </form>
  );
};
