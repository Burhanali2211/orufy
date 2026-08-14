import React from 'react';

export const ModifiedBadge = () => (
  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 text-xs rounded-full flex items-center gap-1">
    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
    Modified
  </span>
);

export const NotSavedBadge = () => (
  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs rounded-full">
    Not Saved
  </span>
);

export const PublicBadge = () => (
  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 text-xs rounded-full">
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
    <div className="flex items-center gap-2 flex-wrap">
      {Icon && <Icon className="h-4 w-4 text-slate-500 flex-shrink-0" />}
      <label className="font-medium text-sm text-gray-900">{label}</label>
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

export const inputCls = (key: string, isModified?: (key: string) => boolean) => `w-full px-3 sm:px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 text-sm text-gray-900 placeholder-gray-400 transition-colors ${isModified && isModified(key) ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'}`;

