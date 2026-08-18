import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft, CheckCircle2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Brand palette ─────────────────────────────────────────── */
const BRAND_PALETTES = [
  { name: 'Noir',       hex: '#09090b', light: '#f4f4f5', label: 'Minimalist luxury' },
  { name: 'Gold',       hex: '#92784c', light: '#faf8f2', label: 'Artisanal heritage' },
  { name: 'Emerald',    hex: '#0d7a6b', light: '#f0faf8', label: 'Botanical & organic' },
  { name: 'Crimson',    hex: '#be123c', light: '#fff1f2', label: 'Bold & couture' },
  { name: 'Indigo',     hex: '#3730a3', light: '#eef2ff', label: 'Modern & trusted' },
  { name: 'Terracotta', hex: '#c2410c', light: '#fff7ed', label: 'Earthy & warm' },
  { name: 'Slate',      hex: '#475569', light: '#f8fafc', label: 'Professional calm' },
  { name: 'Rose',       hex: '#be185d', light: '#fdf2f8', label: 'Feminine & vibrant' },
];

/* ── Typography specimens ──────────────────────────────────── */
const FONT_OPTIONS = [
  {
    id: 'sans',
    name: 'Modern Sans',
    specimen: 'Aa',
    style: { fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500 },
    tagline: 'Clean · Digital · Approachable',
  },
  {
    id: 'serif',
    name: 'Editorial Serif',
    specimen: 'Aa',
    style: { fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 },
    tagline: 'Timeless · Luxe · Bespoke',
  },
  {
    id: 'mono',
    name: 'Precision Mono',
    specimen: 'Aa',
    style: { fontFamily: "'Courier New', Courier, monospace", fontWeight: 600 },
    tagline: 'Technical · Structured · Precise',
  },
];

export const BrandThemeStep: React.FC = () => {
  const { data, updateBrand, nextStep, prevStep } = useOnboarding();
  const [customHex, setCustomHex] = useState(data.brand.primaryColor || '#09090b');
  const [logoPreview, setLogoPreview] = useState<string | null>(data.brand.logoUrl || null);

  const selectedColor = data.brand.primaryColor || '#09090b';
  const selectedFont = data.brand.fontPairing || 'sans';

  const handleColorSelect = (hex: string) => {
    setCustomHex(hex);
    updateBrand({ primaryColor: hex });
  };

  const handleCustomHex = (val: string) => {
    setCustomHex(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      updateBrand({ primaryColor: val });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setLogoPreview(url);
      updateBrand({ logoUrl: url });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-2xl text-left animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl sm:text-[48px] font-extrabold tracking-tight text-stone-900 leading-[1.1] mb-4">
          Your brand's look.
        </h1>
        <p className="text-lg text-stone-500 font-medium leading-relaxed max-w-xl mb-12">
          Pick a signature color and a typography style that represents your store.
        </p>

        {/* ── Color Section ───────────────────────────────────── */}
        <div className="space-y-5 mb-10">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Brand Color
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {BRAND_PALETTES.map((pal) => {
              const isSelected = selectedColor.toLowerCase() === pal.hex.toLowerCase();
              return (
                <button
                  key={pal.hex}
                  type="button"
                  onClick={() => handleColorSelect(pal.hex)}
                  title={pal.name}
                  className="group flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div
                    className={`relative w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center
                      ${isSelected
                        ? 'ring-2 ring-offset-2 ring-stone-900 scale-110 shadow-sm'
                        : 'ring-1 ring-stone-200 group-hover:scale-105 group-hover:shadow-sm'}
                    `}
                    style={{ backgroundColor: pal.hex }}
                  >
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom hex row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6">
            <div className="w-full sm:w-1/2 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
              <input
                type="color"
                value={customHex}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-6 h-6 rounded-full border-0 cursor-pointer p-0 bg-transparent appearance-none"
                style={{ WebkitAppearance: 'none' } as React.CSSProperties}
              />
              <input
                type="text"
                value={customHex}
                onChange={(e) => handleCustomHex(e.target.value)}
                placeholder="#1D1D1F"
                maxLength={7}
                className="flex-1 text-sm font-mono font-bold text-stone-900 bg-transparent border-0 outline-none uppercase placeholder:text-stone-400"
              />
            </div>
            
            <div
              className="w-full sm:w-1/2 h-12 rounded-xl flex items-center justify-between px-5 transition-all duration-300 shadow-sm border border-stone-200/50"
              style={{ backgroundColor: selectedColor }}
            >
              <span className="text-white text-sm font-bold tracking-tight">
                Preview
              </span>
              <span className="text-white/80 font-mono text-xs uppercase tracking-widest">
                {selectedColor}
              </span>
            </div>
          </div>
        </div>

        {/* ── Typography Section ──────────────────────────────── */}
        <div className="space-y-4 mb-10">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Typography
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FONT_OPTIONS.map((f) => {
              const isSelected = selectedFont === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => updateBrand({ fontPairing: f.id })}
                  className={`relative p-5 rounded-2xl border text-left flex flex-col gap-3 transition-all duration-200 cursor-pointer group active:scale-[0.97]
                    ${isSelected
                      ? 'border-stone-900 bg-white ring-1 ring-stone-900'
                      : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'}
                  `}
                >
                  <span className="text-5xl leading-none text-stone-900" style={f.style}>
                    {f.specimen}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-stone-900 mb-0.5">{f.name}</p>
                    <p className="text-[11px] text-stone-500 font-medium">{f.tagline}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="w-5 h-5 text-stone-900" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Brand Logo (Optional) ───────────────────────────── */}
        <div className="space-y-4 mb-12">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Brand Logo <span className="normal-case font-medium text-stone-400 tracking-normal">(optional)</span>
          </p>

          <label
            className={`relative flex flex-col items-center justify-center gap-3 w-full h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all
              ${logoPreview
                ? 'border-stone-900 bg-stone-50'
                : 'border-stone-300 bg-stone-50/50 hover:border-stone-400 hover:bg-stone-100'}
            `}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Brand logo"
                className="h-16 w-auto object-contain rounded-lg"
              />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-stone-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-stone-900">Upload logo</p>
                  <p className="text-xs text-stone-500 font-medium mt-1">PNG, SVG, or JPG (max 2MB)</p>
                </div>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="sr-only"
            />
          </label>

          {logoPreview && (
            <button
              type="button"
              onClick={() => { setLogoPreview(null); updateBrand({ logoUrl: '' }); }}
              className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer"
            >
              Remove logo
            </button>
          )}
        </div>

        {/* ── Navigation ─────────────────────────────────────── */}
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
