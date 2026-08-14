import { apiClient } from '@/lib/apiClient';
import React, { useEffect, useState, useRef } from 'react';
import { Save, RefreshCw, Upload, Globe, Mail, Phone, DollarSign, Truck, FileText, Palette, Settings } from 'lucide-react';
import { supabase } from '../../../lib/legacyDb';
import { useNotification } from '../../../contexts/NotificationContext';

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
  is_public: boolean;
}

// Essential settings that should always be available
const ESSENTIAL_SETTINGS = [
  { key: 'site_name', type: 'text', category: 'general', description: 'Website name', is_public: true, icon: Globe, defaultValue: 'AligarhAttarHouse' },
  { key: 'logo_url', type: 'text', category: 'general', description: 'Website logo URL', is_public: true, icon: Upload, defaultValue: '/logo.png' },
  { key: 'site_description', type: 'text', category: 'general', description: 'Website description/meta description', is_public: true, icon: FileText, defaultValue: 'Pure Attars, Oud & Islamic Lifestyle Products from AligarhAttarHouse' },
  { key: 'contact_email', type: 'email', category: 'contact', description: 'Contact email address', is_public: true, icon: Mail, defaultValue: 'support@AligarhAttarHouse.com' },
  { key: 'contact_phone', type: 'text', category: 'contact', description: 'Contact phone number', is_public: true, icon: Phone, defaultValue: '+91-XXXXXXXXXX' },
  { key: 'currency', type: 'text', category: 'general', description: 'Default currency code (e.g., INR, USD)', is_public: true, icon: DollarSign, defaultValue: 'INR' },
  { key: 'free_shipping_threshold', type: 'number', category: 'shipping', description: 'Free shipping above this amount', is_public: true, icon: Truck, defaultValue: '2000' },
  { key: 'copyright_text', type: 'text', category: 'general', description: 'Copyright text for footer', is_public: true, icon: FileText, defaultValue: '© 2024 AligarhAttarHouse. All rights reserved.' },
];

const ModifiedBadge = () => (
  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 text-xs rounded-full flex items-center gap-1">
    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
    Modified
  </span>
);

const NotSavedBadge = () => (
  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs rounded-full">
    Not Saved
  </span>
);

const PublicBadge = () => (
  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 text-xs rounded-full">
    Public
  </span>
);

