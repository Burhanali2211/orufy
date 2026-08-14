import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, Check } from 'lucide-react';

export const StoreNameStep: React.FC = () => {
  const { data, updateBusiness, nextStep } = useOnboarding();
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean;
    message?: string;
  }>({ checking: false, available: true });

  const handleNameChange = (name: string) => {
    updateBusiness({ name });
  };

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
    }, 250);

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
    <div className="space-y-12 animate-fadeIn max-w-xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.08]">
          What is your store named?
        </h1>
        <p className="text-[15px] text-[#86868b] font-normal leading-relaxed">
          This will appear on your storefront header, customer invoices, and order receipts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Massive Apple Tactile Input */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              value={data.business.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Aligarh Attar House"
              className="w-full px-5 py-4 text-xl sm:text-2xl font-medium text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all placeholder:text-[#a1a1a6] placeholder:font-normal"
            />
            {isValid && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Clean Subdomain Tag */}
          {data.business.subdomain && (
            <div className="flex items-center gap-2 pt-1 px-1">
              <span className="text-xs text-[#86868b] font-medium">Your store link:</span>
              <span className="font-mono text-xs font-medium text-[#1d1d1f] bg-white px-3 py-1 rounded-lg border border-[#d2d2d7]/70 shadow-xs">
                https://{data.business.subdomain}.platform.local
              </span>
              {subdomainStatus.checking && <></>}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={!isValid}
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm transition-all ${
              isValid
                ? 'bg-[#0071e3] text-white hover:bg-[#0077ed] active:bg-[#0062c4] shadow-xs active:scale-98 cursor-pointer'
                : 'bg-[#e5e5ea] text-[#a1a1a6] cursor-not-allowed'
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
