import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { Globe, ArrowRight, ArrowLeft, Check, CheckCircle } from 'lucide-react';

export const DomainStep: React.FC = () => {
  const { data, updateDomain, nextStep, prevStep } = useOnboarding();
  const [selectedType, setSelectedType] = useState<'subdomain' | 'custom'>(
    data.domain.type === 'custom' ? 'custom' : 'subdomain'
  );
  const [customInput, setCustomInput] = useState(data.domain.customHostname || '');

  const sub = data.business.subdomain || data.domain.subdomain || 'my-store';
  const siteHostname = import.meta.env.VITE_SITE_URL 
    ? new URL(import.meta.env.VITE_SITE_URL).hostname 
    : 'get-oru.com';
  const defaultSubdomainDisplay = `${sub}.${siteHostname}`;

  const handleSelectSubdomain = () => {
    setSelectedType('subdomain');
    updateDomain({ type: 'subdomain', isVerified: true });
  };

  const handleCustomDomainSave = () => {
    setSelectedType('custom');
    const clean = customInput.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    updateDomain({
      type: 'custom',
      customHostname: clean,
      isVerified: true,
    });
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.08]">
          Choose your store address.
        </h1>
        <p className="text-[15px] text-[#86868b] font-normal leading-relaxed">
          Select how customers will reach your storefront.
        </p>
      </div>

      {/* 2 Clear Apple Choices */}
      <div className="space-y-4">
        {/* Choice 1: Free Instant Subdomain */}
        <div
          onClick={handleSelectSubdomain}
          className={`p-6 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
            selectedType === 'subdomain'
              ? 'border-[#0071e3] bg-white ring-4 ring-[#0071e3]/10 shadow-[0_2px_12px_rgba(0,113,227,0.08)]'
              : 'border-[#d2d2d7]/60 bg-white hover:border-[#86868b] shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#0071e3] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Globe className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-[#1d1d1f]">
                    https://{defaultSubdomainDisplay}
                  </span>
                  <span className="px-2.5 py-0.5 bg-[#e8f5e9] text-[#2e7d32] text-[10px] font-bold rounded-full border border-[#c8e6c9]">
                    Free SSL
                  </span>
                </div>
                <p className="text-xs text-[#86868b] font-normal leading-relaxed">
                  Included free with automated global SSL security and edge routing. Zero configuration required.
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] transition-all shrink-0 mt-0.5 ${
                selectedType === 'subdomain'
                  ? 'bg-[#0071e3] text-white border-[#0071e3]'
                  : 'border-[#d2d2d7] bg-white'
              }`}
            >
              {selectedType === 'subdomain' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* Choice 2: Custom Domain */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            selectedType === 'custom'
              ? 'border-[#0071e3] bg-white ring-4 ring-[#0071e3]/10 shadow-[0_2px_12px_rgba(0,113,227,0.08)]'
              : 'border-[#d2d2d7]/60 bg-white hover:border-[#86868b] shadow-xs'
          }`}
        >
          <div
            onClick={() => setSelectedType('custom')}
            className="flex items-start justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-[#1d1d1f]">Custom Domain</h3>
                <p className="text-xs text-[#86868b] font-normal leading-relaxed">
                  Connect a custom domain you already own (e.g. yourstore.com).
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] transition-all shrink-0 mt-0.5 ${
                selectedType === 'custom'
                  ? 'bg-[#0071e3] text-white border-[#0071e3]'
                  : 'border-[#d2d2d7] bg-white'
              }`}
            >
              {selectedType === 'custom' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {selectedType === 'custom' && (
            <div className="mt-5 pt-4 border-t border-[#e5e5ea] space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. yourbrand.com"
                  className="flex-1 px-4 py-3 text-sm font-mono font-medium text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:bg-white focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10"
                />
                <button
                  type="button"
                  onClick={handleCustomDomainSave}
                  className="px-5 py-3 bg-[#1d1d1f] text-white rounded-xl text-xs font-semibold hover:bg-[#000000] transition-all active:scale-95 cursor-pointer"
                >
                  Link
                </button>
              </div>
              {data.domain.customHostname && (
                <p className="text-xs text-[#2e7d32] font-medium flex items-center gap-1.5 pt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-[#2e7d32]" />
                  <span>Linked to {data.domain.customHostname}. DNS configuration active.</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="pt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full font-medium text-xs text-[#1d1d1f] bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={nextStep}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm bg-[#0071e3] text-white hover:bg-[#0077ed] active:bg-[#0062c4] shadow-xs active:scale-98 cursor-pointer transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
