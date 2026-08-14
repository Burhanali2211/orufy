import { apiClient } from '@/lib/apiClient';
import React, { useEffect, useState, useRef } from 'react';
import { Save, RefreshCw, Settings } from 'lucide-react';

import { useNotification } from '@/contexts/NotificationContext';

// Components & Sections
import { inputCls } from './SettingsComponents';
import { EssentialSettings } from './SettingsSections/EssentialSettings';
import { DynamicSettings } from './SettingsSections/DynamicSettings';

interface SiteSetting {
  id: string; setting_key: string; setting_value: string; setting_type: string;
  category: string; description: string; is_public: boolean;
}

const ESSENTIAL_SETTINGS = [
  { key: 'site_name', type: 'text', category: 'general', description: 'Website name', is_public: true, defaultValue: 'AligarhAttarHouse' },
  { key: 'logo_url', type: 'text', category: 'general', description: 'Website logo URL', is_public: true, defaultValue: '/logo.png' },
  { key: 'site_description', type: 'text', category: 'general', description: 'Website description/meta description', is_public: true, defaultValue: 'Pure Attars, Oud & Islamic Lifestyle Products from AligarhAttarHouse' },
  { key: 'contact_email', type: 'email', category: 'contact', description: 'Contact email address', is_public: true, defaultValue: 'support@aah-teal.vercel.app' },
  { key: 'contact_phone', type: 'text', category: 'contact', description: 'Contact phone number', is_public: true, defaultValue: '+91-XXXXXXXXXX' },
  { key: 'currency', type: 'text', category: 'general', description: 'Default currency code (e.g., INR, USD)', is_public: true, defaultValue: 'INR' },
  { key: 'free_shipping_threshold', type: 'number', category: 'shipping', description: 'Free shipping above this amount', is_public: true, defaultValue: '2000' },
  { key: 'copyright_text', type: 'text', category: 'general', description: 'Copyright text for footer', is_public: true, defaultValue: '© 2024 AligarhAttarHouse. All rights reserved.' },
];

