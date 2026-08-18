import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Shield,
  ChevronRight,
  Palette,
  Sliders,
  Building,
  ArrowRight
} from 'lucide-react';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';
import { ThemeStudio } from './ThemeStudio';
import { BrandingSettings } from './BrandingSettings';
import { StoreDetailsSettings } from './StoreDetailsSettings';
import { PolicyPagesManager } from './PolicyPagesManager';

const settingsNav = [
  {
    name: 'Theme Studio & Live Visuals',
    path: '/admin/settings/theme-studio',
    icon: Sliders,
    badge: 'Popular',
    description: 'Visual live customizer for layout sections, enterprise hero presets, font pairings, color palettes, and announcement bar.',
  },
  {
    name: 'Store Identity & Logo',
    path: '/admin/settings/branding',
    icon: Palette,
    description: 'Store brand name, logo image with high-res preview, typography monogram, and brand storytelling.',
  },
  {
    name: 'Store Details & Socials',
    path: '/admin/settings/store',
    icon: Building,
    description: 'Customer support channels, WhatsApp number, business address, GST rates, and social profiles.',
  },
  {
    name: 'Policy & Legal Compliance',
    path: '/admin/settings/policy-pages',
    icon: Shield,
    description: 'Manage and customize store Privacy Policy, Terms of Service, Refund Policy, and Shipping Policy.',
  },
];

const SettingsOverview: React.FC = () => (
  <div className="space-y-6 max-w-5xl">
    <div>
      <h1 className="text-2xl font-bold text-stone-900 font-serif">Store Settings</h1>
      <p className="text-stone-500 text-sm mt-1">Configure your visual theme, brand identity, customer support, and legal compliance.</p>
    </div>

    <div className="grid sm:grid-cols-2 gap-5">
      {settingsNav.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className="bg-white border border-stone-200 rounded-3xl p-6 hover:border-stone-400 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-colors text-stone-700 shadow-xs">
                <item.icon className="w-6 h-6" />
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-stone-900 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-stone-900 group-hover:text-stone-700 transition-colors">
              {item.name}
            </h3>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              {item.description}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-900">
            <span>Configure</span>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export const AdminSettingsPage: React.FC = () => {
  const location = useLocation();
  const isOverview = location.pathname === '/admin/settings' || location.pathname === '/admin/settings/';

  return (
    <AdminDashboardLayout
      title="Settings"
      subtitle={isOverview ? 'Configure your store visual theme, blocks, hero presentation, and branding' : undefined}
    >
      <Routes>
        <Route index element={<SettingsOverview />} />
        <Route path="theme-studio" element={<ThemeStudio />} />
        <Route path="branding" element={<BrandingSettings />} />
        <Route path="store" element={<StoreDetailsSettings />} />
        <Route path="contact" element={<StoreDetailsSettings />} />
        <Route path="social-media" element={<StoreDetailsSettings />} />
        <Route path="policy-pages" element={<PolicyPagesManager />} />
        <Route path="*" element={<SettingsOverview />} />
      </Routes>
    </AdminDashboardLayout>
  );
};

export default AdminSettingsPage;
