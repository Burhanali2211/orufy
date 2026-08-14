import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, Check } from 'lucide-react';

const CATEGORIES = [
  'General Products',
  'Clothing & Apparel',
  'Jewelry & Accessories',
  'Beauty & Wellness',
  'Handicrafts & Art',
  'Gourmet & Foods',
  'Electronics & Tech',
  'General Commerce',
];

export const BusinessStep: React.FC = () => {
  const { data, updateBusiness, nextStep } = useOnboarding();
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean;
    message?: string;
  }>({ checking: false, available: true });

  const handleNameChange = (name: string) => {
    updateBusiness({ name });
    if (!data.business.subdomain || data.business.subdomain === data.business.name.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const autoSub = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      updateBusiness({ subdomain: autoSub });
    }
  };

  const handleCategorySelect = (category: string) => {
    updateBusiness({ category });
  };

  // Real-time backend subdomain check
  useEffect(() => {
    const sub = data.business.subdomain || data.domain.subdomain;
    if (!sub || sub.length < 2) {
      setSubdomainStatus({ checking: false, available: false });
      return;
    }

    setSubdomainStatus({ checking: true, available: true });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/platform/check-subdomain?subdomain=${encodeURIComponent(sub)}`);
        if (res.ok) {
          const json = await res.json();
          setSubdomainStatus({
            checking: false,
            available: json.available,
            message: json.reason || (json.available ? 'Available' : 'Unavailable'),
          });
        } else {
          setSubdomainStatus({ checking: false, available: true });
        }
      } catch {
        setSubdomainStatus({ checking: false, available: true });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [data.business.subdomain, data.domain.subdomain]);

  const isValid = data.business.name.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      nextStep();
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Title & One Main Idea */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
          What is your store called?
        </h1>
        <p className="text-sm sm:text-base text-stone-500 font-normal leading-relaxed">
          This name will appear on your storefront header, customer invoices, and order receipts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Large Tactile Name Input */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-stone-900 uppercase tracking-widest">
            Store Name
          </label>
          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              value={data.business.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Aligarh Attar House"
              className="w-full px-5 py-4 text-lg sm:text-xl font-bold text-stone-900 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 shadow-2xs transition-all placeholder:text-stone-300 placeholder:font-medium"
            />
            {data.business.name.trim().length >= 2 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Subdomain preview tag */}
          {data.business.subdomain && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-stone-400 font-medium">Store link:</span>
              <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200/60">
                https://{data.business.subdomain}.platform.local
              </span>
              {subdomainStatus.checking && <></>}
            </div>
          )}
        </div>

        {/* Minimal Category Pills */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-stone-900 uppercase tracking-widest">
            Primary Category
          </label>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = data.business.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Navigation Action */}
        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={!isValid}
            className={`inline-flex items-center gap-2 px-9 py-4 rounded-full font-bold text-sm transition-all ${
              isValid
                ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-md shadow-stone-900/10 active:scale-98 cursor-pointer'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
