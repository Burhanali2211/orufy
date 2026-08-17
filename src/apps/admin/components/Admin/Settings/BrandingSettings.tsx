import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { clearStorefrontSettingsCache } from '@/shared/contexts/SettingsContext';
import {
  Palette,
  Image as ImageIcon,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  Megaphone,
  Store,
  Check
} from 'lucide-react';

interface BrandingData {
  name: string;
  logo_url: string;
  announcement_bar: string;
  primary_color: string;
  accent_color: string;
}

const DEFAULT_BRANDING: BrandingData = {
  name: '',
  logo_url: '',
  announcement_bar: 'Complimentary shipping on orders above ₹499',
  primary_color: '#8c7e5a',
  accent_color: '#bfa760',
};

export const BrandingSettings: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BrandingData>(DEFAULT_BRANDING);
  const [logoPreviewError, setLogoPreviewError] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-branding-settings'],
    queryFn: () => apiClient.get('/admin/settings/branding'),
  });

  useEffect(() => {
    if (data && typeof data === 'object') {
      setForm({
        name: data.name || '',
        logo_url: data.logo_url || '',
        announcement_bar: data.announcement_bar || DEFAULT_BRANDING.announcement_bar,
        primary_color: data.primary_color || DEFAULT_BRANDING.primary_color,
        accent_color: data.accent_color || DEFAULT_BRANDING.accent_color,
      });
      setLogoPreviewError(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: BrandingData) => apiClient.post('/admin/settings/branding', payload),
    onSuccess: () => {
      clearStorefrontSettingsCache();
      showSuccess('Branding & logo updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-branding-settings'] });
      queryClient.invalidateQueries({ queryKey: ['store'] });
    },
    onError: (err: any) => {
      showError(err?.message || 'Failed to save branding');
    }
  });

  const deleteLogoMutation = useMutation({
    mutationFn: () => apiClient.delete('/admin/settings/logo'),
    onSuccess: () => {
      clearStorefrontSettingsCache();
      setForm((prev) => ({ ...prev, logo_url: '' }));
      showSuccess('Logo removed. Store is now using clean typography monogram.');
      queryClient.invalidateQueries({ queryKey: ['admin-branding-settings'] });
      queryClient.invalidateQueries({ queryKey: ['store'] });
    },
    onError: (err: any) => {
      showError(err?.message || 'Failed to remove logo');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  const handleRemoveLogo = () => {
    if (window.confirm('Are you sure you want to remove the store logo? Your storefront header will display a clean typographic monogram instead.')) {
      deleteLogoMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-900" />
      </div>
    );
  }

  const initialLetter = (form.name || 'Store').charAt(0).toUpperCase();

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-sm">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Store Logo & Branding</h1>
            <p className="text-stone-500 text-sm mt-0.5">Configure your store logo, brand identity, announcement banner, and color palette.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 transition-all shadow-md disabled:opacity-50"
        >
          {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="md:col-span-7 space-y-6">
          {/* Store Name Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Store className="w-4 h-4 text-stone-700" />
              <h2 className="text-base font-bold text-stone-900">Store Identity</h2>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. EasyIO Luxury Attars"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Logo Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-stone-700" />
                <h2 className="text-base font-bold text-stone-900">Store Logo</h2>
              </div>
              {form.logo_url && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={deleteLogoMutation.isPending}
                  className="text-xs font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Logo
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Logo Image URL
              </label>
              <input
                type="text"
                value={form.logo_url}
                onChange={(e) => {
                  setForm({ ...form, logo_url: e.target.value });
                  setLogoPreviewError(false);
                }}
                placeholder="https://... (or leave empty to use clean typography monogram)"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm font-mono text-xs"
              />
              <p className="text-xs text-stone-500 mt-2">
                Transparent PNG or WebP recommended (approx. 200x50px). If left blank, the store initial badge will be shown automatically.
              </p>
            </div>
          </div>

          {/* Announcement Bar */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Megaphone className="w-4 h-4 text-stone-700" />
              <h2 className="text-base font-bold text-stone-900">Announcement Bar</h2>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Top Strip Message
              </label>
              <input
                type="text"
                value={form.announcement_bar}
                onChange={(e) => setForm({ ...form, announcement_bar: e.target.value })}
                placeholder="e.g. Free expedited shipping on all orders over ₹499"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
              />
            </div>
          </div>

          {/* Brand Colors */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Palette className="w-4 h-4 text-stone-700" />
              <h2 className="text-base font-bold text-stone-900">Brand Colors</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Primary Accent
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-stone-200 cursor-pointer p-1"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Secondary Accent
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-stone-200 cursor-pointer p-1"
                  />
                  <input
                    type="text"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Header & Branding Preview */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Eye className="w-4 h-4 text-stone-700" />
              <h2 className="text-base font-bold text-stone-900">Header Preview</h2>
            </div>

            {/* Simulated Announcement Bar */}
            {form.announcement_bar && (
              <div className="bg-stone-900 text-white text-[11px] font-bold text-center py-2 px-3 rounded-t-xl tracking-wide">
                {form.announcement_bar}
              </div>
            )}

            {/* Simulated Header Navbar */}
            <div className="bg-white border border-stone-200 rounded-b-xl p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {form.logo_url && !logoPreviewError ? (
                    <img
                      src={form.logo_url}
                      alt="Logo Preview"
                      className="h-8 w-auto max-w-[120px] object-contain rounded"
                      onError={() => setLogoPreviewError(true)}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm"
                      style={{ backgroundColor: form.primary_color || '#1c1917' }}
                    >
                      {initialLetter}
                    </div>
                  )}
                  <span className="font-bold text-sm text-stone-900 tracking-tight">
                    {form.name || 'Store Name'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="px-2 py-1 bg-stone-100 rounded-md">Products</span>
                  <span className="px-2 py-1 bg-stone-100 rounded-md">Cart (0)</span>
                </div>
              </div>
            </div>

            {/* Color Swatch Preview */}
            <div className="pt-2 border-t border-stone-100">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Palette Highlights</span>
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-xl border border-stone-200 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg shadow-sm" style={{ backgroundColor: form.primary_color }} />
                  <div>
                    <span className="text-[11px] font-bold text-stone-800 block">Primary</span>
                    <span className="text-[10px] text-stone-500 font-mono">{form.primary_color}</span>
                  </div>
                </div>
                <div className="flex-1 p-3 rounded-xl border border-stone-200 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg shadow-sm" style={{ backgroundColor: form.accent_color }} />
                  <div>
                    <span className="text-[11px] font-bold text-stone-800 block">Accent</span>
                    <span className="text-[10px] text-stone-500 font-mono">{form.accent_color}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingSettings;
