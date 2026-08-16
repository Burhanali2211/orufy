import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { ImageUpload } from '@/shared/components/Common/ImageUpload';

const BRAND_PALETTES = [
  { name: 'Antique Gold', hex: '#8c7e5a' },
  { name: 'Deep Emerald', hex: '#0f766e' },
  { name: 'Midnight Charcoal', hex: '#1c1917' },
  { name: 'Royal Crimson', hex: '#be123c' },
  { name: 'Classic Indigo', hex: '#3730a3' },
  { name: 'Warm Terracotta', hex: '#c2410c' },
];

export const BrandStep: React.FC = () => {
  const { data, updateBrand, nextStep, prevStep } = useOnboarding();
  const [customHex, setCustomHex] = useState(data.brand.primaryColor || '#8c7e5a');

  const handleColorChange = (hex: string) => {
    setCustomHex(hex);
    updateBrand({ primaryColor: hex });
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Title & One Main Idea */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
          Choose your brand look.
        </h1>
        <p className="text-sm sm:text-base text-stone-500 font-normal leading-relaxed">
          Select a signature color theme for your storefront buttons, badges, and accents.
        </p>
      </div>

      {/* Palette Selection Grid */}
      <div className="space-y-4">
        <label className="block text-xs font-bold text-stone-900 uppercase tracking-widest">
          Color Palette
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BRAND_PALETTES.map((pal) => {
            const isSelected = (data.brand.primaryColor || '').toLowerCase() === pal.hex.toLowerCase();
            return (
              <button
                key={pal.hex}
                type="button"
                onClick={() => handleColorChange(pal.hex)}
                className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'border-stone-900 bg-white ring-2 ring-stone-900/10 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-2xs shrink-0"
                  style={{ backgroundColor: pal.hex }}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <span className="font-bold text-xs text-stone-900 truncate">{pal.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Hex Selector */}
        <div className="pt-2 flex items-center gap-3">
          <span className="text-xs font-medium text-stone-500">Custom hex:</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customHex}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-7 h-7 rounded-lg border border-stone-200 cursor-pointer p-0.5 bg-white"
            />
            <input
              type="text"
              value={customHex}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#8C7E5A"
              className="w-24 px-2.5 py-1 text-xs font-mono font-bold text-stone-900 bg-white border border-stone-200 rounded-lg uppercase"
            />
          </div>
        </div>
      </div>

      {/* Store Logo (Optional) */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-stone-900 uppercase tracking-widest">
          Store Logo <span className="text-stone-400 font-normal normal-case">(Optional)</span>
        </label>
        <ImageUpload
          value={data.brand.logoUrl}
          onChange={(url) => updateBrand({ logoUrl: (url as string) || '' })}
          folder="logos"
          aspectRatio="square"
          label="Upload Brand Logo"
        />
      </div>

      {/* Navigation Actions */}
      <div className="pt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex items-center gap-1.5 px-6 py-3.5 rounded-full font-bold text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all active:scale-98 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={nextStep}
          className="inline-flex items-center gap-2 px-9 py-4 rounded-full font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 shadow-md shadow-stone-900/10 active:scale-98 cursor-pointer transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
