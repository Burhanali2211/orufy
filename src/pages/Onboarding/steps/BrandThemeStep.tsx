import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ArrowRight, ArrowLeft, Check, Upload } from 'lucide-react';

/* ── Brand palette ─────────────────────────────────────────── */
const BRAND_PALETTES = [
  { name: 'Noir',       hex: '#1d1d1f', light: '#f5f5f7', label: 'Minimalist luxury' },
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
  const [customHex, setCustomHex] = useState(data.brand.primaryColor || '#1d1d1f');
  const [logoPreview, setLogoPreview] = useState<string | null>(data.brand.logoUrl || null);

  const selectedColor = data.brand.primaryColor || '#1d1d1f';
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
    <div className="space-y-12 animate-fadeIn max-w-xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.08]">
          Your brand's look.
        </h1>
        <p className="text-[15px] text-[#86868b] leading-relaxed">
          Pick a signature color and a typography style that represents your store.
        </p>
      </div>

      {/* ── Color Section ───────────────────────────────────── */}
      <div className="space-y-5">
        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
          Brand Color
        </p>

        {/* Large swatch grid — Apple-style big tactile color orbs */}
        <div className="grid grid-cols-4 gap-3">
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
                {/* Swatch orb */}
                <div
                  className={`relative w-14 h-14 rounded-full transition-all duration-200 flex items-center justify-center
                    ${isSelected
                      ? 'ring-[3px] ring-offset-[3px] ring-offset-[#f5f5f7] shadow-lg scale-105'
                      : 'ring-1 ring-black/[0.08] group-hover:scale-105 group-hover:shadow-md'}
                  `}
                  style={{
                    backgroundColor: pal.hex,
                    ringColor: isSelected ? pal.hex : undefined,
                    boxShadow: isSelected
                      ? `0 0 0 3px #f5f5f7, 0 0 0 5px ${pal.hex}, 0 8px 24px ${pal.hex}40`
                      : undefined,
                  }}
                >
                  {isSelected && (
                    <Check
                      className="w-5 h-5 stroke-[2.5]"
                      style={{ color: pal.hex === '#1d1d1f' || pal.hex === '#3730a3' ? '#fff' : '#fff' }}
                    />
                  )}
                </div>
                {/* Label */}
                <span
                  className={`text-[10px] font-medium transition-colors leading-none ${
                    isSelected ? 'text-[#1d1d1f]' : 'text-[#86868b] group-hover:text-[#1d1d1f]'
                  }`}
                >
                  {pal.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live preview strip */}
        <div
          className="w-full h-11 rounded-2xl flex items-center justify-between px-5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.10)]"
          style={{ backgroundColor: selectedColor }}
        >
          <span className="text-white text-[13px] font-semibold tracking-tight opacity-90">
            {BRAND_PALETTES.find(p => p.hex.toLowerCase() === selectedColor.toLowerCase())?.name ?? 'Custom'}
          </span>
          <span className="text-white/60 font-mono text-[11px] uppercase tracking-widest">
            {selectedColor.toUpperCase()}
          </span>
        </div>

        {/* Custom hex row */}
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-medium text-[#86868b] shrink-0">Custom</label>
          <div className="flex items-center gap-2 bg-white border border-[#d2d2d7] rounded-xl px-3 py-2 shadow-xs flex-1">
            <input
              type="color"
              value={customHex}
              onChange={(e) => handleColorSelect(e.target.value)}
              className="w-5 h-5 rounded-full border-0 cursor-pointer p-0 bg-transparent appearance-none"
              style={{ WebkitAppearance: 'none' } as React.CSSProperties}
            />
            <input
              type="text"
              value={customHex}
              onChange={(e) => handleCustomHex(e.target.value)}
              placeholder="#1D1D1F"
              maxLength={7}
              className="flex-1 text-[13px] font-mono font-medium text-[#1d1d1f] bg-transparent border-0 outline-none uppercase placeholder:text-[#a1a1a6]"
            />
          </div>
        </div>
      </div>

      {/* ── Typography Section ──────────────────────────────── */}
      <div className="space-y-4">
        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
          Typography
        </p>

        <div className="grid grid-cols-3 gap-3">
          {FONT_OPTIONS.map((f) => {
            const isSelected = selectedFont === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => updateBrand({ fontPairing: f.id })}
                className={`relative p-5 rounded-2xl border text-left flex flex-col gap-3 transition-all duration-200 cursor-pointer group active:scale-[0.97]
                  ${isSelected
                    ? 'border-[#0071e3] bg-white shadow-[0_0_0_3px_rgba(0,113,227,0.12)] '
                    : 'border-[#d2d2d7]/70 bg-white hover:border-[#86868b] shadow-xs'}
                `}
              >
                {/* Large specimen letter */}
                <span
                  className="text-5xl leading-none text-[#1d1d1f]"
                  style={f.style}
                >
                  {f.specimen}
                </span>

                <div className="space-y-0.5">
                  <p className="text-[12px] font-semibold text-[#1d1d1f] leading-tight">{f.name}</p>
                  <p className="text-[10px] text-[#86868b] leading-snug">{f.tagline}</p>
                </div>

                {/* Selected check badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#0071e3] flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Brand Logo (Optional) ───────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-[0.08em]">
          Brand Logo <span className="normal-case font-normal tracking-normal">(optional)</span>
        </p>

        <label
          className={`relative flex flex-col items-center justify-center gap-3 w-full h-28 rounded-2xl border-[1.5px] border-dashed cursor-pointer transition-all
            ${logoPreview
              ? 'border-[#0071e3]/40 bg-[#0071e3]/[0.03]'
              : 'border-[#d2d2d7] bg-white hover:border-[#0071e3]/50 hover:bg-[#0071e3]/[0.02]'}
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
              <div className="w-9 h-9 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center">
                <Upload className="w-4 h-4 text-[#86868b]" />
              </div>
              <div className="text-center">
                <p className="text-[12px] font-medium text-[#0071e3]">Upload logo</p>
                <p className="text-[10px] text-[#86868b] mt-0.5">PNG, SVG, or JPG — recommended 512×512</p>
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
            className="text-[11px] text-[#86868b] hover:text-[#ff3b30] transition-colors cursor-pointer"
          >
            Remove logo
          </button>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full font-medium text-[13px] text-[#1d1d1f] bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <button
          type="button"
          onClick={nextStep}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium text-[13px] bg-[#0071e3] text-white hover:bg-[#0077ed] active:bg-[#0062c4] shadow-xs active:scale-[0.98] cursor-pointer transition-all"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
