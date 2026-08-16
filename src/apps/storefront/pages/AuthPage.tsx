import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';

type AuthMode = 'login' | 'signup' | 'forgot';

// --- Zod Validation Schemas ---
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [signupConfirmEmail, setSignupConfirmEmail] = useState<string | null>(null);

  const { signIn, signUp, resetPassword, user } = useAuth();
  const { getSiteSetting } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const siteName = getSiteSetting('site_name') || 'Our Store';
  const logoUrl = getSiteSetting('logo_url');
  const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const baseDomain = import.meta.env.VITE_SITE_URL ? new URL(import.meta.env.VITE_SITE_URL).hostname : 'get-oru.com';
  const isPlatform = host === baseDomain || host === 'localhost' || host === '127.0.0.1';

  const sendEmail = (payload: object) => {
    if (!isProduction) return; // Netlify functions only available in production
    fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => { });
  };

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  // Dynamic form configuration based on the current mode
  const currentSchema = mode === 'login' ? loginSchema : mode === 'signup' ? signupSchema : forgotSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm({
    resolver: zodResolver(currentSchema),
    mode: 'onTouched',
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('mode') as AuthMode | null;

    if (isPlatform && p === 'signup') {
      navigate('/onboarding', { replace: true });
      return;
    }

    if (p === 'signup' && !isPlatform) setMode('signup');
    else if (p === 'forgot') setMode('forgot');
    else setMode('login'); // default

    const preEmail = params.get('email');
    if (preEmail) setValue('email', decodeURIComponent(preEmail));
  }, [location.search, isPlatform, navigate, setValue]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setForgotSent(false);
    reset(); // Clear form state when switching modes
  };

  // --- React Query Mutations ---
  const authMutation = useMutation({
    mutationFn: async (data: any) => {
      if (mode === 'login') {
        return await signIn(data.email.trim(), data.password);
      } else if (mode === 'signup') {
        await signUp(data.email.trim(), data.password, { fullName: data.fullName });
        sendEmail({ type: 'welcome', email: data.email, name: data.fullName, siteName });
        return { isSignup: true, email: data.email };
      } else if (mode === 'forgot') {
        await resetPassword(data.email.trim());
        sendEmail({ type: 'reset', email: data.email, siteName });
        return { isForgot: true };
      }
    },
    onSuccess: (result) => {
      if (result?.isSignup) {
        setSignupConfirmEmail(result.email);
      } else if (result?.isForgot) {
        setForgotSent(true);
      }
    }
  });

  const onSubmit = (data: any) => {
    authMutation.mutate(data);
  };

  const inputClass = (hasError: boolean) =>
    `w-full text-stone-950 text-sm font-medium rounded-xl pl-10 pr-4 py-3 bg-stone-50/80 border placeholder:text-stone-400 outline-none transition-all duration-150 focus:bg-white focus:ring-2 focus:ring-stone-900/10 ${hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100/60 bg-red-50/20'
      : 'border-stone-200 focus:border-stone-800'
    }`;

  const isPending = authMutation.isPending;

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col lg:flex-row text-stone-900 antialiased selection:bg-stone-200">

      {/* ── Left panel — brand presentation (desktop only) ────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-1/2 bg-[#141416] flex-col items-center justify-between p-12 lg:p-16 relative overflow-hidden text-white select-none">
        {/* subtle atmospheric noise / glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-stone-800/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-stone-800/30 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm flex items-center justify-start z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-10 w-10 object-contain rounded-xl ring-1 ring-white/10 shadow-sm"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-white text-stone-950 flex items-center justify-center font-black text-base shadow-sm">
                MB
              </div>
            )}
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-stone-200 transition-colors">
              {siteName}
            </span>
          </Link>
        </div>

        <div className="relative z-10 w-full max-w-sm my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-stone-800/90 text-stone-300 border border-stone-700/60 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Unified Commerce & Payments
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-[1.15] mb-4">
            {isPlatform
              ? 'Welcome back to your store cockpit.'
              : mode === 'signup'
                ? `Join ${siteName} today.`
                : `Welcome back to ${siteName}.`}
          </h2>
          <p className="text-stone-400 text-sm leading-relaxed mb-8">
            {isPlatform
              ? 'Sign in to access your business analytics, customer orders, instant payouts, and storefront customizations.'
              : mode === 'signup'
                ? 'Create an account to checkout faster, track your orders, and manage your wishlist.'
                : 'Sign in to access your order history, manage addresses, and checkout faster.'}
          </p>

          <div className="space-y-3.5 border-t border-stone-800/80 pt-6">
            {[
              { title: 'Bank-grade 256-bit AES encryption', desc: 'PCI-DSS Level 1 compliant secure vaulting' },
              { title: 'Real-time multi-channel sync', desc: 'Orders, inventory, and refunds synced instantly' },
              { title: 'Zero platform friction', desc: 'No lock-in contracts or hidden gateway markups' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-stone-800 text-stone-300 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0 border border-stone-700">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-200">{f.title}</p>
                  <p className="text-[11px] text-stone-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm text-xs text-stone-500 flex items-center justify-between z-10 border-t border-stone-800/60 pt-4">
          <span>&copy; {new Date().getFullYear()} {siteName}</span>
          <span className="inline-flex items-center gap-1.5 text-stone-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 hidden"></span>
            System Operational
          </span>
        </div>
      </div>

      {/* ── Right panel — interactive form surface ────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-[#faf9f6]">
        {/* Top header navigation */}
        <header className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-stone-200/70 bg-[#faf9f6]">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-8 w-8 object-contain rounded-lg shadow-2xs"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span className="font-bold text-stone-900 text-sm tracking-tight">{siteName}</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-full px-3.5 py-1.5 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </Link>
        </header>

        {/* Form viewport */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 lg:px-12">
          <div className="w-full max-w-md">

            {/* Main Auth Card */}
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-7 sm:p-9">

              {/* Segmented Mode Switcher (Pill Style) */}
              {mode !== 'forgot' && !isPlatform && (
                <div className="flex p-1 bg-stone-100 rounded-xl mb-7 border border-stone-200/60">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'login'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'signup'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                      }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                  {mode === 'login' && 'Sign in'}
                  {mode === 'signup' && 'Create your account'}
                  {mode === 'forgot' && 'Reset your password'}
                </h1>
                <p className="text-xs text-stone-500 mt-1.5 leading-normal">
                  {mode === 'login' && (isPlatform ? 'Enter your credentials to manage your store and orders.' : 'Sign in to your account to view your orders and profile.')}
                  {mode === 'signup' && 'Get started in under 2 minutes. No credit card required.'}
                  {mode === 'forgot' && 'Enter your verified account email to receive a recovery link.'}
                </p>
              </div>

              {/* ── Signup: email confirmation pending state ── */}
              {mode === 'signup' && signupConfirmEmail ? (
                <div className="space-y-5">
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2 font-bold text-sm">
                      ✓
                    </div>
                    <p className="text-stone-900 text-sm font-bold">Check your inbox</p>
                    <p className="text-stone-600 text-xs leading-relaxed">
                      We sent a confirmation link to <strong className="text-stone-900 font-semibold">{signupConfirmEmail}</strong>.
                      Click the link to verify your account, then sign in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSignupConfirmEmail(null); switchMode('login'); }}
                    className="w-full py-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </div>
              ) : mode === 'forgot' && forgotSent ? (
                <div className="space-y-5">
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2 font-bold text-sm">
                      ✓
                    </div>
                    <p className="text-stone-900 text-sm font-bold">Recovery link sent</p>
                    <p className="text-stone-600 text-xs leading-relaxed">
                      A password reset link was dispatched to <strong className="text-stone-900 font-semibold">{authMutation.variables?.email}</strong>.
                      Please check your spam folder if it doesn't arrive within 60 seconds.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

                  {/* Form-level error banner */}
                  {authMutation.isError && (
                    <div className="bg-red-50 border border-red-200/80 rounded-xl px-4 py-3 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <p className="text-red-800 font-medium">{authMutation.error instanceof Error ? authMutation.error.message : 'An error occurred during authentication.'}</p>
                      </div>
                    </div>
                  )}

                  {/* Full Name field (Signup only) */}
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                        <input
                          type="text"
                          {...register('fullName')}
                          placeholder="Full Name"
                          disabled={isPending}
                          autoComplete="name"
                          className={inputClass(!!errors.fullName)}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />{errors.fullName.message as string}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Email field */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        type="email"
                        {...register('email')}
                        placeholder="you@domain.com"
                        disabled={isPending}
                        autoComplete="email"
                        className={inputClass(!!errors.email)}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />{errors.email.message as string}
                      </p>
                    )}
                  </div>

                  {/* Password field */}
                  {mode !== 'forgot' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                          Password
                        </label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => switchMode('forgot')}
                            className="text-xs text-stone-500 hover:text-stone-900 transition-colors font-medium cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          placeholder="••••••••"
                          disabled={isPending}
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                          className={`${inputClass(!!errors.password)} pr-11`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />{errors.password.message as string}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Confirm Password field (Signup only) */}
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1.5 uppercase tracking-wider">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...register('confirmPassword')}
                          placeholder="••••••••"
                          disabled={isPending}
                          autoComplete="new-password"
                          className={`${inputClass(!!errors.confirmPassword)} pr-11`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(v => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />{errors.confirmPassword.message as string}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white text-sm font-bold rounded-xl py-3.5 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isPending ? (
                        <span>{mode === 'login' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending recovery email…'}</span>
                      ) : (
                        <span>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Recovery Link'}</span>
                      )}
                    </button>
                  </div>

                  {/* Mode switch for forgot mode */}
                  {mode === 'forgot' && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  )}

                  {/* Merchant onboarding link */}
                  {isPlatform && mode === 'login' && (
                    <div className="text-center pt-5 border-t border-stone-100 mt-4">
                      <p className="text-[11px] text-stone-500">
                        Don't have a store yet?{' '}
                        <Link to="/onboarding" className="text-stone-900 font-bold hover:underline">
                          Start onboarding →
                        </Link>
                      </p>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Legal Trust Footer */}
            <p className="text-center text-[11px] text-stone-400 mt-6 leading-relaxed">
              By proceeding, you agree to our{' '}
              <Link to="/terms-of-service" className="underline underline-offset-2 hover:text-stone-700 transition-colors">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy-policy" className="underline underline-offset-2 hover:text-stone-700 transition-colors">Privacy Policy</Link>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthPage;
