import React from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export const BrandStoryStep: React.FC = () => {
  const { data, updateBusiness, nextStep, prevStep } = useOnboarding();

  const handleTaglineChange = (tagline: string) => {
    updateBusiness({ tagline });
  };

  const handleDescriptionChange = (description: string) => {
    updateBusiness({ description });
  };

  const handleEmailChange = (contactEmail: string) => {
    updateBusiness({ contactEmail });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.08]">
          Tell us about your brand.
        </h1>
        <p className="text-[15px] text-[#86868b] font-normal leading-relaxed">
          A tagline and short intro help customers connect with your store.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Tagline */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
            Brand Tagline
          </label>
          <input
            type="text"
            value={data.business.tagline || ''}
            onChange={(e) => handleTaglineChange(e.target.value)}
            placeholder="e.g. Handcrafted with Passion & Authenticity"
            className="w-full px-5 py-4 text-base font-medium text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 shadow-xs transition-all placeholder:text-[#a1a1a6]"
          />
        </div>

        {/* Short Story / Bio */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
            About Your Store <span className="normal-case font-normal tracking-normal text-[#a1a1a6]">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={data.business.description || ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="e.g. Bringing authentic luxury products directly to discerning customers."
            className="w-full px-5 py-4 text-sm font-medium text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 shadow-xs transition-all placeholder:text-[#a1a1a6] resize-none"
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
            Customer Support Email
          </label>
          <input
            type="email"
            value={data.business.contactEmail || ''}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="e.g. hello@mystore.com"
            className="w-full px-5 py-4 text-base font-medium text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 shadow-xs transition-all placeholder:text-[#a1a1a6]"
          />
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
            type="submit"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm bg-[#0071e3] text-white hover:bg-[#0077ed] active:bg-[#0062c4] shadow-xs active:scale-98 cursor-pointer transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