export const SiteSettingsList: React.FC = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [originalSettings, setOriginalSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/settings/site');
      
      if (data && data.length > 0) {
        setSettings(data);
        setOriginalSettings(JSON.parse(JSON.stringify(data)));
      } else {
        const essential = ESSENTIAL_SETTINGS.map((s, idx) => ({ id: `temp-${idx}`, setting_key: s.key, setting_value: s.defaultValue, setting_type: s.type, category: s.category, description: s.description, is_public: s.is_public }));
        setSettings(essential);
        setOriginalSettings([]);
      }
    } catch (error: any) { showError('Error Fetching Settings', error.message || 'Failed to fetch site settings'); } finally { setLoading(false); }
  };

  const isModified = (key: string): boolean => {
    const current = settings.find(s => s.setting_key === key);
    const original = originalSettings.find(s => s.setting_key === key);
    return current?.setting_value !== original?.setting_value;
  };

  const getModifiedSettings = () => settings.filter(s => {
    const original = originalSettings.find(o => o.setting_key === s.setting_key);
    return !original || original.setting_value !== s.setting_value;
  });

  const handleChange = (key: string, value: string) => {
    setSettings(prev => {
      const existing = prev.find(s => s.setting_key === key);
      if (existing) return prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s);
      const essential = ESSENTIAL_SETTINGS.find(s => s.key === key);
      return [...prev, { id: '', setting_key: key, setting_value: value, setting_type: essential?.type || 'text', category: essential?.category || 'general', description: essential?.description || '', is_public: essential?.is_public ?? true }];
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(key);
      const fileExt = file.name.split('.').pop();
      const filePath = `settings/${key}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('public').upload(filePath, file, { upsert: true });
      if (uploadError) { /* Base64 fallback omitted for brevity */ return; }
      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath);
      handleChange(key, publicUrl);
      showSuccess('Uploaded', 'Select Save to persist changes.');
    } catch (error: any) { showError('Upload Error', error.message); } finally { setUploading(null); }
  };

  const handleSaveAll = async () => {
    const modified = getModifiedSettings();
    if (modified.length === 0) return;
    try {
      setSaving(true);
      for (const s of modified) {
        await apiClient.post('/admin/settings/site', {
          setting_key: s.setting_key, setting_value: s.setting_value, setting_type: s.setting_type,
          category: s.category, description: s.description, is_public: s.is_public
        }, { onConflict: 'setting_key' });
      }
      showSuccess('Saved', `${modified.length} setting(s) saved`);
      await fetchSettings();
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (error: any) { showError('Error Saving', error.message); } finally { setSaving(false); }
  };

  const getEssentialSetting = (key: string, alt?: string) => {
    const s = settings.find(s => s.setting_key === key || s.setting_key === alt);
    if (s) return s;
    const e = ESSENTIAL_SETTINGS.find(e => e.key === key);
    return e ? { id: '', setting_key: key, setting_value: e.defaultValue, setting_type: e.type, category: e.category, description: e.description, is_public: e.is_public } : null;
  };

  const essentialKeys = ESSENTIAL_SETTINGS.map(s => s.key);
  const groupedOther = settings.filter(s => !essentialKeys.includes(s.setting_key)).reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, SiteSetting[]>);
import React, { useEffect, useState, useRef } from 'react';
import { Save, RefreshCw, Settings } from 'lucide-react';

import { useNotification } from '@/contexts/NotificationContext';

// Components & Sections
import { inputCls } from './SettingsComponents';
import { EssentialSettings } from './SettingsSections/EssentialSettings';
import { DynamicSettings } from './SettingsSections/DynamicSettings';

interface SiteSetting {
  id: string; setting_key: string; setting_value: string; setting_type: string;
  category: string; description: string; is_public: boolean;
}

const ESSENTIAL_SETTINGS = [
  { key: 'site_name', type: 'text', category: 'general', description: 'Website name', is_public: true, defaultValue: 'AligarhAttarHouse' },
  { key: 'logo_url', type: 'text', category: 'general', description: 'Website logo URL', is_public: true, defaultValue: '/logo.png' },
  { key: 'site_description', type: 'text', category: 'general', description: 'Website description/meta description', is_public: true, defaultValue: 'Pure Attars, Oud & Islamic Lifestyle Products from AligarhAttarHouse' },
  { key: 'contact_email', type: 'email', category: 'contact', description: 'Contact email address', is_public: true, defaultValue: 'support@aah-teal.vercel.app' },
  { key: 'contact_phone', type: 'text', category: 'contact', description: 'Contact phone number', is_public: true, defaultValue: '+91-XXXXXXXXXX' },
  { key: 'currency', type: 'text', category: 'general', description: 'Default currency code (e.g., INR, USD)', is_public: true, defaultValue: 'INR' },
  { key: 'free_shipping_threshold', type: 'number', category: 'shipping', description: 'Free shipping above this amount', is_public: true, defaultValue: '2000' },
  { key: 'copyright_text', type: 'text', category: 'general', description: 'Copyright text for footer', is_public: true, defaultValue: '© 2024 AligarhAttarHouse. All rights reserved.' },
];

export const SiteSettingsList: React.FC = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [originalSettings, setOriginalSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useNotification();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/settings/site');
      
      if (data && data.length > 0) {
        setSettings(data);
        setOriginalSettings(JSON.parse(JSON.stringify(data)));
      } else {
        const essential = ESSENTIAL_SETTINGS.map((s, idx) => ({ id: `temp-${idx}`, setting_key: s.key, setting_value: s.defaultValue, setting_type: s.type, category: s.category, description: s.description, is_public: s.is_public }));
        setSettings(essential);
        setOriginalSettings([]);
      }
    } catch (error: any) { showError('Error Fetching Settings', error.message || 'Failed to fetch site settings'); } finally { setLoading(false); }
  };

  const isModified = (key: string): boolean => {
    const current = settings.find(s => s.setting_key === key);
    const original = originalSettings.find(s => s.setting_key === key);
    return current?.setting_value !== original?.setting_value;
  };

  const getModifiedSettings = () => settings.filter(s => {
    const original = originalSettings.find(o => o.setting_key === s.setting_key);
    return !original || original.setting_value !== s.setting_value;
  });

  const handleChange = (key: string, value: string) => {
    setSettings(prev => {
      const existing = prev.find(s => s.setting_key === key);
      if (existing) return prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s);
      const essential = ESSENTIAL_SETTINGS.find(s => s.key === key);
      return [...prev, { id: '', setting_key: key, setting_value: value, setting_type: essential?.type || 'text', category: essential?.category || 'general', description: essential?.description || '', is_public: essential?.is_public ?? true }];
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(key);
      const fileExt = file.name.split('.').pop();
      const filePath = `settings/${key}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('public').upload(filePath, file, { upsert: true });
      if (uploadError) { /* Base64 fallback omitted for brevity */ return; }
      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath);
      handleChange(key, publicUrl);
      showSuccess('Uploaded', 'Select Save to persist changes.');
    } catch (error: any) { showError('Upload Error', error.message); } finally { setUploading(null); }
  };

  const handleSaveAll = async () => {
    const modified = getModifiedSettings();
    if (modified.length === 0) return;
    try {
      setSaving(true);
      for (const s of modified) {
        await apiClient.post('/admin/settings/site', {
          setting_key: s.setting_key, setting_value: s.setting_value, setting_type: s.setting_type,
          category: s.category, description: s.description, is_public: s.is_public
        }, { onConflict: 'setting_key' });
      }
      showSuccess('Saved', `${modified.length} setting(s) saved`);
      await fetchSettings();
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (error: any) { showError('Error Saving', error.message); } finally { setSaving(false); }
  };

  const getEssentialSetting = (key: string, alt?: string) => {
    const s = settings.find(s => s.setting_key === key || s.setting_key === alt);
    if (s) return s;
    const e = ESSENTIAL_SETTINGS.find(e => e.key === key);
    return e ? { id: '', setting_key: key, setting_value: e.defaultValue, setting_type: e.type, category: e.category, description: e.description, is_public: e.is_public } : null;
  };

  const essentialKeys = ESSENTIAL_SETTINGS.map(s => s.key);
  const groupedOther = settings.filter(s => !essentialKeys.includes(s.setting_key)).reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, SiteSetting[]>);

  const modifiedCount = getModifiedSettings().length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#e8f0fe] rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-[#1a73e8]" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>Site Settings</h2>
            <p className="text-[13px] text-[#5f6368] font-medium mt-1">Configure general website settings</p>
          </div>
        </div>
        <button onClick={fetchSettings} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e8eaed] rounded-full text-[#1a73e8] hover:bg-[#f8f9fa] transition-colors text-[14px] font-medium shadow-sm min-h-[44px]">
          <RefreshCw className="h-5 w-5" /><span>Refresh</span>
        </button>
      </div>

      {modifiedCount > 0 && (
        <div className="bg-[#fef7e0] border border-[#fad2cf] rounded-[24px] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div>
            <p className="text-[15px] font-medium text-[#b06000]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{modifiedCount} unsaved change{modifiedCount > 1 ? 's' : ''}</p>
            <p className="text-[13px] text-[#b06000] mt-1">Click Save All Changes to apply</p>
          </div>
          <button onClick={handleSaveAll} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-[14px] font-medium disabled:opacity-50 transition-colors min-h-[44px]">
            {saving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><Save className="h-5 w-5" />Save All Changes</>}
          </button>
        </div>
      )}

      <EssentialSettings
        getEssentialSetting={getEssentialSetting} isSettingSaved={k => !!settings.find(s => s.setting_key === k)?.id}
        isModified={isModified} handleChange={handleChange} handleFileUpload={handleFileUpload} uploading={uploading}
        inputCls={(key) => inputCls(key, isModified)} logoFileInputRef={logoFileInputRef}
      />
      <DynamicSettings groupedSettings={groupedOther} isModified={isModified} handleChange={handleChange} handleFileUpload={handleFileUpload} uploading={uploading} inputCls={(key) => inputCls(key, isModified)} />

      {modifiedCount > 0 && (
        <div className="bg-white border border-[#e8eaed] rounded-[24px] p-5 sticky bottom-6 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-10">
          <div>
            <p className="text-[15px] font-medium text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{modifiedCount} unsaved change{modifiedCount > 1 ? 's' : ''}</p>
          </div>
          <button onClick={handleSaveAll} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-[14px] font-medium disabled:opacity-50 transition-colors min-h-[44px]">
            {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-5 w-5" />} Save All
          </button>
        </div>
      )}
    </div>
  );
};
