import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as auth from '@/lib/auth';

type Status = 'loading' | 'success' | 'error' | 'already_verified';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const verification = params.get('verify'); // Custom param for email verification

        if (verification && token) {
          // Handle email verification
          try {
            await auth.verifyEmail(token);
            setStatus('success');
            return;
          } catch (err: any) {
            setErrorMsg(err.message || 'Email verification failed.');
            setStatus('error');
            return;
          }
        }

        // Generic OAuth or link callback
        const sessionData = await auth.getCurrentUser();
        
        if (sessionData?.user) {
          await refreshUser();
          setEmail(sessionData.user.email || '');
          setStatus('already_verified');
          
          // Auto-redirect after 2 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
          return;
        }

        // If no user and no verification token, it's an error or expired session
        setStatus('error');
        setErrorMsg('No active session found. Please sign in again.');

      } catch (err: any) {
        setErrorMsg(err?.message || 'Something went wrong.');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Processing your request…</p>
          <p className="text-gray-400 text-sm mt-1">This only takes a moment.</p>
        </div>
      </div>
    );
  }

  // ── Success (Email Verified) ───────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-9 w-9 text-green-500" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Email verified!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your account is ready. You can now sign in to continue.
          </p>

          <Link
            to="/auth?mode=login"
            className="block w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors duration-150"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    );
  }

  // ── Already verified / signed in ─────────────────────────────────────────
  if (status === 'already_verified') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-9 w-9 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome!</h1>
          <p className="text-gray-500 text-sm mb-6">You're successfully signed in. Redirecting to dashboard…</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="block w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors duration-150"
          >
            Go to dashboard now
          </button>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle className="h-9 w-9 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Callback failed</h1>
        <p className="text-gray-500 text-sm mb-2">
          {errorMsg || 'The link may have expired or is invalid.'}
        </p>
        <Link
          to="/auth"
          className="block w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors duration-150 mb-3"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
