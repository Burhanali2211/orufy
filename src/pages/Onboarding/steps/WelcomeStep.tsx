import React from 'react';
import { useOnboarding } from '../OnboardingContext';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, LayoutDashboard, Globe } from 'lucide-react';

export const WelcomeStep: React.FC = () => {
  const { nextStep } = useOnboarding();

  return (
    <div className="space-y-10 animate-fadeIn max-w-xl mx-auto text-center">
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-[#0071e3]/10 text-[#0071e3] rounded-3xl mx-auto flex items-center justify-center mb-6"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.08]"
        >
          Let's build your store.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[17px] text-[#86868b] font-normal leading-relaxed max-w-md mx-auto"
        >
          In just a few steps, we'll set up your branding, layout, and secure your custom domain.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-6"
      >
        <div className="bg-white p-6 rounded-3xl border border-[#d2d2d7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <Globe className="w-6 h-6 text-[#1d1d1f] mb-4" />
          <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Your Identity</h3>
          <p className="text-[13px] text-[#86868b] leading-relaxed">Name your store and define your unique visual aesthetic.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#d2d2d7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <LayoutDashboard className="w-6 h-6 text-[#1d1d1f] mb-4" />
          <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Ready to Launch</h3>
          <p className="text-[13px] text-[#86868b] leading-relaxed">Instantly provision your database and publish your storefront.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="pt-8"
      >
        <button
          type="button"
          onClick={nextStep}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white rounded-full font-medium text-[15px] shadow-sm transition-all active:scale-95"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
