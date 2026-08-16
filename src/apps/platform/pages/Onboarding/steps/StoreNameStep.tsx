import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const StoreNameStep: React.FC = () => {
  const { data, updateBusiness, nextStep, prevStep } = useOnboarding();

  const handleNameChange = (name: string) => {
    updateBusiness({ name });
  };

  const isValid = data.business.name.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      nextStep();
    }
  };

  return (
    <div className="w-full max-w-2xl text-left animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl sm:text-[48px] font-extrabold tracking-tight text-stone-900 leading-[1.1] mb-4">
          What's your store's name?
        </h1>
        <p className="text-lg text-stone-500 font-medium leading-relaxed max-w-xl mb-12">
          This will appear on your storefront header, customer invoices, and order receipts.
        </p>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Premium Input */}
          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              value={data.business.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full px-5 py-4 text-xl sm:text-2xl font-bold text-stone-900 bg-stone-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all placeholder:text-stone-300"
            />
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
              type="submit"
              disabled={!isValid}
              className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-sm ${
                isValid
                  ? 'bg-stone-900 hover:bg-stone-800 active:scale-95 text-white cursor-pointer'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
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

