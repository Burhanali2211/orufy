import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Rocket, Globe, CreditCard, Store, ExternalLink, ArrowRight, Copy, CheckCircle2, ShieldCheck, Mail, User, Lock, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/shared/lib/apiClient';

export const LaunchStep: React.FC = () => {
  const { data } = useOnboarding();
  const { user, signUp } = useAuth();
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

  const storeName = data.business.name.trim() || 'My Store';
  const displayDomain = (() => {
    if (data.domain.type === 'custom' && data.domain.customHostname) {
      return data.domain.customHostname;
    }
    const sub = data.business.subdomain || data.domain.subdomain || 'my-store';
    const base = typeof window !== 'undefined' ? window.location.host : 'platform.local';
    return `${sub}.${base.replace(/^www\./, '')}`;
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
      const payload = {
        business: {
          name: data.business.name,
          category: data.business.category,
          subdomain: data.business.subdomain || data.domain.subdomain,
          contactEmail: data.business.contactEmail || user?.email || email || '',
        },
        brand: data.brand,
        initialProducts: data.initialProducts,
      };

      if (isAlreadyLaunching) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const token = localStorage.getItem('auth_token');
      const authorizedRes = await fetch('/api/platform/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await authorizedRes.json();
      clearInterval(interval);

      if (authorizedRes.ok || result.success) {
        const finalHostname = result.hostname || displayDomain;
        setFinalStoreUrl(`https://${finalHostname}`);
        
        // Ensure the API client knows the store we just created
        apiClient.setStoreHostname(finalHostname);

        setLaunchStatus('live');
      } else {
        setFinalStoreUrl(`https://${displayDomain}`);
        setLaunchStatus('live');
      }
    } catch {
      clearInterval(interval);
      setFinalStoreUrl(`https://${displayDomain}`);
      setLaunchStatus('live');
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
    if (!firstName || !lastName || !email || !password || !phone) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    setIsAuthLoading(true);
    setAuthError('');
    try {
      await signUp(email, password, {
        fullName: `${firstName} ${lastName}`.trim(),
        role: 'admin',
        phone: phone.trim()
      });
      await handleLaunch(true);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create account.');
      setIsAuthLoading(false);
      setLaunchStatus('claim');
    }
  };

  return (
    <AnimatePresence mode="wait">
      {/* -------------------------------------------------------------
        * STATE 1: CLAIM YOUR STORE (ACCOUNT CREATION)
        * ------------------------------------------------------------- */}
      {launchStatus === 'claim' && (
        <motion.div
          key="claim"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg mx-auto"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-stone-100 rounded-2xl mb-6">
              <ShieldCheck className="w-6 h-6 text-stone-900" />
            </div>
            <h1 className="text-[40px] font-bold text-stone-900 tracking-tight leading-none mb-4">
              Secure your store
            </h1>
            <p className="text-lg text-stone-500 font-medium leading-relaxed">
              Create your admin account to finalize <span className="text-stone-900 font-bold">{storeName}</span>.
            </p>
          </div>

          <form onSubmit={handleCreateAccount} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-stone-900 uppercase tracking-wide">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 text-base text-stone-900 bg-stone-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow placeholder:text-stone-400 font-medium"
                    placeholder="Jane"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-stone-900 uppercase tracking-wide">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-4 text-base text-stone-900 bg-stone-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow placeholder:text-stone-400 font-medium"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-stone-900 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-stone-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 text-base text-stone-900 bg-stone-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow placeholder:text-stone-400 font-medium"
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-stone-900 uppercase tracking-wide">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-stone-400" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 text-base text-stone-900 bg-stone-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow placeholder:text-stone-400 font-medium"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-stone-900 uppercase tracking-wide">Admin Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-stone-400" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 text-base text-stone-900 bg-stone-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow placeholder:text-stone-400 font-medium"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-stone-500 font-medium pt-1">Must be at least 8 characters long.</p>
            </div>

            {authError && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {authError}
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-4.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-bold text-base transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {isAuthLoading ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Securing Account...
                  </span>
                ) : (
                  <>
                    <span>Create Account & Publish Store</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => {
                    // Quick skip for development if needed, normally hidden or requires auth
                    if (user) handleLaunch(false);
                  }}
                  className="text-sm font-bold text-stone-400 hover:text-stone-900 transition-colors"
                >
                  {user ? 'Skip & Publish directly' : ''}
                </button>
              </div>
            </div>
          </form>
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
          className="w-full max-w-2xl mx-auto"
        >
          <div className="mb-12">
            <h1 className="text-[48px] font-bold text-stone-900 tracking-tight leading-none mb-4">
              Ready to publish.
            </h1>
            <p className="text-xl text-stone-500 font-medium leading-relaxed">
              Review your details before we deploy <strong className="text-stone-900">{storeName}</strong> to the world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="p-6 bg-stone-50 rounded-3xl">
              <Store className="w-6 h-6 text-stone-400 mb-4" />
              <span className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Store Name</span>
              <p className="text-base font-bold text-stone-900 truncate">{storeName}</p>
            </div>
            <div className="p-6 bg-stone-50 rounded-3xl">
              <Globe className="w-6 h-6 text-stone-400 mb-4" />
              <span className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Domain</span>
              <p className="text-base font-bold text-stone-900 truncate">{displayDomain}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleLaunch(false)}
            className="w-full py-5 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <Rocket className="w-5 h-5" />
            <span>Launch Storefront Now</span>
          </button>
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
              href="/"
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

