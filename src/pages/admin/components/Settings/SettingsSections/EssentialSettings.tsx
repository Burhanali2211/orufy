import React from 'react';
import { Globe, Upload, FileText, Mail, Phone, DollarSign, Truck, RefreshCw } from 'lucide-react';
import { FieldWrapper } from '../SettingsComponents';

interface EssentialSettingsProps {
  getEssentialSetting: (key: string, alternativeKey?: string) => any;
  isSettingSaved: (key: string) => boolean;
  isModified: (key: string) => boolean;
  handleChange: (key: string, value: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, key: string) => void;
  uploading: string | null;
  inputCls: (key: string) => string;
  logoFileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const EssentialSettings: React.FC<EssentialSettingsProps> = ({
  getEssentialSetting,
  isSettingSaved,
  isModified,
  handleChange,
  handleFileUpload,
  uploading,
  inputCls,
  logoFileInputRef
}) => {
  const siteName = getEssentialSetting('site_name');
  const logoUrl = getEssentialSetting('logo_url', 'site_logo');
  const siteDescription = getEssentialSetting('site_description');
  const contactEmail = getEssentialSetting('contact_email');
  const contactPhone = getEssentialSetting('contact_phone');
  const currency = getEssentialSetting('currency');
  const freeShippingThreshold = getEssentialSetting('free_shipping_threshold');
  const copyrightText = getEssentialSetting('copyright_text');

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Essential Website Settings</h3>
        <p className="text-sm text-gray-500 mt-0.5">Configure your website identity and basic information</p>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {siteName && (
            <FieldWrapper settingKey={siteName.setting_key} label="Website Name" icon={Globe} isSaved={isSettingSaved(siteName.setting_key)} isModified={isModified(siteName.setting_key)}>
              <input type="text" value={siteName.setting_value || ''} onChange={(e) => handleChange(siteName.setting_key, e.target.value)} className={inputCls(siteName.setting_key)} placeholder="Enter website name" />
            </FieldWrapper>
          )}

          {logoUrl && (
            <FieldWrapper settingKey={logoUrl.setting_key} label="Website Logo" icon={Upload} isSaved={isSettingSaved(logoUrl.setting_key)} isModified={isModified(logoUrl.setting_key)}>
              <div className="flex flex-col gap-3">
                {logoUrl.setting_value && (
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[80px]">
                    <img src={logoUrl.setting_value} alt="Logo preview" className="h-20 w-auto max-w-full object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E'; }} />
                  </div>
                )}
                <input ref={logoFileInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, logoUrl.setting_key)} className="hidden" />
                <button onClick={() => logoFileInputRef.current?.click()} disabled={uploading === logoUrl.setting_key} className="w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-slate-400 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm min-h-[44px]">
                  {uploading === logoUrl.setting_key ? <><RefreshCw className="h-4 w-4 hidden" /><span>Uploading...</span></> : <><Upload className="h-4 w-4" /><span>Upload Logo</span></>}
                </button>
              </div>
            </FieldWrapper>
          )}

          {siteDescription && (
            <div className="lg:col-span-2">
              <FieldWrapper settingKey={siteDescription.setting_key} label="Website Description" icon={FileText} isSaved={isSettingSaved(siteDescription.setting_key)} isModified={isModified(siteDescription.setting_key)}>
                <textarea value={siteDescription.setting_value} onChange={(e) => handleChange(siteDescription.setting_key, e.target.value)} className={`w-full px-3 sm:px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 text-sm text-gray-900 placeholder-gray-400 resize-y transition-colors ${isModified(siteDescription.setting_key) ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'}`} placeholder="Enter website description" rows={3} />
              </FieldWrapper>
            </div>
          )}

          {contactEmail && (
            <FieldWrapper settingKey={contactEmail.setting_key} label="Contact Email" icon={Mail} isSaved={isSettingSaved(contactEmail.setting_key)} isModified={isModified(contactEmail.setting_key)}>
              <input type="email" value={contactEmail.setting_value} onChange={(e) => handleChange(contactEmail.setting_key, e.target.value)} className={inputCls(contactEmail.setting_key)} placeholder="admin@example.com" />
            </FieldWrapper>
          )}

          {contactPhone && (
            <FieldWrapper settingKey={contactPhone.setting_key} label="Contact Phone" icon={Phone} isSaved={isSettingSaved(contactPhone.setting_key)} isModified={isModified(contactPhone.setting_key)}>
              <input type="text" value={contactPhone.setting_value} onChange={(e) => handleChange(contactPhone.setting_key, e.target.value)} className={inputCls(contactPhone.setting_key)} placeholder="+91-XXXXXXXXXX" />
            </FieldWrapper>
          )}

          {currency && (
            <FieldWrapper settingKey={currency.setting_key} label="Currency" icon={DollarSign} isSaved={isSettingSaved(currency.setting_key)} isModified={isModified(currency.setting_key)}>
              <input type="text" value={currency.setting_value} onChange={(e) => handleChange(currency.setting_key, e.target.value)} className={inputCls(currency.setting_key)} placeholder="INR, USD, EUR, etc." />
            </FieldWrapper>
          )}

          {freeShippingThreshold && (
            <FieldWrapper settingKey={freeShippingThreshold.setting_key} label="Free Shipping Threshold" icon={Truck} isSaved={isSettingSaved(freeShippingThreshold.setting_key)} isModified={isModified(freeShippingThreshold.setting_key)}>
              <input type="number" value={freeShippingThreshold.setting_value} onChange={(e) => handleChange(freeShippingThreshold.setting_key, e.target.value)} className={inputCls(freeShippingThreshold.setting_key)} placeholder="2000" />
            </FieldWrapper>
          )}

          {copyrightText && (
            <div className="lg:col-span-2">
              <FieldWrapper settingKey={copyrightText.setting_key} label="Copyright Text" icon={FileText} isSaved={isSettingSaved(copyrightText.setting_key)} isModified={isModified(copyrightText.copyrightText)}>
                <input type="text" value={copyrightText.setting_value} onChange={(e) => handleChange(copyrightText.setting_key, e.target.value)} className={inputCls(copyrightText.setting_key)} placeholder="© 2024 Your Company. All rights reserved." />
              </FieldWrapper>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

