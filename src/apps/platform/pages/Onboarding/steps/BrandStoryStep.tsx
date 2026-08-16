import React from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="w-full max-w-2xl text-left animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl sm:text-[48px] font-extrabold tracking-tight text-stone-900 leading-[1.1] mb-4">
          Tell us about your brand.
        </h1>
        <p className="text-lg text-stone-500 font-medium leading-relaxed max-w-xl mb-12">
          A tagline and short intro help customers connect with your store.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Tagline */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Brand Tagline
            </label>
            <input
              type="text"
              value={data.business.tagline || ''}
              onChange={(e) => handleTaglineChange(e.target.value)}
              placeholder="e.g. Handcrafted with Passion & Authenticity"
              className="w-full px-5 py-4 text-base font-bold text-stone-900 bg-stone-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all placeholder:text-stone-300"
            />
          </div>

          {/* Short Story / Bio */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              About Your Store <span className="normal-case font-medium tracking-normal text-stone-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={data.business.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="e.g. Bringing authentic luxury products directly to discerning customers."
              className="w-full px-5 py-4 text-sm font-medium text-stone-900 bg-stone-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all placeholder:text-stone-300 resize-none"
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Customer Support Email
            </label>
            <input
              type="email"
              value={data.business.contactEmail || ''}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="e.g. hello@mystore.com"
              className="w-full px-5 py-4 text-base font-bold text-stone-900 bg-stone-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all placeholder:text-stone-300"
            />
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-stone-200/60 mt-12">
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-900 rounded-full font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-full font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

