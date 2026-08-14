import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Globe, Share2, Phone, Link2, Shield, ChevronRight
} from 'lucide-react';
import { AdminDashboardLayout } from './layout/AdminDashboardLayout';
import { SiteSettingsList } from './components/Settings/SiteSettingsList';
import { SocialMediaSettings } from './components/Settings/SocialMediaSettings';
import { ContactInfoSettings } from './components/Settings/ContactInfoSettings';
import { FooterLinksSettings } from './components/Settings/FooterLinksSettings';
import { PolicyPagesManager } from './components/Settings/PolicyPagesManager';

const settingsNav = [
  { name: 'Site Settings', path: '/admin/settings/site', icon: Globe, description: 'Store name, logo, and SEO' },
  { name: 'Social Media', path: '/admin/settings/social-media', icon: Share2, description: 'Social media links' },
  { name: 'Contact Info', path: '/admin/settings/contact', icon: Phone, description: 'Contact information' },
  { name: 'Footer Links', path: '/admin/settings/footer-links', icon: Link2, description: 'Footer navigation links' },
  { name: 'Policy Pages', path: '/admin/settings/policy-pages', icon: Shield, description: 'Privacy, terms & compliance' },
];

const SettingsOverview: React.FC = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {settingsNav.map((item) => (
      <Link
        key={item.path}
        to={item.path}
        className="bg-white border border-gray-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-slate-100 transition-colors">
            <item.icon className="w-5 h-5 text-slate-600" />
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-slate-500 transition-colors" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
      </Link>
    ))}
  </div>
);

export const AdminSettingsPage: React.FC = () => {
  const location = useLocation();
  const isOverview = location.pathname === '/admin/settings' || location.pathname === '/admin/settings/';

  return (
    <AdminDashboardLayout
      title="Settings"
      subtitle={isOverview ? 'Configure your store settings' : undefined}
    >
      <Routes>
        <Route index element={<SettingsOverview />} />
        <Route path="site" element={<SiteSettingsList />} />
        <Route path="social-media" element={<SocialMediaSettings />} />
        <Route path="contact" element={<ContactInfoSettings />} />
        <Route path="footer-links" element={<FooterLinksSettings />} />
        <Route path="policy-pages" element={<PolicyPagesManager />} />
      </Routes>
    </AdminDashboardLayout>
  );
};

export default AdminSettingsPage;
