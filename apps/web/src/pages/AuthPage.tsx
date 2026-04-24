import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

type AuthMode = 'login' | 'signup' | 'forgot';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

// Parse auth errors into user-friendly field-level messages
function parseAuthError(err: unknown, mode: AuthMode): {
  field?: 'email' | 'password' | 'form';
  message: string;
  suggestSignup?: boolean;
} {
  const raw = (err instanceof Error ? err.message : String(err)).toLowerCase();

  if (mode === 'login') {
    if (
      raw.includes('invalid login credentials') ||
      raw.includes('invalid_credentials') ||
      raw.includes('wrong password') ||
      raw.includes('incorrect password') ||
      raw.includes('unauthorized')
    ) {
      return {
        field: 'form',
        message: 'Incorrect email or password.',
        suggestSignup: false,
      };
    }
    if (
      raw.includes('user not found') ||
      raw.includes('no user found') ||
      raw.includes('email not found')
    ) {
      return {
        field: 'email',
        message: "We couldn't find an account with this email.",
        suggestSignup: true,
      };
    }
    if (raw.includes('email not confirmed') || raw.includes('not confirmed') || raw.includes('verify your email')) {
      return {
        field: 'email',
        message: 'Please verify your email before signing in.',
      };
    }
    if (raw.includes('too many requests') || raw.includes('rate limit')) {
      return { field: 'form', message: 'Too many attempts. Please wait a moment and try again.' };
    }
  }

  if (mode === 'signup') {
    if (raw.includes('already registered') || raw.includes('already exists') || raw.includes('user already registered')) {
      return { field: 'email', message: 'An account with this email already exists. Sign in instead?' };
    }
    if (raw.includes('password') && (raw.includes('weak') || raw.includes('short') || raw.includes('length'))) {
      return { field: 'password', message: 'Password is too weak. Use at least 8 characters.' };
    }
  }

  if (mode === 'forgot') {
    if (raw.includes('user not found') || raw.includes('no user')) {
      return { field: 'email', message: "We couldn't find an account with this email." };
    }
  }

  return { field: 'form', message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' };
}

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  // Set to the email address after a successful signUp that requires email confirmation.
  const [signupConfirmEmail, setSignupConfirmEmail] = useState<string | null>(null);

  const { signIn, signUp, resetPassword, user } = useAuth();
  const { getSiteSetting } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const siteName = getSiteSetting('site_name') || 'Orufy';
  const logoUrl = getSiteSetting('logo_url');
  const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

  const sendEmail = (payload: object) => {
    // Backend now handles emails automatically via Resend on the API side
    console.log('Client-side sendEmail skipped - backend handles this now');
  };

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<{ message: string; suggestSignup?: boolean } | null>(null);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('mode');
    if (p === 'signup') setMode('signup');
    else if (p === 'forgot') setMode('forgot');
    const preEmail = params.get('email');
    if (preEmail) setFormData(prev => ({ ...prev, email: decodeURIComponent(preEmail) }));
  }, [location.search]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (formError) setFormError(null);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!formData.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email address';

    if (mode !== 'forgot') {
      if (!formData.password) e.password = 'Password is required';
      else if (formData.password.length < 8) e.password = 'Password must be at least 8 characters';
    }

    if (mode === 'signup') {
      if (!formData.fullName.trim()) e.fullName = 'Full name is required';
      if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(formData.email.trim(), formData.password);
        // navigation handled by useEffect above

      } else if (mode === 'signup') {
        await signUp(formData.email, formData.password, { fullName: formData.fullName });
        
        // Show the "check your email" screen
        setSignupConfirmEmail(formData.email);

      } else if (mode === 'forgot') {
        await resetPassword(formData.email.trim());
        setForgotSent(true);
      }
    } catch (err: unknown) {
      const parsed = parseAuthError(err, mode);
      if (parsed.field === 'email') {
        setErrors(prev => ({ ...prev, email: parsed.message }));
        if (parsed.suggestSignup) setFormError({ message: parsed.message, suggestSignup: true });
      } else if (parsed.field === 'password') {
        setErrors(prev => ({ ...prev, password: parsed.message }));
      } else {
        setFormError({ message: parsed.message, suggestSignup: parsed.suggestSignup });
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
    setFormError(null);
    setForgotSent(false);
    setFormData({ email: formData.email, password: '', confirmPassword: '', fullName: '' });
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-white border text-gray-900 text-sm rounded-xl pl-10 pr-4 py-3.5 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-offset-0 ${
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
        : 'border-gray-200 focus:border-gray-400 focus:ring-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">

      {/* ── Left panel — brand (desktop only) ────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-gray-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
        <div className="relative z-10 text-center max-w-xs">
          <Link to="/" className="inline-flex items-center gap-3 mb-10">
            {logoUrl && <img src={logoUrl} alt={siteName} className="h-12 w-12 object-contain rounded-xl"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            <span className="text-2xl font-bold text-white">{siteName}</span>
          </Link>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            {mode === 'signup' ? 'Join our community' : 'Welcome back'}
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            {mode === 'signup'
              ? 'Create your account and enjoy exclusive deals, order tracking, and a seamless shopping experience.'
              : 'Sign in to access your orders, wishlist, and personalised recommendations.'}
          </p>
          <div className="mt-10 flex flex-col gap-3 text-left">
            {['Free & fast delivery on ₹2000+', 'Track your orders in real time', 'Exclusive member-only deals'].map(f => (
              <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Top bar (mobile + desktop) */}
        <header className="flex items-center justify-between px-5 py-3 lg:px-8 lg:py-4 border-b border-gray-100 bg-white lg:bg-transparent">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            {logoUrl && <img src={logoUrl} alt={siteName} className="h-8 w-8 object-contain rounded-lg"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            <span className="font-semibold text-gray-900 text-[15px]">{siteName}</span>
          </Link>
          <Link to="/" className="hidden lg:inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to store
          </Link>
          <Link
            to="/"
            className="lg:hidden inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
        </header>

        {/* Form area — centered */}
        <main className="flex-1 flex items-center justify-center px-5 py-10 lg:px-12">
        <div className="w-full max-w-sm lg:max-w-md">

          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-7 lg:px-8 lg:py-8">

            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {mode === 'login' && 'Sign in to your account'}
                {mode === 'signup' && 'Create an account'}
                {mode === 'forgot' && 'Reset your password'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'login' && 'Welcome back'}
                {mode === 'signup' && 'Fill in your details to get started'}
                {mode === 'forgot' && "Enter your email and we'll send a reset link"}
              </p>
            </div>

            {/* ── Signup: email confirmation pending ── */}
            {mode === 'signup' && signupConfirmEmail ? (
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm font-medium mb-0.5">Check your inbox</p>
                  <p className="text-blue-700 text-sm">
                    We sent a confirmation link to <strong>{signupConfirmEmail}</strong>.
                    Click it to activate your account, then sign in.
                  </p>
                </div>
                <button
                  onClick={() => { setSignupConfirmEmail(null); switchMode('login'); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-800 transition-colors text-center"
                >
                  ← Back to sign in
                </button>
              </div>
            ) : mode === 'forgot' && forgotSent ? (
              <div className="space-y-5">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-800 text-sm font-medium mb-0.5">Check your inbox</p>
                  <p className="text-green-700 text-sm">
                    A reset link was sent to <strong>{formData.email}</strong>. Check your spam folder too.
                  </p>
                </div>
                <button
                  onClick={() => switchMode('login')}
                  className="w-full text-sm text-gray-500 hover:text-gray-800 transition-colors text-center"
                >
                  ← Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">

                {/* Form-level error banner */}
                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="text-red-700">{formError.message}</p>
                      {formError.suggestSignup && (
                        <button
                          type="button"
                          onClick={() => switchMode('signup')}
                          className="mt-1 text-red-700 font-semibold underline underline-offset-2 hover:text-red-900"
                        >
                          Create an account instead →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Full Name */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={e => handleChange('fullName', e.target.value)}
                        placeholder="Your full name"
                        disabled={loading}
                        autoComplete="name"
                        className={inputClass(!!errors.fullName)}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />{errors.fullName}
                      </p>
                    )}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      placeholder="you@example.com"
                      disabled={loading}
                      autoComplete="email"
                      className={inputClass(!!errors.email)}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />{errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={e => handleChange('password', e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className={`${inputClass(!!errors.password)} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />{errors.password}
                      </p>
                    )}
                  </div>
                )}

                {/* Confirm Password */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={e => handleChange('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        autoComplete="new-password"
                        className={`${inputClass(!!errors.confirmPassword)} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />{errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 hover:bg-gray-800 active:bg-black text-white text-sm font-semibold rounded-xl py-3.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {mode === 'login' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending link…'}
                      </>
                    ) : (
                      mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'
                    )}
                  </button>
                </div>

                {/* Mode switch */}
                <div className="text-center pt-1">
                  {mode === 'login' && (
                    <p className="text-sm text-gray-500">
                      Don't have an account?{' '}
                      <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-gray-900 hover:underline">
                        Sign up
                      </button>
                    </p>
                  )}
                  {mode === 'signup' && (
                    <p className="text-sm text-gray-500">
                      Already have an account?{' '}
                      <button type="button" onClick={() => switchMode('login')} className="font-semibold text-gray-900 hover:underline">
                        Sign in
                      </button>
                    </p>
                  )}
                  {mode === 'forgot' && (
                    <button type="button" onClick={() => switchMode('login')} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                      ← Back to sign in
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Footer links */}
          <p className="text-center text-xs text-gray-400 mt-5">
            By continuing, you agree to our{' '}
            <Link to="/terms-of-service" className="underline hover:text-gray-600 transition-colors">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="underline hover:text-gray-600 transition-colors">Privacy Policy</Link>
          </p>
        </div>
        </main>
      </div>
    </div>
  );
};

export default AuthPage;
