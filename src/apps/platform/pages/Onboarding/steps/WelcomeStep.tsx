import React from 'react';
import { useOnboarding } from '../OnboardingContext';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const WelcomeStep: React.FC = () => {
  const { nextStep } = useOnboarding();

  return (
    <div className="w-full max-w-2xl text-left animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl sm:text-[48px] font-extrabold tracking-tight text-stone-900 leading-[1.1] mb-6">
          Welcome to your new business.
        </h1>
        <p className="text-lg sm:text-xl text-stone-500 font-medium leading-relaxed max-w-xl mb-12">
          We're going to set up your store identity, configure your secure payment vault, and get your custom domain ready for launch.
        </p>

        <div className="space-y-6 mb-12">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">Brand & Aesthetics</h3>
              <p className="text-sm text-stone-500">Configure your storefront visuals.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">Payment Processing</h3>
              <p className="text-sm text-stone-500">Connect a secure gateway to accept funds.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-stone-900 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">Custom Domain</h3>
              <p className="text-sm text-stone-500">Claim your piece of the internet.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-4 border-t border-stone-200/60">
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-full font-bold text-sm transition-all shadow-sm cursor-pointer"
          >
            <span>Start Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Takes about 3 minutes
          </div>
        </div>
      </motion.div>
    </div>
  );
};

