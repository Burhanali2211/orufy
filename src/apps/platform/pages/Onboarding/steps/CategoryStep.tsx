import React from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Shirt, Gem, Droplet, Palette, Coffee, Laptop, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  {
    id: 'Perfumes & Fragrances',
    title: 'Perfumes & Fragrances',
    subtitle: 'Attars, concentrated oils, luxury scents',
    icon: Sparkles
  },
  {
    id: 'Fashion & Apparel',
    title: 'Fashion & Apparel',
    subtitle: 'Clothing, ethnic wear, couture, fabrics',
    icon: Shirt
  },
  {
    id: 'Jewelry & Accessories',
    title: 'Jewelry & Accessories',
    subtitle: 'Fine jewelry, silver, necklaces, watches',
    icon: Gem
  },
  {
    id: 'Beauty & Skincare',
    title: 'Beauty & Skincare',
    subtitle: 'Serums, botanicals, cosmetics, wellness',
    icon: Droplet
  },
  {
    id: 'Art & Handicrafts',
    title: 'Art & Handicrafts',
    subtitle: 'Brassware, wooden craft, artisanal decor',
    icon: Palette
  },
  {
    id: 'Gourmet & Specialty Foods',
    title: 'Gourmet & Foods',
    subtitle: 'Saffron, teas, organic spices, sweets',
    icon: Coffee
  },
  {
    id: 'Electronics & Tech',
    title: 'Electronics & Tech',
    subtitle: 'Audio, mobile accessories, smart gadgets',
    icon: Laptop
  },
  {
    id: 'General Merchandise',
    title: 'General Commerce',
    subtitle: 'Curated goods, lifestyle items, gifts',
    icon: Package
  },
];

export const CategoryStep: React.FC = () => {
  const { data, updateBusiness, nextStep, prevStep } = useOnboarding();

  const handleSelectCategory = (category: string) => {
    updateBusiness({ category });
  };

  const isValid = Boolean(data.business.category);

  return (
    <div className="w-full max-w-2xl text-left animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl sm:text-[48px] font-extrabold tracking-tight text-stone-900 leading-[1.1] mb-4">
          What do you sell?
        </h1>
        <p className="text-lg text-stone-500 font-medium leading-relaxed max-w-xl mb-8">
          Choose the category that best describes your store's primary focus.
        </p>

        {/* Curated List of Horizontal Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10 h-[50vh] min-h-[300px] overflow-y-auto pr-2 pb-4 snap-y custom-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = data.business.category === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all cursor-pointer snap-start hover:shadow-sm ${
                  isSelected
                    ? 'border-stone-900 bg-white ring-1 ring-stone-900 shadow-md transform scale-[1.01]'
                    : 'border-stone-200 bg-stone-50/70 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 shadow-sm'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-[15px] text-stone-900 truncate pr-2">{cat.title}</h3>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-stone-900 flex-shrink-0" />}
                  </div>
                  <p className="text-[13px] text-stone-500 truncate">{cat.subtitle}</p>
                </div>
              </button>
            );
          })}
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
      </motion.div>
    </div>
  );
};

