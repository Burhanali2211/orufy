import React from 'react';
import { useOnboarding } from '../OnboardingContext';
import { SettingsProvider, PublicSettings } from '../../../contexts/SettingsContext';
import HomePage from '../../HomePage';
import { Layout } from '../../../components/Layout/Layout';

// Mock Provider to intercept getSiteSetting
const MockSettingsProvider: React.FC<{ children: React.ReactNode; mockData: any }> = ({ children, mockData }) => {
  const mockSettings: PublicSettings = {
    siteSettings: [
      { setting_key: 'site_name', setting_value: mockData.business.name, setting_type: 'string', category: 'general', description: '' },
      { setting_key: 'logo_url', setting_value: mockData.brand.logoUrl || '', setting_type: 'string', category: 'general', description: '' },
    ],
    config: {
      identity: {
        name: mockData.business.name || 'Store',
        siteName: mockData.business.name || 'Store',
        logo: mockData.brand.logoUrl || '',
        favicon: '',
        announcementBar: 'Complimentary shipping on orders above ₹499',
      },
      branding: {
        primary: mockData.brand.primaryColor || '#8c7e5a',
        accent: mockData.brand.primaryColor || '#bfa760',
        typography: 'Inter',
      },
      commerce: {
        currency: 'INR',
        taxRatePct: 18,
        shippingFeePaise: 0,
        freeShippingThresholdPaise: 49900,
        razorpayReady: true,
      },
      contact: {
        email: mockData.business.contactEmail || '',
        phone: '',
        address: '',
      },
      domain: {
        hostname: mockData.business.subdomain ? `${mockData.business.subdomain}.platform.local` : 'platform.local',
        canonicalUrl: '',
      },
    },
  };

  return (
    <div style={{ '--color-primary': mockData.brand.primaryColor } as React.CSSProperties}>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </div>
  );
};

export const PreviewStep: React.FC = () => {
  const { data, nextStep, prevStep } = useOnboarding();

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-1">Preview your store</h2>
        <p className="text-xs text-stone-500">Live simulation of your customers' storefront experience.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-stone-200/90 overflow-hidden flex flex-col h-[70vh]">
        {/* Browser Header Mock */}
        <div className="bg-stone-100/80 px-4 py-3 border-b border-stone-200/80 flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-300"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-stone-300"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-stone-300"></div>
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white text-stone-600 text-xs font-mono py-1 px-3.5 rounded-lg flex justify-center shadow-2xs border border-stone-200/60">
              https://{data.business.subdomain || 'your-store'}.{import.meta.env.VITE_SITE_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'platform.local'}
            </div>
          </div>
        </div>

        {/* Live Preview Area */}
        <div className="flex-1 overflow-y-auto bg-stone-50 relative pointer-events-none origin-top" style={{ transform: 'scale(0.85)', width: '117.6%' }}>
          <MockSettingsProvider mockData={data}>
             <Layout>
               <HomePage />
             </Layout>
          </MockSettingsProvider>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl font-bold text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 transition-all active:scale-98 cursor-pointer"
        >
          Make Changes
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all active:scale-98 cursor-pointer"
        >
          Proceed to Launch
        </button>
      </div>
    </div>
  );
};
