import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw, Mail, ArrowRight, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useSettings } from '@/shared/contexts/SettingsContext';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, resendVerification } = useAuth();
  const { getSiteSetting, settings } = useSettings();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>(token ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(user?.email || '');
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const siteName = getSiteSetting('site_name') || (settings as any)?.site_name || 'Store';
  const logoUrl = getSiteSetting('logo_url') || (settings as any)?.site_logo;

  // Cooldown countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Execute verification when token exists
  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        setStatus('loading');
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.error || 'Failed to verify email address');
        }

        setStatus('success');
        toast.success('Email verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'This verification link is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = resendEmail.trim();

    if (!targetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    if (cooldown > 0) return;

    try {
      setIsResending(true);
      const res = await resendVerification(targetEmail);
      toast.success(res.message || 'Verification link sent to your inbox!');
      setCooldown(60);
    } catch (err: any) {
      if (err.retryAfterSeconds) {
        setCooldown(err.retryAfterSeconds);
      }
      toast.error(err.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between text-stone-900">
      {/* ── Minimal Header ── */}
      <header className="bg-white border-b border-stone-200 py-4 px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain rounded" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white font-bold flex items-center justify-center text-xs">
              {siteName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-extrabold text-sm tracking-tight text-stone-900 font-serif">
            {siteName}
          </span>
        </Link>

        <Link
          to="/"
          className="text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors inline-flex items-center gap-1"
        >
          <span>Return to Store</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* ── Main Body Card ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm max-w-md w-full p-8 sm:p-10 text-center space-y-6">
          {/* State 1: Verifying */}
          {status === 'loading' && (
            <div className="space-y-4 py-4">
              <div className="w-12 h-12 border-3 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h1 className="text-xl font-bold text-stone-900 font-serif">Verifying your email</h1>
                <p className="text-xs text-stone-500 mt-1">Please wait a moment while we confirm your account security...</p>
              </div>
            </div>
          )}

          {/* State 2: Verified Success */}
          {status === 'success' && (
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-stone-900 font-serif">Email Verified!</h1>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Your email address has been successfully verified. You now have full access to your account, orders, and saved preferences.
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                <Link
                  to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/auth'}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                >
                  <span>{user ? 'Go to Account Dashboard' : 'Sign In to Your Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>
          )}

          {/* State 3: Expired / Error / Idle */}
          {(status === 'error' || status === 'idle') && (
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-stone-900 font-serif">
                  {status === 'error' ? 'Verification Link Expired' : 'Confirm Your Email'}
                </h1>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  {errorMessage || 'Enter your email address below to receive a new account verification link.'}
                </p>
              </div>

              <form onSubmit={handleResend} className="space-y-3 pt-1 text-left">
                <div>
                  <label htmlFor="resend-email-input" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      id="resend-email-input"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isResending || cooldown > 0}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  {isResending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  <span>
                    {cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : isResending
                      ? 'Sending Email...'
                      : 'Resend Verification Email'}
                  </span>
                </button>
              </form>

              <div className="pt-2 border-t border-stone-100">
                <Link
                  to="/auth"
                  className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
                >
                  &larr; Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-stone-200 py-4 px-6 text-center text-xs text-stone-400">
        &copy; {new Date().getFullYear()} {siteName}. Secure Account Confirmation Portal.
      </footer>
    </div>
  );
};

export default VerifyEmailPage;
