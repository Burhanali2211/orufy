import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { clearStorefrontSettingsCache } from '@/shared/contexts/SettingsContext';
import { ImageUpload } from '@/shared/components/Common/ImageUpload';
import {
  Palette,
  Image as ImageIcon,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  Megaphone,
  Store,
  Globe
} from 'lucide-react';

interface BrandingData {
  name: string;
  logo_url: string;
  favicon_url: string;
  announcement_bar: string;
  primary_color: string;
  accent_color: string;
}

const DEFAULT_BRANDING: BrandingData = {
  name: '',
  logo_url: '',
  favicon_url: '',
  announcement_bar: 'Complimentary shipping on orders above ₹499',
  primary_color: '#8c7e5a',
  accent_color: '#bfa760',
};

export const BrandingSettings: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BrandingData>(DEFAULT_BRANDING);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [faviconPreviewError, setFaviconPreviewError] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-branding-settings'],
    queryFn: () => apiClient.get('/admin/settings/branding'),
  });

  useEffect(() => {
    if (data && typeof data === 'object') {
      setForm({
        name: data.name || '',
        logo_url: data.logo_url || '',
        favicon_url: data.favicon_url || '',
        announcement_bar: data.announcement_bar || DEFAULT_BRANDING.announcement_bar,
        primary_color: data.primary_color || DEFAULT_BRANDING.primary_color,
        accent_color: data.accent_color || DEFAULT_BRANDING.accent_color,
      });
      setLogoPreviewError(false);
      setFaviconPreviewError(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: BrandingData) => apiClient.post('/admin/settings/branding', payload),
    onSuccess: () => {
      clearStorefrontSettingsCache();
      showSuccess('Branding, logo & favicon updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-branding-settings'] });
      queryClient.invalidateQueries({ queryKey: ['store'] });
    },
    onError: (err: Error) => {
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
    onError: (err: Error) => {
      showError(err?.message || 'Failed to remove logo');
    }
  });

  const deleteFaviconMutation = useMutation({
    mutationFn: () => apiClient.delete('/admin/settings/favicon'),
    onSuccess: () => {
      clearStorefrontSettingsCache();
      setForm((prev) => ({ ...prev, favicon_url: '' }));
      showSuccess('Favicon removed.');
      queryClient.invalidateQueries({ queryKey: ['admin-branding-settings'] });
      queryClient.invalidateQueries({ queryKey: ['store'] });
    },
    onError: (err: Error) => {
      showError(err?.message || 'Failed to remove favicon');
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

  const handleRemoveFavicon = () => {
    if (window.confirm('Are you sure you want to remove the store favicon?')) {
      deleteFaviconMutation.mutate();
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
    <div className="space-y-6 sm:space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-md sm:rounded-md p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-stone-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-sans">Store Identity & Branding</h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-0.5 font-medium">Configure your store logo, favicon, brand identity, and announcement banner.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-stone-900 text-white font-bold text-xs sm:text-sm hover:bg-stone-800 transition-all shadow-sm disabled:opacity-50 uppercase tracking-wider"
        >
          {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="md:col-span-7 space-y-6">
          {/* Store Name Card */}
          <div className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4">
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
                className="w-full px-4 py-2.5 rounded-md border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Logo Card */}
          <div className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4">
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
              <ImageUpload
                value={form.logo_url}
                onChange={(url) => {
                  const logoUrl = typeof url === 'function' ? '' : Array.isArray(url) ? url[0] || '' : url;
                  setForm(prev => ({ ...prev, logo_url: logoUrl }));
                  setLogoPreviewError(false);
                }}
                folder="branding/logo"
                label="Upload Store Logo"
                placeholder="Upload logo file (PNG, WebP, SVG)"
                helperText="Transparent PNG or WebP recommended (approx 200x50px). Automatically saved to Cloudflare R2 / Storage."
              />
            </div>
          </div>

          {/* Favicon Card */}
          <div className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-stone-700" />
                <h2 className="text-base font-bold text-stone-900">Store Favicon</h2>
              </div>
              {form.favicon_url && (
                <button
                  type="button"
                  onClick={handleRemoveFavicon}
                  disabled={deleteFaviconMutation.isPending}
                  className="text-xs font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Favicon
                </button>
              )}
            </div>

            <div>
              <ImageUpload
                value={form.favicon_url}
                onChange={(url) => {
                  const favUrl = typeof url === 'function' ? '' : Array.isArray(url) ? url[0] || '' : url;
                  setForm(prev => ({ ...prev, favicon_url: favUrl }));
                  setFaviconPreviewError(false);
                }}
                folder="branding/favicon"
                label="Upload Favicon Image"
                placeholder="Upload favicon icon (.png, .ico, .svg, .webp)"
                helperText="Square image (32x32px or 64x64px). Directly uploaded to Cloudflare R2 and synced across Storefront and Admin tab."
                accept="image/*,.ico"
              />
            </div>
          </div>

          {/* Announcement Bar */}
          <div className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4">
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
                className="w-full px-4 py-2.5 rounded-md border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
              />
            </div>
          </div>

          {/* Brand Colors */}
          <div className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4">
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
                    className="w-10 h-10 rounded-md border border-stone-200 cursor-pointer p-1"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-md border border-stone-200 text-xs font-mono"
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
                    className="w-10 h-10 rounded-md border border-stone-200 cursor-pointer p-1"
                  />
                  <input
                    type="text"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-md border border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Header & Branding Preview */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-stone-200 rounded-md p-6 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Eye className="w-4 h-4 text-stone-700" />
              <h2 className="text-base font-bold text-stone-900">Live Brand Preview</h2>
            </div>

            {/* Browser Tab Mockup */}
            <div className="bg-stone-100 border border-stone-200 rounded-md p-3 shadow-inner">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-2">Browser Tab Favicon</span>
              <div className="bg-white rounded-md p-2.5 border border-stone-200 shadow-sm flex items-center gap-2.5 max-w-[260px]">
                {form.favicon_url && !faviconPreviewError ? (
                  <img
                    src={form.favicon_url}
                    alt="Favicon"
                    className="w-4 h-4 object-contain rounded-sm flex-shrink-0"
                    onError={() => setFaviconPreviewError(true)}
                  />
                ) : (
                  <div className="w-4 h-4 rounded-sm bg-stone-900 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                    {initialLetter}
                  </div>
                )}
                <span className="text-xs font-bold text-stone-800 truncate flex-1">{form.name || 'Store'} — Official Site</span>
                <span className="text-[10px] text-stone-400 font-bold hover:text-stone-600 cursor-pointer">✕</span>
              </div>
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
                <div className="flex-1 p-3 rounded-md border border-stone-200 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg shadow-sm" style={{ backgroundColor: form.primary_color }} />
                  <div>
                    <span className="text-[11px] font-bold text-stone-800 block">Primary</span>
                    <span className="text-[10px] text-stone-500 font-mono">{form.primary_color}</span>
                  </div>
                </div>
                <div className="flex-1 p-3 rounded-md border border-stone-200 flex items-center gap-2">
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
