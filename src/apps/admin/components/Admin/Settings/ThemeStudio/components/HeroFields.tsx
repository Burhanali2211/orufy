import React from 'react';
import { ImagePlus } from 'lucide-react';
import { apiClient } from '@/shared/lib/apiClient';

/* ─── Reusable hero image field (upload + URL + preview) ─── */
export const HeroImageField: React.FC<{ label: string; value: string; onChange: (url: string) => void }> = ({ label, value, onChange }) => {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'hero');
      const res = await apiClient.upload<{ url?: string }>('/admin/upload', fd);
      if (res?.url) onChange(res.url);
    } catch {
      const reader = new FileReader();
      reader.onload = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };
  return (
    <div>
      <label className="block text-[10px] font-bold text-stone-700 mb-0.5">{label}</label>
      <div className="flex gap-1.5">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste URL or upload" className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono min-w-0" />
        <label className="flex items-center gap-1 px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer hover:bg-stone-700 transition-colors shrink-0" title="Upload from device">
          <ImagePlus className="w-3.5 h-3.5" />
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>
      {value && <img src={value} alt="preview" className="mt-2 w-full h-20 object-cover rounded-lg border border-stone-200" />}
    </div>
  );
};

/* ─── Reusable hero text fields (badge / headline / subtitle) ─── */
export const HeroTextFields: React.FC<{ badge: string; headline: string; subtitle: string; onBadge: (v: string) => void; onHeadline: (v: string) => void; onSubtitle: (v: string) => void }> = ({ badge, headline, subtitle, onBadge, onHeadline, onSubtitle }) => (
  <>
    <div>
      <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Badge Text</label>
      <input type="text" value={badge} onChange={(e) => onBadge(e.target.value)} placeholder="e.g. New Collection" className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium" />
    </div>
    <div>
      <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Headline</label>
      <input type="text" value={headline} onChange={(e) => onHeadline(e.target.value)} placeholder="e.g. Pure Artisanal Fragrances" className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold" />
    </div>
    <div>
      <label className="block text-[10px] font-bold text-stone-700 mb-0.5">Subtitle</label>
      <textarea rows={2} value={subtitle} onChange={(e) => onSubtitle(e.target.value)} className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs resize-none" />
    </div>
  </>
);
