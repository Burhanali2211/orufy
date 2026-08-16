import React from 'react';
import { Mail } from 'lucide-react';

interface VerifyViewProps {
  email: string;
  onBackToLogin: () => void;
}

export const VerifyView: React.FC<VerifyViewProps> = ({ email, onBackToLogin }) => {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Mail className="h-10 w-10 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Verification Email Sent</h3>
        <p className="text-gray-600 mt-2">
          We've sent a verification link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Didn't receive the email? Check your spam folder or{' '}
          <button className="text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap">
            resend verification email
          </button>
        </p>
      </div>
      <button
        onClick={onBackToLogin}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
      >
        Back to Login
      </button>
    </div>
  );
};
