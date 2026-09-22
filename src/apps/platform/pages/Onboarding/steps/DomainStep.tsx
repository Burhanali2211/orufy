import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft, CheckCircle2, Lock, Copy, Check, ShieldCheck, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const DomainStep: React.FC = () => {
  const { data, updateDomain, nextStep, prevStep } = useOnboarding();
  const [subdomainInput, setSubdomainInput] = useState(data.business.subdomain || data.domain.subdomain || 'my-store');
  const [copied, setCopied] = useState(false);

  const [subdomainCheck, setSubdomainCheck] = useState<{
    status: 'idle' | 'checking' | 'available' | 'unavailable';
    message?: string;
  }>({
    status: 'idle',
    message: '',
  });

  const siteHostname = import.meta.env.VITE_SITE_URL 
    ? new URL(import.meta.env.VITE_SITE_URL).hostname 
    : 'get-oru.com';

  const cleanSubdomain = subdomainInput
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

  const fullStoreUrl = `https://${cleanSubdomain || 'your-store'}.${siteHostname}`;

  // Auto-sync subdomain input to context on change
  useEffect(() => {
    const sanitized = cleanSubdomain.replace(/^-|-$/g, '') || 'my-store';
    updateDomain({ type: 'subdomain', subdomain: sanitized, isVerified: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomainInput]);

  // Real-time debounced availability check
  useEffect(() => {
    const trimmed = cleanSubdomain.replace(/^-|-$/g, '');
    if (!trimmed || trimmed.length < 2) {
      setSubdomainCheck({
        status: 'unavailable',
        message: 'Must be at least 2 characters (letters, numbers, or hyphens).',
      });
      return;
    }

    setSubdomainCheck({ status: 'checking', message: 'Checking availability…' });

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/platform/check-subdomain?subdomain=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error('Verification request failed');
        }
        const json = await res.json();
        if (json.available) {
          setSubdomainCheck({
            status: 'available',
            message: 'Available & SSL Ready',
          });
        } else {
          setSubdomainCheck({
            status: 'unavailable',
            message: json.reason || 'This store address is already taken. Please choose another.',
          });
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          // Fallback to valid format
          setSubdomainCheck({
            status: 'available',
            message: 'Ready for setup',
          });
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [cleanSubdomain]);

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomainInput(val);
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullStoreUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSubdomainValid = cleanSubdomain.replace(/^-|-$/g, '').length >= 2;
  const isSubdomainReady = isSubdomainValid && subdomainCheck.status === 'available';
  const canContinue = isSubdomainReady;

  return (
    <div className="w-full max-w-2xl text-left animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl sm:text-[48px] font-extrabold tracking-tight text-stone-900 leading-[1.1] mb-4">
          Set your web address.
        </h1>
        <p className="text-lg text-stone-500 font-medium leading-relaxed max-w-xl mb-10">
          This is where your customers will find your store. We provide a fast, secure domain for free.
        </p>

        <div className="space-y-6 mb-12">
          {/* Subdomain Configuration Area */}
          <div className="p-6 sm:p-7 rounded-2xl border border-stone-200/80 bg-stone-50/40">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h3 className="text-base font-bold text-stone-900">Your Store Domain</h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Included Free
                  </span>
                </div>
                <p className="text-sm text-stone-500 leading-relaxed mb-6">
                  A fast, secure address with zero setup. Managed and hosted on our global edge network.
                </p>

                <div className="space-y-4">
                  {/* Unified URL Input Box */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Store Domain Slug
                      </label>

                      {/* Real-time Status Badge */}
                      <div>
                        {subdomainCheck.status === 'checking' && (
                          <span className="inline-flex items-center gap-1 text-xs text-stone-500 font-medium">
                            <Loader2 className="w-3 h-3 animate-spin text-stone-400" />
                            Checking…
                          </span>
                        )}
                        {subdomainCheck.status === 'available' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {subdomainCheck.message}
                          </span>
                        )}
                        {subdomainCheck.status === 'unavailable' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/70">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            {subdomainCheck.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`flex items-center rounded-xl border transition-all px-3.5 py-2.5 sm:py-3 shadow-inner ${
                      subdomainCheck.status === 'unavailable'
                        ? 'bg-rose-50/40 border-rose-300 focus-within:border-rose-600 focus-within:ring-2 focus-within:ring-rose-500/10'
                        : 'bg-stone-50 hover:bg-stone-100/70 focus-within:bg-white border-stone-200 focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/10'
                    }`}>
                      {/* Protocol Prefix */}
                      <div className="flex items-center gap-1 text-stone-400 font-medium text-sm sm:text-base select-none shrink-0 pr-1.5 border-r border-stone-200/80 mr-2.5">
                        <Lock className="w-3.5 h-3.5 text-stone-400" />
                        <span>https://</span>
                      </div>

                      {/* Subdomain Input */}
                      <input
                        type="text"
                        value={subdomainInput}
                        onChange={handleSubdomainChange}
                        placeholder="your-store"
                        spellCheck={false}
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="flex-1 bg-transparent border-none outline-none text-stone-900 font-bold text-sm sm:text-base min-w-[100px] placeholder:text-stone-300"
                      />

                      {/* Suffix Pill */}
                      <div className="shrink-0 bg-stone-200/70 text-stone-600 font-semibold px-2.5 py-1 rounded-md text-xs sm:text-sm select-none border border-stone-300/40">
                        .{siteHostname}
                      </div>
                    </div>
                  </div>

                  {/* Live Preview & Copy Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl p-3.5 border border-stone-200/70 shadow-sm mt-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          subdomainCheck.status === 'unavailable' ? 'bg-rose-400' : 'bg-emerald-400'
                        }`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          subdomainCheck.status === 'unavailable' ? 'bg-rose-500' : 'bg-emerald-500'
                        }`} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                          Live Storefront Address
                        </div>
                        <div className="text-sm font-semibold text-stone-900 font-mono truncate">
                          {fullStoreUrl}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 shadow-sm transition-all shrink-0 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-500" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs text-stone-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Automatic SSL Certificate
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      Global Edge CDN
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                      Zero DNS Setup
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-stone-200/60 mt-8">
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-900 rounded-full font-bold text-sm transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={nextStep}
            disabled={!canContinue}
            className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-sm ${
              canContinue
                ? 'bg-stone-900 hover:bg-stone-800 active:scale-95 text-white cursor-pointer'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
