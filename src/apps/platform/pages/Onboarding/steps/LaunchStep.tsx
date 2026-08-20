import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Rocket, Globe, CreditCard, Store, ExternalLink, ArrowRight, ArrowLeft, Copy, CheckCircle2, ShieldCheck, Mail, User, Lock, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/shared/lib/apiClient';

export const LaunchStep: React.FC = () => {
  const { data, prevStep } = useOnboarding();
  const { user, signUp, login, setStore, refreshSession } = useAuth();
  const navigate = useNavigate();

  const [launchStatus, setLaunchStatus] = useState<'ready' | 'claim' | 'launching' | 'live'>(
    user ? 'ready' : 'claim' // Default to claim if no user
  );
  const [activeDeployStep, setActiveDeployStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [finalStoreUrl, setFinalStoreUrl] = useState('');

  // Auth state for the final step
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(data.business.contactEmail || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(false);

  const storeName = data.business.name.trim() || 'My Store';
  const displayDomain = (() => {
    if (data.domain.type === 'custom' && data.domain.customHostname) {
      return data.domain.customHostname;
    }
    const sub = data.domain.subdomain || data.business.subdomain || 'my-store';
    const siteHostname = import.meta.env.VITE_SITE_URL 
      ? new URL(import.meta.env.VITE_SITE_URL).hostname 
      : (typeof window !== 'undefined' ? window.location.host : 'get-oru.com');
    return `${sub}.${siteHostname.replace(/^www\./, '')}`;
  })();

  const deployStages = [
    'Provisioning isolated store database',
    'Configuring brand story & theme styling',
    'Setting up payment gateways & webhooks',
    'Enabling SSL certificate & edge CDN routing',
  ];

  const handleLaunch = async (isAlreadyLaunching = false) => {
    if (!isAlreadyLaunching) {
      setLaunchStatus('launching');
    }
    setActiveDeployStep(0);

    const interval = setInterval(() => {
      setActiveDeployStep((prev) => {
        if (prev < deployStages.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      const chosenSubdomain = (data.domain.subdomain || data.business.subdomain || '').trim();
      const payload = {
        business: {
          name: data.business.name.trim(),
          category: data.business.category,
          subdomain: chosenSubdomain,
          contactEmail: data.business.contactEmail || user?.email || email || '',
        },
        domain: data.domain,
        brand: data.brand,
        initialProducts: data.initialProducts,
      };

      if (isAlreadyLaunching) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const authorizedRes = await fetch('/api/platform/onboarding', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await authorizedRes.json();
      clearInterval(interval);

      if (authorizedRes.ok && (result.success || result.store_id || result.storeId)) {
        const finalHostname = result.hostname || displayDomain;
        setFinalStoreUrl(`https://${finalHostname}`);
        
        // Ensure the API client and AuthContext know the store we just created
        apiClient.setStoreHostname(finalHostname);
        setStore({
          id: result.store_id || result.storeId,
          name: result.name || storeName,
          hostname: finalHostname,
          slug: result.slug || chosenSubdomain,
          is_active: true,
        });

        await refreshSession().catch(() => {});
        try {
          localStorage.removeItem('agy_merchant_onboarding_draft');
          localStorage.removeItem('agy_merchant_onboarding_step');
        } catch (_) {}

        setLaunchStatus('live');
      } else {
        clearInterval(interval);
        const errMsg = result.error || 'Failed to provision store. Please try again.';
        setAuthError(errMsg);
        setLaunchStatus(user ? 'ready' : 'claim');
      }
    } catch (err: any) {
      clearInterval(interval);
      setAuthError(err.message || 'An error occurred during launch.');
      setLaunchStatus(user ? 'ready' : 'claim');
    }
  };

  const handleCopyUrl = () => {
    if (finalStoreUrl) {
      navigator.clipboard.writeText(finalStoreUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    if (!isLoginMode && (!firstName || !lastName || !phone)) {
      setAuthError('Please fill in your name and phone number.');
      return;
    }

    setIsAuthLoading(true);
    setAuthError('');
    try {
      if (isLoginMode) {
        await login(email.trim(), password);
      } else {
        await signUp(email.trim(), password, {
          fullName: `${firstName} ${lastName}`.trim(),
          role: 'admin',
          phone: phone.trim()
        });
      }
      await handleLaunch(true);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate. Please check your details.');
      setIsAuthLoading(false);
      setLaunchStatus('claim');
    }
  };

  return (
    <AnimatePresence mode="wait">
      {/* -------------------------------------------------------------
        * STATE 1: CLAIM YOUR STORE (ACCOUNT CREATION OR LOGIN)
        * ------------------------------------------------------------- */}
      {launchStatus === 'claim' && (
        <motion.div
          key="claim"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg mx-auto text-left"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-stone-100 rounded-2xl mb-5">
              <ShieldCheck className="w-6 h-6 text-stone-900" />
            </div>
            <h1 className="text-[36px] sm:text-[40px] font-extrabold text-stone-900 tracking-tight leading-none mb-3">
              {isLoginMode ? 'Sign in to publish' : 'Secure your store'}
            </h1>
            <p className="text-base sm:text-lg text-stone-500 font-medium leading-relaxed">
              {isLoginMode ? (
                <>Sign in to your account to finalize <strong className="text-stone-900">{storeName}</strong>.</>
              ) : (
                <>Create your merchant account to finalize <strong className="text-stone-900">{storeName}</strong>.</>
              )}
            </p>
          </div>

          <form onSubmit={handleCreateAccount} className="space-y-5">
            {!isLoginMode && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wide">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-stone-400" />
                    </div>
                    <input
                      type="text"
                      required={!isLoginMode}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-3 py-3.5 text-sm text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all placeholder:text-stone-400 font-medium"
                      placeholder="Jane"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-900 uppercase tracking-wide">Last Name</label>
                  <input
                    type="text"
                    required={!isLoginMode}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-3.5 text-sm text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all placeholder:text-stone-400 font-medium"
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-stone-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 text-sm text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all placeholder:text-stone-400 font-medium"
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            {!isLoginMode && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wide">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-stone-400" />
                  </div>
                  <input
                    type="tel"
                    required={!isLoginMode}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 text-sm text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all placeholder:text-stone-400 font-medium"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 uppercase tracking-wide">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-stone-400" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 text-sm text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all placeholder:text-stone-400 font-medium"
                  placeholder="••••••••"
                />
              </div>
              {!isLoginMode && (
                <p className="text-[11px] text-stone-500 font-medium pt-0.5">Must be at least 6 characters long.</p>
              )}
            </div>

            {authError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1 shrink-0" />
                <div className="flex-1">
                  <span>{authError}</span>
                  {authError.toLowerCase().includes('already exists') && !isLoginMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginMode(true);
                        setAuthError('');
                      }}
                      className="block mt-1.5 text-xs font-bold text-stone-900 underline hover:text-black cursor-pointer"
                    >
                      Click here to sign in with your password →
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.98] cursor-pointer shadow-sm"
              >
                {isAuthLoading ? (
                  <span className="flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isLoginMode ? 'Signing In...' : 'Creating Account...'}
                  </span>
                ) : (
                  <>
                    <span>{isLoginMode ? 'Sign In & Launch Store' : 'Create Account & Publish Store'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setAuthError('');
                  }}
                  className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  {isLoginMode ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          </form>

          {/* Back Action to Step 7 */}
          <div className="flex items-center justify-start pt-6 border-t border-stone-200/60 mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-900 rounded-full font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Web Address</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* -------------------------------------------------------------
        * STATE 2: READY TO LAUNCH (Logged in user)
        * ------------------------------------------------------------- */}
      {launchStatus === 'ready' && (
        <motion.div
          key="ready"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl mx-auto text-left"
        >
          <div className="mb-10">
            <h1 className="text-[40px] sm:text-[48px] font-extrabold text-stone-900 tracking-tight leading-none mb-3">
              Ready to publish.
            </h1>
            <p className="text-lg text-stone-500 font-medium leading-relaxed">
              Review your details before we deploy <strong className="text-stone-900">{storeName}</strong> to the world.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200/60">
              <Store className="w-5 h-5 text-stone-400 mb-3" />
              <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Store Name</span>
              <p className="text-base font-bold text-stone-900 truncate">{storeName}</p>
            </div>
            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200/60">
              <Globe className="w-5 h-5 text-stone-400 mb-3" />
              <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Domain</span>
              <p className="text-base font-bold text-stone-900 truncate">{displayDomain}</p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-stone-200/60">
            <button
              type="button"
              onClick={prevStep}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-900 rounded-full font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Web Address</span>
            </button>

            <button
              type="button"
              onClick={() => handleLaunch(false)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-bold text-sm transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch Storefront Now</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* -------------------------------------------------------------
        * STATE 3: LAUNCHING IN PROGRESS
        * ------------------------------------------------------------- */}
      {launchStatus === 'launching' && (
        <motion.div
          key="launching"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto"
        >
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center relative shadow-sm">
              <div className="absolute inset-0 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
              <Rocket className="w-8 h-8 text-stone-900" />
            </div>
          </div>

          <h2 className="text-[32px] font-bold text-stone-900 tracking-tight text-center mb-10 leading-none">
            Publishing...
          </h2>

          <div className="space-y-6">
            {deployStages.map((stage, idx) => {
              const isCompleted = idx < activeDeployStep;
              const isCurrent = idx === activeDeployStep;
              return (
                <div key={idx} className="flex items-center gap-4">
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-900 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-stone-100 flex-shrink-0" />
                  )}
                  <span className={`text-base font-medium ${isCompleted ? 'text-stone-900' : isCurrent ? 'text-stone-900' : 'text-stone-400'}`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* -------------------------------------------------------------
        * STATE 4: LIVE CELEBRATION
        * ------------------------------------------------------------- */}
      {launchStatus === 'live' && (
        <motion.div
          key="live"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-[48px] font-bold text-stone-900 tracking-tight mb-4 leading-none">
              Store is live!
            </h2>
            <p className="text-xl text-stone-500 font-medium">
              <strong className="text-stone-900">{storeName}</strong> is now open for business.
            </p>
          </div>

          <div className="p-2 bg-stone-50 rounded-full border border-stone-200 flex items-center justify-between gap-3 mb-10 max-w-md mx-auto">
            <span className="font-mono text-[15px] font-bold text-stone-900 truncate pl-6">
              {finalStoreUrl || `https://${displayDomain}`}
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-6 py-3 bg-white border border-stone-200 text-stone-900 rounded-full font-bold text-sm hover:bg-stone-100 transition-colors flex-shrink-0 flex items-center gap-2"
            >
              {copied ? 'Copied' : 'Copy'}
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => navigate('/admin')}
              className="w-full sm:w-auto flex-1 py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Go to Admin
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={finalStoreUrl || `https://${displayDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 py-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              View Store
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