const FieldWrapper: React.FC<{
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

export const SiteSettingsList: React.FC = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [originalSettings, setOriginalSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/settings/site');
      
      if (data && data.length > 0) {
        setSettings(data);
        setOriginalSettings(JSON.parse(JSON.stringify(data)));
      } else {
        const essentialSettings = ESSENTIAL_SETTINGS.map((s, idx) => ({
          id: `temp-${idx}`,
          setting_key: s.key,
          setting_value: s.defaultValue,
          setting_type: s.type,
          category: s.category,
          description: s.description,
          is_public: s.is_public
        }));
        setSettings(essentialSettings);
        setOriginalSettings([]);
      }
    } catch (error: any) {
      console.error('Error fetching site settings:', error);
      showError('Error Fetching Settings', error.message || 'Failed to fetch site settings');
    } finally {
      setLoading(false);
    }
  };

  const isModified = (key: string): boolean => {
    const current = settings.find(s => s.setting_key === key);
    const original = originalSettings.find(s => s.setting_key === key);
    if (!current) return false;
    if (!original) return true;
    return current.setting_value !== original.setting_value;
  };

  const getModifiedSettings = (): Array<{ key: string; value: string; isNew: boolean }> => {
    const modified: Array<{ key: string; value: string; isNew: boolean }> = [];
    settings.forEach(setting => {
      const original = originalSettings.find(s => s.setting_key === setting.setting_key);
      if (!original || original.setting_value !== setting.setting_value) {
        modified.push({ key: setting.setting_key, value: setting.setting_value, isNew: !original });
      }
    });
    return modified;
  };

  const handleSaveAll = async () => {
    const modified = getModifiedSettings();
    if (modified.length === 0) {
      showError('No Changes', 'No settings have been modified');
      return;
    }
    try {
      setSaving(true);
      for (const { key, value } of modified) {
        const essentialSetting = ESSENTIAL_SETTINGS.find(s => s.key === key);
        await apiClient.post('/admin/settings/site', {
            setting_key: key,
            setting_value: value,
            setting_type: essentialSetting?.type || 'text',
            category: essentialSetting?.category || 'general',
            description: essentialSetting?.description || '',
            is_public: essentialSetting?.is_public ?? true
          }, { onConflict: 'setting_key' });
        
      }
      showSuccess('Settings Saved', `${modified.length} setting(s) saved successfully`);
      await fetchSettings();
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (error: any) {
      console.error('Error saving settings:', error);
      showError('Error Saving Settings', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    const existing = settings.find(s => s.setting_key === key);
    if (existing) {
      setSettings(settings.map(s => s.setting_key === key ? { ...s, setting_value: value } : s));
    } else {
      const essential = ESSENTIAL_SETTINGS.find(s => s.key === key);
      if (essential) {
        const newSetting: SiteSetting = {
          id: '',
          setting_key: key,
          setting_value: value,
          setting_type: essential.type,
          category: essential.category,
          description: essential.description,
          is_public: essential.is_public
        };
        setSettings([...settings, newSetting]);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Please upload an image smaller than 5MB');
      return;
    }
    try {
      setUploading(key);
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}-${Date.now()}.${fileExt}`;
      const filePath = `settings/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, { upsert: true });
      if (uploadError) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          handleChange(key, base64);
          showSuccess('File Loaded', 'Image loaded. Click Save to apply changes.');
        };
        reader.readAsDataURL(file);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath);
      const essentialSetting = ESSENTIAL_SETTINGS.find(s => s.key === key);
      await apiClient.post('/admin/settings/site', {
          setting_key: key,
          setting_value: publicUrl,
          setting_type: essentialSetting?.type || 'text',
          category: essentialSetting?.category || 'general',
          description: essentialSetting?.description || '',
          is_public: true
        }, { onConflict: 'setting_key' });
      
      handleChange(key, publicUrl);
      await fetchSettings();
      showSuccess('Upload Successful', 'Logo uploaded and saved successfully');
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (error: any) {
      console.error('Error uploading file:', error);
      showError('Upload Error', error.message || 'Failed to upload file');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const getEssentialSetting = (key: string, alternativeKey?: string): SiteSetting | null => {
    let existing = settings.find(s => s.setting_key === key);
    if (!existing && alternativeKey) {
      existing = settings.find(s => s.setting_key === alternativeKey);
      if (existing) existing = { ...existing, setting_key: key };
    }
    if (existing) return existing;
    const essential = ESSENTIAL_SETTINGS.find(s => s.key === key);
    if (essential) {
      return {
        id: '',
        setting_key: key,
        setting_value: essential.defaultValue,
        setting_type: essential.type,
        category: essential.category,
        description: essential.description,
        is_public: essential.is_public
      } as SiteSetting;
    }
    return null;
  };

  const isSettingSaved = (key: string): boolean => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? Boolean(setting.id && setting.id !== '') : false;
  };

  const siteName = getEssentialSetting('site_name');
  const logoUrl = getEssentialSetting('logo_url', 'site_logo');
  const siteDescription = getEssentialSetting('site_description');
  const contactEmail = getEssentialSetting('contact_email');
  const contactPhone = getEssentialSetting('contact_phone');
  const currency = getEssentialSetting('currency');
  const freeShippingThreshold = getEssentialSetting('free_shipping_threshold');
  const copyrightText = getEssentialSetting('copyright_text');

  const essentialKeys = ESSENTIAL_SETTINGS.map(s => s.key);
  const otherSettings = settings.filter(s => !essentialKeys.includes(s.setting_key));
  const groupedSettings = otherSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category]?.push(setting);
    return acc;
  }, {} as Record<string, SiteSetting[]>);

  // --- Input class helpers ---
  const inputColor = (key: string) => isModified(key) ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white';
  const inputFocus = 'focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400';
  const inputBase = 'w-full px-3 sm:px-4 py-2.5 border rounded-xl text-sm text-gray-900 placeholder-gray-400 min-h-[44px] transition-colors';
  const inputCls = (key: string) => `${inputBase} ${inputFocus} ${inputColor(key)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="hidden rounded-full h-10 w-10 border-b-2 border-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Site Settings</h2>
            <p className="text-sm text-gray-500 mt-0.5">Configure general website settings</p>
          </div>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Unsaved changes banner */}
      {getModifiedSettings().length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getModifiedSettings().length} setting(s) modified
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Click "Save All Changes" to apply your modifications</p>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {saving ? (
                <><RefreshCw className="h-4 w-4 hidden" /><span>Saving...</span></>
              ) : (
                <><Save className="h-4 w-4" /><span>Save All Changes</span></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Essential Settings */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Essential Website Settings</h3>
          <p className="text-sm text-gray-500 mt-0.5">Configure your website identity and basic information</p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Site Name */}
            {siteName && (
              <FieldWrapper
                settingKey={siteName.setting_key}
                label="Website Name"
                icon={Globe}
                isSaved={isSettingSaved(siteName.setting_key)}
                isModified={isModified(siteName.setting_key)}
              >
                {siteName.description && <p className="text-xs text-gray-500">{siteName.description}</p>}
                <input
                  type="text"
                  value={siteName.setting_value || ''}
                  onChange={(e) => handleChange(siteName.setting_key, e.target.value)}
                  className={inputCls(siteName.setting_key)}
                  placeholder="Enter website name"
                />
              </FieldWrapper>
            )}

            {/* Logo Upload */}
            {logoUrl && (
              <FieldWrapper
                settingKey={logoUrl.setting_key}
                label="Website Logo"
                icon={Upload}
                isSaved={isSettingSaved(logoUrl.setting_key)}
                isModified={isModified(logoUrl.setting_key)}
              >
                {logoUrl.description && <p className="text-xs text-gray-500">{logoUrl.description}</p>}
                <div className="flex flex-col gap-3">
                  {logoUrl.setting_value && (
                    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[80px]">
                      <img
                        src={logoUrl.setting_value.startsWith('/uploads') && !logoUrl.setting_value.startsWith('http')
                          ? `${window.location.origin}${logoUrl.setting_value}`
                          : logoUrl.setting_value}
                        alt="Logo preview"
                        className="h-20 w-auto max-w-full object-contain rounded"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          if (!t.src.includes('data:image/svg')) {
                            t.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';
                          }
                        }}
                      />
                    </div>
                  )}
                  <input ref={logoFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, logoUrl.setting_key)} className="hidden" />
                  <button
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={uploading === logoUrl.setting_key}
                    className="w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-slate-400 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                  >
                    {uploading === logoUrl.setting_key ? (
                      <><RefreshCw className="h-4 w-4 hidden" /><span>Uploading...</span></>
                    ) : (
                      <><Upload className="h-4 w-4" /><span>Upload Logo</span></>
                    )}
                  </button>
                </div>
              </FieldWrapper>
            )}

            {/* Site Description - full width */}
            {siteDescription && (
              <div className="lg:col-span-2">
                <FieldWrapper
                  settingKey={siteDescription.setting_key}
                  label="Website Description"
                  icon={FileText}
                  isSaved={isSettingSaved(siteDescription.setting_key)}
                  isModified={isModified(siteDescription.setting_key)}
                >
                  {siteDescription.description && <p className="text-xs text-gray-500">{siteDescription.description}</p>}
                  <textarea
                    value={siteDescription.setting_value}
                    onChange={(e) => handleChange(siteDescription.setting_key, e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 text-sm text-gray-900 placeholder-gray-400 resize-y transition-colors ${isModified(siteDescription.setting_key) ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                      }`}
                    placeholder="Enter website description"
                    rows={3}
                  />
                </FieldWrapper>
              </div>
            )}

            {/* Contact Email */}
            {contactEmail && (
              <FieldWrapper
                settingKey={contactEmail.setting_key}
                label="Contact Email"
                icon={Mail}
                isSaved={isSettingSaved(contactEmail.setting_key)}
                isModified={isModified(contactEmail.setting_key)}
              >
                {contactEmail.description && <p className="text-xs text-gray-500">{contactEmail.description}</p>}
                <input
                  type="email"
                  value={contactEmail.setting_value}
                  onChange={(e) => handleChange(contactEmail.setting_key, e.target.value)}
                  className={inputCls(contactEmail.setting_key)}
                  placeholder="admin@example.com"
                />
              </FieldWrapper>
            )}

            {/* Contact Phone */}
            {contactPhone && (
              <FieldWrapper
                settingKey={contactPhone.setting_key}
                label="Contact Phone"
                icon={Phone}
                isSaved={isSettingSaved(contactPhone.setting_key)}
                isModified={isModified(contactPhone.setting_key)}
              >
                {contactPhone.description && <p className="text-xs text-gray-500">{contactPhone.description}</p>}
                <input
                  type="text"
                  value={contactPhone.setting_value}
                  onChange={(e) => handleChange(contactPhone.setting_key, e.target.value)}
                  className={inputCls(contactPhone.setting_key)}
                  placeholder="+91-XXXXXXXXXX"
                />
              </FieldWrapper>
            )}

            {/* Currency */}
            {currency && (
              <FieldWrapper
                settingKey={currency.setting_key}
                label="Currency"
                icon={DollarSign}
                isSaved={isSettingSaved(currency.setting_key)}
                isModified={isModified(currency.setting_key)}
              >
                {currency.description && <p className="text-xs text-gray-500">{currency.description}</p>}
                <input
                  type="text"
                  value={currency.setting_value}
                  onChange={(e) => handleChange(currency.setting_key, e.target.value)}
                  className={inputCls(currency.setting_key)}
                  placeholder="INR, USD, EUR, etc."
                />
              </FieldWrapper>
            )}

            {/* Free Shipping Threshold */}
            {freeShippingThreshold && (
              <FieldWrapper
                settingKey={freeShippingThreshold.setting_key}
                label="Free Shipping Threshold"
                icon={Truck}
                isSaved={isSettingSaved(freeShippingThreshold.setting_key)}
                isModified={isModified(freeShippingThreshold.setting_key)}
              >
                {freeShippingThreshold.description && <p className="text-xs text-gray-500">{freeShippingThreshold.description}</p>}
                <input
                  type="number"
                  value={freeShippingThreshold.setting_value}
                  onChange={(e) => handleChange(freeShippingThreshold.setting_key, e.target.value)}
                  className={inputCls(freeShippingThreshold.setting_key)}
                  placeholder="2000"
                />
              </FieldWrapper>
            )}

            {/* Copyright Text - full width */}
            {copyrightText && (
              <div className="lg:col-span-2">
                <FieldWrapper
                  settingKey={copyrightText.setting_key}
                  label="Copyright Text"
                  icon={FileText}
                  isSaved={isSettingSaved(copyrightText.setting_key)}
                  isModified={isModified(copyrightText.setting_key)}
                >
                  {copyrightText.description && <p className="text-xs text-gray-500">{copyrightText.description}</p>}
                  <input
                    type="text"
                    value={copyrightText.setting_value}
                    onChange={(e) => handleChange(copyrightText.setting_key, e.target.value)}
                    className={inputCls(copyrightText.setting_key)}
                    placeholder="© 2024 Your Company. All rights reserved."
                  />
                </FieldWrapper>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional settings by category */}
      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([category, items]) => {
          const isDesignCategory = category.toLowerCase() === 'design';
          const colorItems = items.filter(item => isColorField(item.setting_key));
          const nonColorItems = items.filter(item => !isColorField(item.setting_key));

          return (
            <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                  {isDesignCategory && <Palette className="h-4 w-4 text-slate-500" />}
                  {category}
                </h3>
              </div>

              <div className="p-5">
                {isDesignCategory && colorItems.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Palette className="h-4 w-4 text-slate-500" />
                      Color Settings
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                      {colorItems.map((setting) => (
                        <div key={setting.setting_key} className="flex flex-col gap-2">
                          <FieldWrapper
                            settingKey={setting.setting_key}
                            label={formatKey(setting.setting_key)}
                            isModified={isModified(setting.setting_key)}
                            isSaved={Boolean(setting.id && setting.id !== '')}
                          >
                            {setting.description && <p className="text-xs text-gray-500">{setting.description}</p>}
                            <div className="flex gap-3 items-center">
                              <input
                                type="color"
                                value={isValidHexColor(setting.setting_value) ? setting.setting_value : '#000000'}
                                onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                                className="w-14 h-14 rounded-lg border-2 border-gray-200 cursor-pointer"
                              />
                              <div className="flex-1 flex flex-col gap-1">
                                <input
                                  type="text"
                                  value={setting.setting_value}
                                  onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                                  placeholder="#000000"
                                  className={`${inputCls(setting.setting_key)} font-mono ${!isValidHexColor(setting.setting_value) && setting.setting_value ? 'border-red-300 bg-red-50' : ''}`}
                                />
                                {!isValidHexColor(setting.setting_value) && setting.setting_value && (
                                  <p className="text-xs text-red-500">Invalid hex color format</p>
                                )}
                              </div>
                              {setting.setting_value && isValidHexColor(setting.setting_value) && (
                                <div
                                  className="w-12 h-12 rounded-lg border-2 border-gray-200 flex-shrink-0"
                                  style={{ backgroundColor: setting.setting_value }}
                                />
                              )}
                            </div>
                          </FieldWrapper>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {(isDesignCategory ? nonColorItems : items).map((setting) => (
                    <div key={setting.setting_key} className="flex flex-col gap-2">
                      <FieldWrapper
                        settingKey={setting.setting_key}
                        label={formatKey(setting.setting_key)}
                        isModified={isModified(setting.setting_key)}
                        isSaved={Boolean(setting.id && setting.id !== '')}
                      >
                        {setting.description && <p className="text-xs text-gray-500">{setting.description}</p>}
                        <div className="w-full">
                          {setting.setting_key === 'logo_url' ? (
                            <div className="flex flex-col gap-3">
                              {setting.setting_value && (
                                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                                  <img
                                    src={setting.setting_value.startsWith('/uploads') && !setting.setting_value.startsWith('http')
                                      ? `${window.location.origin}${setting.setting_value}`
                                      : setting.setting_value}
                                    alt="Logo"
                                    className="h-20 w-auto max-w-full object-contain"
                                  />
                                </div>
                              )}
                              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setting.setting_key)} className="hidden" id={`file-input-${setting.setting_key}`} />
                              <button
                                onClick={() => (document.getElementById(`file-input-${setting.setting_key}`) as HTMLInputElement)?.click()}
                                disabled={uploading === setting.setting_key}
                                className="w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-slate-400 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm min-h-[44px] transition-colors"
                              >
                                {uploading === setting.setting_key
                                  ? <><RefreshCw className="h-4 w-4 hidden" /><span>Uploading...</span></>
                                  : <><Upload className="h-4 w-4" /><span>Upload Logo</span></>}
                              </button>
                            </div>
                          ) : setting.setting_type === 'boolean' ? (
                            <select
                              value={setting.setting_value}
                              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                              className={inputCls(setting.setting_key)}
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : setting.setting_type === 'number' ? (
                            <input type="number" value={setting.setting_value} onChange={(e) => handleChange(setting.setting_key, e.target.value)} className={inputCls(setting.setting_key)} />
                          ) : isColorField(setting.setting_key) ? (
                            <div className="flex gap-3 items-center">
                              <input type="color" value={isValidHexColor(setting.setting_value) ? setting.setting_value : '#000000'} onChange={(e) => handleChange(setting.setting_key, e.target.value)} className="w-14 h-14 rounded-lg border-2 border-gray-200 cursor-pointer" />
                              <input type="text" value={setting.setting_value} onChange={(e) => handleChange(setting.setting_key, e.target.value)} placeholder="#000000" className={`${inputCls(setting.setting_key)} font-mono`} />
                            </div>
                          ) : (
                            <input type="text" value={setting.setting_value} onChange={(e) => handleChange(setting.setting_key, e.target.value)} className={inputCls(setting.setting_key)} />
                          )}
                        </div>
                      </FieldWrapper>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button bottom sticky */}
      {getModifiedSettings().length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sticky bottom-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{getModifiedSettings().length} setting(s) modified</p>
              <p className="text-xs text-gray-500 mt-0.5">Click "Save All Changes" to apply your modifications</p>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {saving
                ? <><RefreshCw className="h-4 w-4 hidden" /><span>Saving...</span></>
                : <><Save className="h-4 w-4" /><span>Save All Changes</span></>}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {settings.length === 0 && (
        <div className="text-center py-12 bg-white border-2 border-dashed border-gray-200 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Settings Found</h3>
          <p className="text-gray-500">Site settings will appear here once configured</p>
        </div>
      )}
    </div>
  );
};

function formatKey(key: string): string {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function isColorField(key: string): boolean {
  const colorKeywords = ['color', 'primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color', 'button_color', 'cart_button_color', 'cart_button_text_color'];
  return colorKeywords.some(keyword => key.toLowerCase().includes(keyword));
}

function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}
