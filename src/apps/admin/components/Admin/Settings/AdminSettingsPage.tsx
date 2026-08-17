import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Globe, Share2, Phone, Link2, Shield, ChevronRight, Sparkles, Palette
} from 'lucide-react';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';
import { HeroSettings } from './HeroSettings';
import { BrandingSettings } from './BrandingSettings';
import { SiteSettings } from './SiteSettings';
import { SocialMediaList } from './SocialMediaList';
import { ContactInfoList } from './ContactInfoList';
import { FooterLinksList } from './FooterLinksList';
import { PolicyPagesManager } from './PolicyPagesManager';

const settingsNav = [
  { name: 'Hero Section', path: '/admin/settings/hero', icon: Sparkles, description: 'Layout designs, headline text & banner slides' },
  { name: 'Branding & Logo', path: '/admin/settings/branding', icon: Palette, description: 'Store logo, store name, colors & announcement' },
  { name: 'Site Settings', path: '/admin/settings/site', icon: Globe, description: 'Store configuration, parameters & SEO' },
  { name: 'Social Media', path: '/admin/settings/social-media', icon: Share2, description: 'Social media profile links' },
  { name: 'Contact Info', path: '/admin/settings/contact', icon: Phone, description: 'Business email, phone & address' },
  { name: 'Footer Links', path: '/admin/settings/footer-links', icon: Link2, description: 'Footer navigation links' },
  { name: 'Policy Pages', path: '/admin/settings/policy-pages', icon: Shield, description: 'Privacy, terms & compliance' },
];

const SettingsOverview: React.FC = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {settingsNav.map((item) => (
      <Link
        key={item.path}
        to={item.path}
        className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-stone-400 hover:shadow-md transition-all group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-colors text-stone-700">
            <item.icon className="w-5 h-5" />
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-colors" />
        </div>
        <h3 className="text-sm font-bold text-stone-900">{item.name}</h3>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{item.description}</p>
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
      subtitle={isOverview ? 'Configure your store settings, hero presentation, and branding' : undefined}
    >
      <Routes>
        <Route index element={<SettingsOverview />} />
        <Route path="hero" element={<HeroSettings />} />
        <Route path="branding" element={<BrandingSettings />} />
        <Route path="site" element={<SiteSettings />} />
        <Route path="social-media" element={<SocialMediaList />} />
        <Route path="contact" element={<ContactInfoList />} />
        <Route path="footer-links" element={<FooterLinksList />} />
        <Route path="policy-pages" element={<PolicyPagesManager />} />
      </Routes>
    </AdminDashboardLayout>
  );
};

export default AdminSettingsPage;
