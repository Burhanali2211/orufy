import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/apiClient';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { clearStorefrontSettingsCache } from '@/shared/contexts/SettingsContext';
import {
  Phone,
  Mail,
  MapPin,
  Save,
  RefreshCw,
  Share2,
  DollarSign,
  ShieldCheck,
  Building,
  ArrowRight
} from 'lucide-react';

interface StoreDetailsForm {
  email: string;
  phone: string;
  address: string;
  currency: string;
  taxRatePct: number;
  freeShippingThresholdPaise: number;
  instagram: string;
  whatsapp: string;
  facebook: string;
  twitter: string;
}

export const StoreDetailsSettings: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<StoreDetailsForm>({
    email: '',
    phone: '',
    address: '',
    currency: 'INR',
    taxRatePct: 18,
    freeShippingThresholdPaise: 49900,
    instagram: '',
    whatsapp: '',
    facebook: '',
    twitter: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-store-details'],
    queryFn: () => apiClient.get('/admin/settings/contact').then(res => res?.data || res || {}),
  });

  useEffect(() => {
    if (data && typeof data === 'object') {
      setForm((prev) => ({
        ...prev,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        currency: data.currency || 'INR',
        taxRatePct: data.taxRatePct ?? 18,
        freeShippingThresholdPaise: data.freeShippingThresholdPaise ?? 49900,
        instagram: data.instagram || '',
        whatsapp: data.whatsapp || '',
        facebook: data.facebook || '',
        twitter: data.twitter || '',
      }));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: StoreDetailsForm) => apiClient.post('/admin/settings/contact', payload),
    onSuccess: () => {
      clearStorefrontSettingsCache();
      showSuccess('Store contact & social details saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-store-details'] });
    },
    onError: (err: any) => {
      showError(err?.message || 'Failed to save store details');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 font-serif">Store Details & Contact</h1>
            <p className="text-stone-500 text-sm mt-0.5">Manage your customer support channels, business address, and social links.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {saveMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Details</span>
            </>
          )}
        </button>
      </div>

      {/* Customer Support & Contact Info */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-stone-700" />
            Customer Support Channels
          </h2>
          <p className="text-xs text-stone-500 mt-1">Displayed in your storefront footer and customer order receipts.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Support Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="support@yourbrand.com"
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Customer Support Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
            Physical Store / Business Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. 104 Heritage Lane, Connaught Place, New Delhi, India"
              className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Social Profiles */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-stone-700" />
            Social Media & WhatsApp
          </h2>
          <p className="text-xs text-stone-500 mt-1">Connect your brand's social profiles to footer icons and customer share widgets.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Instagram Profile URL
            </label>
            <input
              type="url"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="https://instagram.com/yourstore"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              WhatsApp Support Number
            </label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="919876543210 (Country code + number)"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Facebook Page URL
            </label>
            <input
              type="url"
              value={form.facebook}
              onChange={(e) => setForm({ ...form, facebook: e.target.value })}
              placeholder="https://facebook.com/yourstore"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              X / Twitter Profile URL
            </label>
            <input
              type="url"
              value={form.twitter}
              onChange={(e) => setForm({ ...form, twitter: e.target.value })}
              placeholder="https://x.com/yourstore"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Commerce Defaults */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-stone-700" />
            Commerce & Shipping Thresholds
          </h2>
          <p className="text-xs text-stone-500 mt-1">Configure baseline shipping and GST/tax calculations.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Currency Code
            </label>
            <input
              type="text"
              value={form.currency}
              disabled
              className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-sm font-bold text-stone-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              GST / Tax Rate (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.taxRatePct}
              onChange={(e) => setForm({ ...form, taxRatePct: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Free Shipping Threshold (₹)
            </label>
            <input
              type="number"
              min={0}
              value={form.freeShippingThresholdPaise / 100}
              onChange={(e) => setForm({ ...form, freeShippingThresholdPaise: Number(e.target.value) * 100 })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all"
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default StoreDetailsSettings;
