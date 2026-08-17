import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  ArrowUpRight,
  ShieldCheck,
  Package,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

const DEFAULT_FOOTER_SECTIONS = [
  {
    title: 'Shop & Discover',
    links: [
      { text: 'All Products', url: '/products' },
      { text: 'Categories', url: '/categories' },
      { text: 'New Arrivals', url: '/new-arrivals' },
      { text: 'Featured Deals', url: '/deals' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { text: 'Track Order', url: '/track-order' },
      { text: 'Shopping Cart', url: '/cart' },
      { text: 'Wishlist', url: '/wishlist' },
      { text: 'Contact Us', url: '/contact' },
    ],
  },
  {
    title: 'Legal & Policies',
    links: [
      { text: 'Privacy Policy', url: '/privacy-policy' },
      { text: 'Terms of Service', url: '/terms-of-service' },
      { text: 'Refund Policy', url: '/refund-policy' },
      { text: 'Shipping Policy', url: '/shipping-policy' },
    ],
  },
];

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { getSiteSetting, config } = useSettings();

  const siteName = getSiteSetting('site_name') || config?.identity?.name || 'Our Store';
  const logoUrl = getSiteSetting('logo_url') || config?.identity?.logo || '';
  const contactEmail = config?.contact?.email || getSiteSetting('contact_email') || 'support@platform.local';
  const contactPhone = config?.contact?.phone || getSiteSetting('contact_phone');
  const contactAddress = config?.contact?.address || getSiteSetting('contact_address');

  return (
    <footer className="bg-[#f8f9fa] border-t border-black/[0.05] text-[#202124] antialiased">

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Brand & Newsletter Section */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-10 w-10 object-contain rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-sm">
                  {siteName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium text-[20px] text-[#202124] tracking-tight group-hover:text-[#1A73E8] transition-colors">
                {siteName}
              </span>
            </Link>

            <p className="text-[#5f6368] leading-relaxed text-[14px] max-w-sm">
              Discover curated luxury essentials and artisanal collections. Designed for seamless shopping, instant fulfillment, and complete peace of mind.
            </p>

            <div className="space-y-3 pt-2">
              <span className="block text-[13px] font-medium text-[#202124] uppercase tracking-wide">
                Get Updates & Exclusive Drops
              </span>
              <form onSubmit={(e) => e.preventDefault()} className="relative max-w-sm flex items-center">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-4 pr-12 py-3.5 bg-white border border-[#dadce0] rounded-2xl text-[14px] font-medium text-[#202124] placeholder:text-[#5f6368] outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-[#f1f3f4] text-[#202124] rounded-xl hover:bg-[#e8eaed] transition-all flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Nav Categories */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">
            {DEFAULT_FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-4">
                <h4 className="text-[13px] font-medium text-[#202124] uppercase tracking-wide">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.url}>
                      <Link
                        to={link.url}
                        className="text-[#5f6368] hover:text-[#1A73E8] text-[14px] font-medium transition-colors inline-flex items-center group"
                      >
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info Row */}
        {(contactEmail || contactPhone || contactAddress) && (
          <div className="border-t border-black/[0.05] mt-12 pt-8 flex flex-wrap items-center gap-6 text-[14px] text-[#5f6368]">
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 hover:text-[#1A73E8] transition-colors font-medium">
                <Mail className="w-4 h-4 text-[#5f6368]" />
                <span>{contactEmail}</span>
              </a>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="inline-flex items-center gap-2 hover:text-[#1A73E8] transition-colors font-medium">
                <Phone className="w-4 h-4 text-[#5f6368]" />
                <span>{contactPhone}</span>
              </a>
            )}
            {contactAddress && (
              <div className="inline-flex items-center gap-2 font-medium">
                <MapPin className="w-4 h-4 text-[#5f6368]" />
                <span>{contactAddress}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clean Bottom Copyright Bar */}
      <div className="border-t border-black/[0.05] py-6 text-[13px] text-[#5f6368]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium text-center sm:text-left">
            &copy; {currentYear} {siteName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 font-medium">
            <Link to="/privacy-policy" className="hover:text-[#1A73E8] transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-[#1A73E8] transition-colors">Terms</Link>
            <Link to="/refund-policy" className="hover:text-[#1A73E8] transition-colors">Refunds</Link>
            <Link to="/shipping-policy" className="hover:text-[#1A73E8] transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
