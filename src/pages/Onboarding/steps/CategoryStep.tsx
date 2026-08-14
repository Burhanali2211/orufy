import React from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'Perfumes & Fragrances',
    title: 'Perfumes & Fragrances',
    subtitle: 'Attars, concentrated oils, luxury scents',
    icon: '🌸',
  },
  {
    id: 'Fashion & Apparel',
    title: 'Fashion & Apparel',
    subtitle: 'Clothing, ethnic wear, couture, fabrics',
    icon: '👗',
  },
  {
    id: 'Jewelry & Accessories',
    title: 'Jewelry & Accessories',
    subtitle: 'Fine jewelry, silver, necklaces, watches',
    icon: '💎',
  },
  {
    id: 'Beauty & Skincare',
    title: 'Beauty & Skincare',
    subtitle: 'Serums, botanicals, cosmetics, wellness',
    icon: '✨',
  },
  {
    id: 'Art & Handicrafts',
    title: 'Art & Handicrafts',
    subtitle: 'Brassware, wooden craft, artisanal decor',
    icon: '🏺',
  },
  {
    id: 'Gourmet & Specialty Foods',
    title: 'Gourmet & Foods',
    subtitle: 'Saffron, teas, organic spices, sweets',
    icon: '🍃',
  },
  {
    id: 'Electronics & Tech',
    title: 'Electronics & Tech',
    subtitle: 'Audio, mobile accessories, smart gadgets',
    icon: '📱',
  },
  {
    id: 'General Merchandise',
    title: 'General Commerce',
    subtitle: 'Curated goods, lifestyle items, gifts',
    icon: '🛍️',
  },
];

export const CategoryStep: React.FC = () => {
  const { data, updateBusiness, nextStep, prevStep } = useOnboarding();

  const handleSelectCategory = (category: string) => {
    updateBusiness({ category });
  };

  const isValid = Boolean(data.business.category);

  return (
    <div className="space-y-10 animate-fadeIn max-w-2xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.08]">
          What do you sell?
        </h1>
        <p className="text-[15px] text-[#86868b] font-normal leading-relaxed">
          Choose the category that best describes your store's primary focus.
        </p>
      </div>

      {/* Curated Grid of Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {CATEGORIES.map((cat) => {
          const isSelected = data.business.category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer active:scale-[0.98] ${
                isSelected
                  ? 'border-[#0071e3] bg-white ring-4 ring-[#0071e3]/12 shadow-[0_2px_12px_rgba(0,113,227,0.08)]'
                  : 'border-[#d2d2d7]/70 bg-white hover:border-[#86868b] shadow-xs'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-xl shrink-0">
                {cat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm text-[#1d1d1f] truncate">{cat.title}</h3>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#86868b] mt-0.5 leading-relaxed line-clamp-1">{cat.subtitle}</p>
              </div>
            </button>
          );
        })}
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
    </div>
  );
};
