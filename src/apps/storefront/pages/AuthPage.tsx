import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';

type AuthMode = 'otp' | 'login' | 'signup' | 'forgot';

// --- Zod Validation Schemas ---
const requestOtpSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});
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
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(300);
  const [isResending, setIsResending] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { signIn, signUp, resetPassword, resendVerification, requestOtp, verifyOtp, user, store } = useAuth();
  const { getSiteSetting } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const siteName = getSiteSetting('site_name') || 'Our Store';
  const logoUrl = getSiteSetting('logo_url');
  const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const baseDomain = import.meta.env.VITE_SITE_URL ? new URL(import.meta.env.VITE_SITE_URL).hostname.toLowerCase() : 'get-oru.com';
  const isPlatform = host === baseDomain || host === `www.${baseDomain}` || host === 'localhost' || host === '127.0.0.1';

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
      if (isPlatform && user.role === 'customer') {
        if (store?.hostname && store.hostname !== baseDomain && store.hostname !== `www.${baseDomain}`) {
          window.location.href = `https://${store.hostname}/dashboard`;
          return;
        }
      }
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect');
      if (redirectUrl && redirectUrl.startsWith('/')) {
        navigate(redirectUrl);
        return;
      }
      navigate(user.role === 'admin' || user.role === 'merchant' ? '/admin' : '/dashboard');
    }
  }, [user, isPlatform, store, baseDomain, navigate]);

  // Dynamic form configuration based on the current mode
  const currentSchema = mode === 'otp' ? (otpSent ? verifyOtpSchema : requestOtpSchema) : mode === 'login' ? loginSchema : mode === 'signup' ? signupSchema : forgotSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm<any>({
    resolver: zodResolver(currentSchema),
    mode: 'onTouched',
  });

  // Watch for OTP value changes and keep digits in sync (useful on reset)
  const currentOtpValue = watch('otp');
  useEffect(() => {
    if (!currentOtpValue) {
      setOtpDigits(Array(6).fill(''));
    }
  }, [currentOtpValue]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    setValue('otp', newDigits.join(''), { shouldValidate: true, shouldDirty: true });

    // Auto-advance
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedData.length; i++) {
        if (i < 6) newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      setValue('otp', newDigits.join(''), { shouldValidate: true, shouldDirty: true });
      const focusIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('mode') as AuthMode | null;

    if (isPlatform && p === 'signup') {
      navigate('/onboarding', { replace: true });
      return;
    }

    if (p === 'signup' && !isPlatform) setMode('signup');
    else if (p === 'forgot') setMode('forgot');
    else if (p === 'login') setMode('login');
    else setMode(isPlatform ? 'login' : 'otp'); // Default: password for platform, OTP for storefront

    const preEmail = params.get('email');
    if (preEmail) setValue('email', decodeURIComponent(preEmail));
  }, [location.search, isPlatform, navigate, setValue]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!otpSent) {
      setOtpCountdown(300);
      return;
    }
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, otpCountdown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleResendSignupConfirmation = async () => {
    if (!signupConfirmEmail || resendCooldown > 0) return;
    try {
      setIsResending(true);
      const res = await resendVerification(signupConfirmEmail);
      toast.success(res.message || 'Verification email resent! Please check your inbox.');
      setResendCooldown(60);
    } catch (err: unknown) {
      if (err.retryAfterSeconds) {
        setResendCooldown(err.retryAfterSeconds);
      }
      toast.error(err.message || 'Failed to resend confirmation email');
    } finally {
      setIsResending(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setForgotSent(false);
    setOtpSent(false);
    reset(); // Clear form state when switching modes
  };

  // --- React Query Mutations ---
  const authMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (mode === 'otp') {
        if (!otpSent) {
          await requestOtp(data.phone as string);
          return { isOtpRequest: true };
        } else {
          await verifyOtp(data.phone as string, data.otp as string);
          return { isOtpVerify: true };
        }
      } else if (mode === 'login') {
        return await signIn(data.email as string, data.password as string);
      } else if (mode === 'signup') {
        await signUp(data.email as string, data.password as string, { fullName: data.fullName as string });
        sendEmail({ type: 'welcome', email: data.email, name: data.fullName, siteName });
        return { isSignup: true, email: data.email };
      } else if (mode === 'forgot') {
        await resetPassword(data.email as string);
        sendEmail({ type: 'reset', email: data.email, siteName });
        return { isForgot: true };
      }
    },
    onSuccess: (result) => {
      if (result?.isOtpRequest) {
        setOtpSent(true);
        toast.success('OTP sent successfully!');
      } else if (result?.isSignup) {
        setSignupConfirmEmail(result.email as string);
      } else if (result?.isForgot) {
        setForgotSent(true);
      }
    }
  });

  const onSubmit = (data: Record<string, unknown>) => {
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
              {mode !== 'forgot' && (
                <div className="flex p-1 bg-stone-100 rounded-xl mb-7 border border-stone-200/60">
                  {!isPlatform ? (
                    <>
                      <button
                        type="button"
                        onClick={() => switchMode('otp')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'otp'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                          }`}
                      >
                        OTP
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'login'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                          }`}
                      >
                        Email Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode('signup')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'signup'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                          }`}
                      >
                        Email Sign Up
                      </button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}

              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                  {mode === 'otp' && (otpSent ? 'Enter OTP' : 'Sign in')}
                  {mode === 'login' && 'Sign in'}
                  {mode === 'signup' && 'Create your account'}
                  {mode === 'forgot' && 'Reset your password'}
                </h1>
                <p className="text-xs text-stone-500 mt-1.5 leading-normal">
                  {mode === 'otp' && (otpSent ? `We sent a 6-digit code to your phone.` : 'Sign in securely without a password.')}
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

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleResendSignupConfirmation}
                      disabled={isResending || resendCooldown > 0}
                      className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isResending ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {resendCooldown > 0
                          ? `Resend Email (${resendCooldown}s)`
                          : isResending
                          ? 'Resending Email...'
                          : 'Resend Verification Email'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSignupConfirmEmail(null); switchMode('login'); }}
                      className="w-full py-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      ← Back to sign in
                    </button>
                  </div>
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
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-100/80 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs text-amber-900 font-medium truncate">
                          {authMutation.error instanceof Error ? authMutation.error.message : 'An error occurred.'}
                        </span>
                      </div>
                      {((authMutation.error as any)?.data?.storeUrl || (authMutation.error as any)?.response?.data?.storeUrl) && (
                        <a
                          href={(authMutation.error as any)?.data?.storeUrl || (authMutation.error as any)?.response?.data?.storeUrl}
                          className="text-xs text-amber-700 hover:text-amber-900 font-bold transition-colors shrink-0 ml-3 underline decoration-amber-300 underline-offset-2"
                        >
                          Visit Store
                        </a>
                      )}
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

                  {/* Phone field (OTP only) */}
                  {mode === 'otp' && !otpSent && (
                    <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <div className={`relative flex items-center bg-stone-50/80 border ${errors.phone ? 'border-red-400 bg-red-50/20 ring-4 ring-red-100/50' : 'border-stone-200 focus-within:border-stone-900 focus-within:ring-4 focus-within:ring-stone-900/10 focus-within:bg-white'} rounded-xl transition-all duration-200 overflow-hidden`}>
                        <div className="flex items-center justify-center pl-4 pr-3 py-3.5 border-r border-stone-200/80 bg-stone-100/50">
                          <span className="text-xl mr-2 leading-none">🇮🇳</span>
                          <span className="text-stone-600 font-semibold text-sm">+91</span>
                        </div>
                        <input
                          type="tel"
                          {...register('phone')}
                          placeholder="9876 543 210"
                          disabled={isPending}
                          autoComplete="tel"
                          className="flex-1 w-full bg-transparent text-stone-950 font-semibold text-base px-4 py-3.5 outline-none placeholder:text-stone-300 placeholder:font-medium tracking-wide"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.phone.message as string}
                        </p>
                      )}
                    </div>
                  )}

                  {/* OTP field (OTP verify only) */}
                  {mode === 'otp' && otpSent && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100/80 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <p className="text-xs text-emerald-900 font-medium truncate">
                            Sent to <strong className="font-bold">+91 {watch('phone')}</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); reset(); }}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold transition-colors cursor-pointer shrink-0 ml-3"
                        >
                          Change
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                            Secure Verification Code
                          </label>
                          <span className="text-[10px] font-bold text-stone-400 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200">
                            Expires in {formatTime(otpCountdown)}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <input
                              key={index}
                              ref={(el) => (otpInputRefs.current[index] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={otpDigits[index]}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              disabled={isPending}
                              className={`w-[14%] aspect-square text-center text-xl font-bold rounded-xl outline-none transition-all duration-200 bg-stone-50/80 border shadow-xs focus:bg-white focus:-translate-y-0.5 ${errors.otp ? 'border-red-400 bg-red-50/20 text-red-700 focus:ring-4 focus:ring-red-100/60' : 'border-stone-200 text-stone-900 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10'}`}
                            />
                          ))}
                        </div>
                        
                        {/* Hidden input to hook into react-hook-form properly */}
                        <input type="hidden" {...register('otp')} />
                        
                        {errors.otp && (
                          <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.otp.message as string}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Email field */}
                  {mode !== 'otp' && (
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
                  )}

                  {/* Password field */}
                  {(mode === 'login' || mode === 'signup') && (
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
                        <span>{mode === 'otp' ? (otpSent ? 'Verifying...' : 'Sending OTP...') : mode === 'login' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending recovery email…'}</span>
                      ) : (
                        <span>{mode === 'otp' ? (otpSent ? 'Verify OTP' : 'Send OTP') : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Recovery Link'}</span>
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
