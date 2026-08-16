import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import {
  Monitor,
  Tablet,
  Smartphone,
  Lock,
  Search,
  ShoppingCart,
  Heart,
  Sparkles,
  Check,
  ShieldCheck,
  Package,
  CreditCard,
  Globe,
  ArrowRight,
  Star
} from 'lucide-react';

export const LiveStorefrontStudioPreview: React.FC = () => {
  const { data, currentStep } = useOnboarding();
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const storeName = data.business.name.trim() || 'Your Store Name';
  const category = data.business.category || 'Clothing';
  const primaryColor = data.brand.primaryColor || '#8c7e5a';
  const logoUrl = data.brand.logoUrl;
  const products = data.initialProducts;

  // Determine display URL based on domain step
  const displayHostname = (() => {
    if (data.domain.type === 'custom' && data.domain.customHostname) {
      return data.domain.customHostname;
    }
    if (data.domain.type === 'buy' && data.domain.purchasedHostname) {
      return data.domain.purchasedHostname;
    }
    const sub = data.business.subdomain || data.domain.subdomain || 'your-store';
    const base = typeof window !== 'undefined' ? window.location.host : 'yourplatform.com';
    return `${sub}.${base.replace(/^www\./, '')}`;
  })();

  const getDeviceWidth = () => {
    switch (deviceView) {
      case 'mobile':
        return 'max-w-[360px]';
      case 'tablet':
        return 'max-w-[580px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-100/80 rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden transition-all duration-300">
      {/* Studio Browser Header */}
      <div className="bg-white px-4 py-2.5 border-b border-stone-200 flex items-center justify-between gap-3 select-none">
        {/* Window controls */}
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-stone-300"></div>
          <div className="w-3 h-3 rounded-full bg-stone-300"></div>
          <div className="w-3 h-3 rounded-full bg-stone-300"></div>
        </div>

        {/* Live Address Bar */}
        <div className="flex-1 max-w-md mx-2">
          <div className="flex items-center justify-center space-x-1.5 px-3 py-1 bg-stone-50 border border-stone-200/90 rounded-full text-xs font-mono text-stone-600 shadow-2xs">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span className="text-stone-400">https://</span>
            <span className="font-semibold text-stone-800 truncate">{displayHostname}</span>
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center space-x-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200/70">
          <button
            type="button"
            onClick={() => setDeviceView('desktop')}
            className={`p-1.5 rounded-md transition-all ${
              deviceView === 'desktop' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-400 hover:text-stone-600'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('tablet')}
            className={`p-1.5 rounded-md transition-all ${
              deviceView === 'tablet' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-400 hover:text-stone-600'
            }`}
            title="Tablet View"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('mobile')}
            className={`p-1.5 rounded-md transition-all ${
              deviceView === 'mobile' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-400 hover:text-stone-600'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Storefront Canvas */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex justify-center bg-stone-200/40">
        <div
          className={`${getDeviceWidth()} bg-white rounded-xl shadow-md border border-stone-200/70 overflow-hidden flex flex-col transition-all duration-300 text-stone-900 min-h-[560px]`}
          style={{ '--primary-accent': primaryColor } as React.CSSProperties}
        >
          {/* Storefront Announcement Bar */}
          <div
            className="py-1.5 px-4 text-center text-xs font-medium text-white transition-colors duration-500 flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-3 h-3 text-white/80" />
            <span>Welcome to the grand opening of {storeName}!</span>
          </div>

          {/* Storefront Header */}
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-white/95 sticky top-0 z-20">
            <div className="flex items-center space-x-2.5 min-w-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={storeName}
                  className="w-8 h-8 rounded-lg object-cover border border-stone-200"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-2xs transition-colors duration-500"
                  style={{ backgroundColor: primaryColor }}
                >
                  {storeName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-stone-900 text-sm tracking-tight truncate">
                {storeName}
              </span>
            </div>

            {/* Simulated Store Navigation */}
            {deviceView === 'desktop' && (
              <div className="flex items-center space-x-4 text-xs font-medium text-stone-500">
                <span className="text-stone-900 font-semibold cursor-default">Home</span>
                <span className="hover:text-stone-800 cursor-default">Catalog</span>
                <span className="hover:text-stone-800 cursor-default">About</span>
              </div>
            )}

            {/* Storefront Actions */}
            <div className="flex items-center space-x-2 text-stone-400">
              <Search className="w-4 h-4 cursor-default" />
              <Heart className="w-4 h-4 cursor-default" />
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-stone-800 cursor-default" />
                {products.length > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {products.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Storefront Hero Section */}
          <div className="relative bg-gradient-to-b from-stone-50 to-white px-5 py-8 text-center border-b border-stone-100">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 mb-3 border border-stone-200/60">
              <span>{category}</span>
              <span className="text-stone-400">•</span>
              <span className="text-emerald-700 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Live Storefront
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mb-2">
              {data.business.tagline || `Discover Extraordinary ${category}`}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-4">
              {data.business.description || `Browse our curated collection at ${storeName}. High quality, handcrafted perfection.`}
            </p>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-transform active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Products Shelves Section */}
          <div className="p-4 sm:p-5 flex-1 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Featured Products</h3>
                <p className="text-[11px] text-stone-400">
                  {products.length > 0 ? `${products.length} item(s) on your shelves` : 'Your store catalog'}
                </p>
              </div>
              <span className="text-xs text-stone-500 font-medium">View all →</span>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {products.map((prod, idx) => (
                  <div
                    key={idx}
                    className="group bg-stone-50/70 border border-stone-200/80 rounded-xl p-2.5 transition-all hover:shadow-xs hover:border-stone-300"
                  >
                    <div className="aspect-square bg-white rounded-lg border border-stone-100 flex items-center justify-center mb-2 overflow-hidden relative">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-stone-300" />
                      )}
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-white/90 backdrop-blur-xs rounded text-[9px] font-bold text-stone-700 shadow-2xs">
                        New
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1 text-amber-500 text-[10px]">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span className="font-semibold text-stone-700">5.0</span>
                      </div>
                      <h4 className="font-semibold text-xs text-stone-900 truncate">{prod.name}</h4>
                      <p className="text-[11px] text-stone-500 font-medium">₹{prod.price}</p>
                    </div>

                    <button
                      type="button"
                      className="w-full mt-2 py-1 bg-white border border-stone-200 text-stone-800 rounded-md text-[10px] font-semibold hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Ghost Empty Shelf Encouragement */
              <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center bg-stone-50/50">
                <div className="w-10 h-10 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-xs text-stone-700 mb-1">Your shelves are ready</h4>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                  Add your first item in Step 2 to watch your product card appear here instantly.
                </p>
              </div>
            )}
          </div>

          {/* Storefront Trust Badges Footer */}
          <div className="mt-auto px-4 py-3 bg-stone-50 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-500">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SSL Encrypted</span>
            </div>

            <div className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {data.payments.connected ? 'Razorpay Secure Payments Ready' : 'Online Payments'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-stone-500" />
              <span>Edge Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
