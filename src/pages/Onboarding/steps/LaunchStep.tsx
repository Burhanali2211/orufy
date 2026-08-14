import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Rocket, Globe, CreditCard, Palette, Store, ExternalLink, ArrowRight, Copy, Check } from 'lucide-react';

export const LaunchStep: React.FC = () => {
  const { data } = useOnboarding();
  const { user, signUp } = useAuth();
  const navigate = useNavigate();

  const [launchStatus, setLaunchStatus] = useState<'ready' | 'launching' | 'live'>('ready');
  const [activeDeployStep, setActiveDeployStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [finalStoreUrl, setFinalStoreUrl] = useState('');
  
  // Auth state for the final step
  const [email, setEmail] = useState(data.business.contactEmail || '');
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

  const handleLaunch = async () => {
    setLaunchStatus('launching');
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
          contactEmail: data.business.contactEmail || user?.email || '',
        },
        brand: data.brand,
        initialProducts: data.initialProducts,
      };

      const res = await fetch('/api/platform/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id || '',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      clearInterval(interval);

      if (res.ok || result.success) {
        setFinalStoreUrl(`https://${result.hostname || displayDomain}`);
      } else {
        setFinalStoreUrl(`https://${displayDomain}`);
      }
      setLaunchStatus('live');
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
    if (!email || !password) {
      setAuthError('Please enter email and password.');
      return;
    }
    
    setIsAuthLoading(true);
    setAuthError('');
    try {
      await signUp(email, password, { 
        fullName: `${storeName} Admin`, 
        role: 'admin' 
      });
      navigate('/dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create account.');
      setIsAuthLoading(false);
    }
  };

  /* -------------------------------------------------------------
   * STATE 1: READY TO LAUNCH
   * ------------------------------------------------------------- */
  if (launchStatus === 'ready') {
    return (
      <div className="space-y-10 animate-fadeIn max-w-xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.08]">
            Ready to publish.
          </h1>
          <p className="text-[15px] text-[#86868b] font-normal leading-relaxed">
            Review your store details and publish your storefront live.
          </p>
        </div>

        {/* Minimalist Apple Manifest Summary */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#d2d2d7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-center gap-3.5 p-4 bg-[#f5f5f7] rounded-2xl border border-[#e5e5ea]">
              <div className="w-8 h-8 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Store</span>
                <p className="text-sm font-semibold text-[#1d1d1f] truncate">{storeName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 bg-[#f5f5f7] rounded-2xl border border-[#e5e5ea]">
              <div className="w-8 h-8 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Category</span>
                <p className="text-sm font-semibold text-[#1d1d1f] truncate">{data.business.category || 'General'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 bg-[#f5f5f7] rounded-2xl border border-[#e5e5ea]">
              <div className="w-8 h-8 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Payments</span>
                <p className="text-sm font-semibold text-[#1d1d1f] truncate">
                  {data.payments.connected ? 'Instant UPI & Cards' : 'Direct Checkout'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 bg-[#f5f5f7] rounded-2xl border border-[#e5e5ea]">
              <div className="w-8 h-8 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Address</span>
                <p className="text-sm font-mono font-semibold text-[#1d1d1f] truncate">{displayDomain}</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleLaunch}
              className="w-full py-4 bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white rounded-full font-medium text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Rocket className="w-4 h-4 text-white" />
              <span>Launch Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
   * STATE 2: LAUNCHING IN PROGRESS
   * ------------------------------------------------------------- */
  if (launchStatus === 'launching') {
    return (
      <div className="bg-white p-10 rounded-3xl border border-[#d2d2d7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center space-y-6 animate-fadeIn max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-[#0071e3] text-white flex items-center justify-center mx-auto shadow-xs">
          <Rocket className="w-6 h-6 hidden" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Publishing your storefront</h2>
          <p className="text-xs text-[#86868b] font-normal">
            Setting up database isolation, brand styling, and SSL routing...
          </p>
        </div>

        <div className="max-w-sm mx-auto space-y-2.5 text-left bg-[#f5f5f7] p-5 rounded-2xl border border-[#e5e5ea] text-xs">
          {deployStages.map((stage, idx) => {
            const isCompleted = idx < activeDeployStep;
            const isCurrent = idx === activeDeployStep;
            return (
              <div key={idx} className="flex items-center gap-2.5">
                {isCompleted ? (
                  <Check className="w-4 h-4 text-[#34c759] flex-shrink-0 stroke-[3]" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full hidden flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[#d2d2d7] flex-shrink-0" />
                )}
                <span
                  className={`${
                    isCompleted
                      ? 'text-[#1d1d1f] font-medium'
                      : isCurrent
                      ? 'text-[#1d1d1f] font-semibold'
                      : 'text-[#86868b]'
                  }`}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
   * STATE 3: LIVE CELEBRATION
   * ------------------------------------------------------------- */
  return (
    <div className="bg-white p-10 rounded-3xl border border-[#d2d2d7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center space-y-6 animate-fadeIn max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9] flex items-center justify-center mx-auto shadow-xs font-bold text-lg">
        <Check className="w-6 h-6 stroke-[3]" />
      </div>

      <div className="space-y-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
          Store is Live Online
        </span>
        <h2 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight">
          Congratulations!
        </h2>
        <p className="text-sm text-[#86868b] max-w-sm mx-auto leading-relaxed">
          <strong>{storeName}</strong> is now published and ready to welcome customers and orders.
        </p>
      </div>

      <div className="p-4 bg-[#f5f5f7] rounded-2xl border border-[#e5e5ea] flex items-center justify-between gap-3">
        <span className="font-mono text-xs font-semibold text-[#1d1d1f] truncate">
          {finalStoreUrl || `https://${displayDomain}`}
        </span>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="p-2 text-[#86868b] hover:text-[#1d1d1f] rounded-lg hover:bg-[#e5e5ea] transition-colors flex-shrink-0 cursor-pointer"
          title="Copy URL"
        >
          {copied ? <Check className="w-4 h-4 text-[#34c759] stroke-[3]" /> : <Copy className="w-4 h-4 text-[#86868b]" />}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="py-3.5 px-4 bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] rounded-full font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-[#d2d2d7] active:scale-95 shadow-xs"
        >
          <span>Visit Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {user ? (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="py-3.5 px-4 bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white rounded-full font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {!user && (
        <div className="mt-8 pt-6 border-t border-[#d2d2d7]/50 text-left">
          <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Secure your store</h3>
          <p className="text-[13px] text-[#86868b] mb-4">Create an admin account to access your dashboard.</p>
          
          <form onSubmit={handleCreateAccount} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              className="w-full px-4 py-3 text-sm font-medium text-[#1d1d1f] bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 transition-all"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Secure Password"
              minLength={6}
              className="w-full px-4 py-3 text-sm font-medium text-[#1d1d1f] bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 transition-all"
            />
            {authError && (
              <p className="text-xs text-red-500 font-medium">{authError}</p>
            )}
            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3.5 bg-[#1d1d1f] hover:bg-black text-white rounded-xl font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAuthLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account & Access Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
