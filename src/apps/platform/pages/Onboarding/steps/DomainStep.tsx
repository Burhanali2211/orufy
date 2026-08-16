import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft, CheckCircle2, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export const DomainStep: React.FC = () => {
  const { data, updateDomain, nextStep, prevStep } = useOnboarding();
  const [selectedType, setSelectedType] = useState<'subdomain' | 'custom'>(
    data.domain.type === 'custom' ? 'custom' : 'subdomain'
  );

  const initialSub = data.business.subdomain || data.domain.subdomain || 'my-store';
  const [subdomainInput, setSubdomainInput] = useState(initialSub);
  const [customInput, setCustomInput] = useState(data.domain.customHostname || '');

  const siteHostname = import.meta.env.VITE_SITE_URL 
    ? new URL(import.meta.env.VITE_SITE_URL).hostname 
    : 'get-oru.com';

  // Auto-sync subdomain input to context on change
  useEffect(() => {
    if (selectedType === 'subdomain') {
      const clean = subdomainInput.toLowerCase().replace(/[^a-z0-9-]/g, '');
      updateDomain({ type: 'subdomain', subdomain: clean || 'my-store', isVerified: true });
    }
  }, [subdomainInput, selectedType]);

  const handleCustomDomainSave = () => {
    const clean = customInput.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    updateDomain({
      type: 'custom',
      customHostname: clean,
      isVerified: true,
    });
  };

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
        <p className="text-lg text-stone-500 font-medium leading-relaxed max-w-xl mb-12">
          This is where your customers will find your store. You can use our free fast domain, or connect your own.
        </p>

        <div className="space-y-8 mb-12">
          {/* Subdomain Section */}
          <div className={`p-6 rounded-2xl border transition-all ${selectedType === 'subdomain' ? 'border-stone-900 bg-white ring-1 ring-stone-900' : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'}`}>
            <label 
              className="flex items-start gap-4 cursor-pointer w-full"
              onClick={() => setSelectedType('subdomain')}
            >
              <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${selectedType === 'subdomain' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white'}`}>
                {selectedType === 'subdomain' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-stone-900 mb-1">Free Store Domain</h3>
                <p className="text-sm text-stone-500 mb-4">A fast, secure, SSL-enabled address managed by us.</p>
                
                {selectedType === 'subdomain' && (
                  <div className="flex mt-2 animate-fadeIn">
                    <div className="flex flex-1 items-center bg-stone-100 rounded-xl border border-transparent focus-within:border-stone-900 focus-within:bg-white transition-colors overflow-hidden px-4 py-3.5">
                      <span className="text-stone-400 font-medium text-sm sm:text-base select-none shrink-0">https://</span>
                      <input
                        type="text"
                        value={subdomainInput}
                        onChange={(e) => setSubdomainInput(e.target.value)}
                        placeholder="your-store"
                        className="bg-transparent border-none outline-none text-stone-900 font-bold text-sm sm:text-base min-w-[80px] text-right"
                        style={{ width: `${Math.max(10, subdomainInput.length)}ch` }}
                      />
                      <span className="text-stone-400 font-medium text-sm sm:text-base select-none shrink-0">.{siteHostname}</span>
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Custom Domain Section */}
          <div className={`p-6 rounded-2xl border transition-all ${selectedType === 'custom' ? 'border-stone-900 bg-white ring-1 ring-stone-900' : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'}`}>
            <label 
              className="flex items-start gap-4 cursor-pointer w-full"
              onClick={() => setSelectedType('custom')}
            >
              <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${selectedType === 'custom' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white'}`}>
                {selectedType === 'custom' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-stone-900">Custom Domain</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700 tracking-wide uppercase">Pro</span>
                </div>
                <p className="text-sm text-stone-500 mb-4">Connect a domain you already own (e.g. yourstore.com).</p>

                {selectedType === 'custom' && (
                  <div className="animate-fadeIn space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                      <div className="flex-1 flex items-center bg-stone-100 rounded-xl border border-transparent focus-within:border-stone-900 focus-within:bg-white transition-colors overflow-hidden px-4 py-3.5">
                        <Globe className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                        <input
                          type="text"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="e.g. yourbrand.com"
                          className="bg-transparent border-none outline-none text-stone-900 font-bold text-sm sm:text-base w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCustomDomainSave}
                        className="px-6 py-3.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                      >
                        Link Domain
                      </button>
                    </div>
                    {data.domain.customHostname && (
                      <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Linked to <strong>{data.domain.customHostname}</strong>. DNS active.</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-stone-200/60">
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
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-full font-bold text-sm transition-all shadow-sm cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
