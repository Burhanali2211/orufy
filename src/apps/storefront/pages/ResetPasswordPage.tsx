import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/shared/lib/apiClient';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { useSettings } from '@/shared/contexts/SettingsContext';

type PageState = 'loading' | 'ready' | 'success' | 'invalid';

const ResetPasswordPage: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showNotification } = useNotification();
  const { getSiteSetting } = useSettings();
  const navigate = useNavigate();

  const siteName = getSiteSetting('site_name') || 'Our Store';

  useEffect(() => {
    // Check URL for a valid reset token (our backend sends ?token=... in the email link)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setPageState('ready');
    } else {
      const timer = setTimeout(() => {
        setPageState('invalid');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'At least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      await apiClient.post('/auth/reset-password', { token, password });
      setPageState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      showNotification({ type: 'error', title: 'Error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full text-stone-950 text-sm font-medium rounded-xl pl-10 pr-11 py-3 bg-stone-50/80 border placeholder:text-stone-400 outline-none transition-all duration-150 focus:bg-white focus:ring-2 focus:ring-stone-900/10 ${
      hasError
        ? 'border-red-400 focus:border-red-500 focus:ring-red-100/60 bg-red-50/20'
        : 'border-stone-200 focus:border-stone-800'
    }`;

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col text-stone-900 antialiased selection:bg-stone-200">

      {/* Header */}
      <header className="bg-[#faf9f6] border-b border-stone-200/70 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              MB
            </div>
            <span className="font-bold text-stone-900 text-sm tracking-tight">{siteName}</span>
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-full px-3.5 py-1.5 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 pt-12 pb-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-7 sm:p-8">

            {pageState === 'loading' && (
              <div className="text-center py-8">
                <></>
                <p className="text-stone-500 text-xs font-medium">Verifying your recovery security link…</p>
              </div>
            )}

            {pageState === 'invalid' && (
              <div className="text-center py-2 space-y-5">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-stone-900 tracking-tight mb-1">Link expired</h1>
                  <p className="text-stone-500 text-xs leading-relaxed">This recovery link is invalid or has already expired.</p>
                </div>
                <Link
                  to="/auth?mode=forgot"
                  className="block w-full bg-stone-900 text-white text-xs font-bold rounded-xl py-3.5 text-center hover:bg-stone-800 active:scale-[0.99] transition-all shadow-sm"
                >
                  Request a new recovery link
                </Link>
              </div>
            )}

            {pageState === 'success' && (
              <div className="text-center py-2 space-y-5">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-stone-900 tracking-tight mb-1">Password updated</h1>
                  <p className="text-stone-500 text-xs leading-relaxed">Your account credentials have been securely updated. You can now sign in.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="w-full bg-stone-900 text-white text-xs font-bold rounded-xl py-3.5 hover:bg-stone-800 active:scale-[0.99] transition-all shadow-sm cursor-pointer"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}

            {pageState === 'ready' && (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">Set new password</h1>
                  <p className="text-xs text-stone-500 mt-1">Choose a strong, unique password for your account</p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
                        placeholder="••••••••"
                        disabled={loading}
                        autoComplete="new-password"
                        className={inputClass(!!errors.password)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />{errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: '' })); }}
                        placeholder="••••••••"
                        disabled={loading}
                        autoComplete="new-password"
                        className={inputClass(!!errors.confirmPassword)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />{errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-400">Must be at least 8 characters.</p>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white text-xs font-bold rounded-xl py-3.5 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <></>
                          <span>Updating password…</span>
                        </>
                      ) : (
                        <span>Update Password</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
