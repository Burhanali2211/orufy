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
        className="bg-white border border-[#e8eaed] rounded-[24px] p-6 hover:shadow-sm hover:border-[#dadce0] transition-all group"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 bg-[#f8f9fa] rounded-full flex items-center justify-center group-hover:bg-[#e8f0fe] transition-colors">
            <item.icon className="w-6 h-6 text-[#5f6368] group-hover:text-[#1a73e8] transition-colors" />
          </div>
          <ChevronRight className="w-5 h-5 text-[#dadce0] group-hover:text-[#1a73e8] transition-colors" />
        </div>
        <h3 className="text-[16px] font-medium text-[#202124]" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>{item.name}</h3>
        <p className="text-[13px] text-[#5f6368] mt-1">{item.description}</p>
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
