import React from 'react';

export const ModifiedBadge = () => (
  <span className="px-2.5 py-1 bg-[#fef7e0] text-[#b06000] border border-[#fad2cf] text-[12px] font-medium rounded-full flex items-center gap-1.5">
    <span className="w-1.5 h-1.5 bg-[#f29900] rounded-full" />
    Modified
  </span>
);

export const NotSavedBadge = () => (
  <span className="px-2.5 py-1 bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf] text-[12px] font-medium rounded-full">
    Not Saved
  </span>
);

export const PublicBadge = () => (
  <span className="px-2.5 py-1 bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] text-[12px] font-medium rounded-full">
    Public
  </span>
);

export const FieldWrapper: React.FC<{
  settingKey: string;
  label: string;
  icon?: any;
  isSaved?: boolean;
  isModified: boolean;
  children: React.ReactNode;
}> = ({ settingKey, label, icon: Icon, isSaved, isModified, children }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 flex-wrap mb-1">
      {Icon && <Icon className="h-4 w-4 text-[#5f6368] flex-shrink-0" />}
      <label className="font-medium text-[14px] text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{label}</label>
      <PublicBadge />
      {isSaved === false && !isModified && <NotSavedBadge />}
      {isModified && <ModifiedBadge />}
    </div>
    {children}
  </div>
);

export function formatKey(key: string): string {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function isColorField(key: string): boolean {
  const colorKeywords = ['color', 'primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color', 'button_color', 'cart_button_color', 'cart_button_text_color'];
  return colorKeywords.some(keyword => key.toLowerCase().includes(keyword));
}

export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export const inputCls = (key: string, isModified?: (key: string) => boolean) => `w-full px-4 py-3 border rounded-[24px] focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] focus:border-[#1a73e8] text-[14px] text-[#202124] placeholder-[#5f6368] transition-all ${isModified && isModified(key) ? 'border-[#fad2cf] bg-[#fef7e0]' : 'border-[#e8eaed] bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white'}`;
