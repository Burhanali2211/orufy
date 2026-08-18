import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Layout,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Smartphone,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  Sliders,
  Database,
  ExternalLink,
  Store,
  Clock
} from 'lucide-react';

export const PlatformLandingPage: React.FC = () => {
  const [activePreviewTab, setActivePreviewTab] = useState<'storefront' | 'admin' | 'checkout'>('storefront');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans selection:bg-stone-900 selection:text-white antialiased">
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 1. QUIET TOP NAVIGATION BAR ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#fafaf9]/85 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Identity */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-lg tracking-tight text-stone-950">
                ORUFY
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
                2.0
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-600">
            <a href="#features" className="hover:text-stone-950 transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-stone-950 transition-colors">
              Architecture
            </a>
            <a href="#showcase" className="hover:text-stone-950 transition-colors">
              Showcase
            </a>
            <a href="#security" className="hover:text-stone-950 transition-colors">
              Enterprise Security
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/store"
              className="text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors hidden sm:flex items-center gap-1"
            >
              <span>Live Demo</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </Link>

            <Link
              to="/auth"
              className="text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors px-3 py-1.5 rounded-full hover:bg-stone-200/60"
            >
              Sign In
            </Link>

            <Link
              to="/onboarding"
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-xs hover:shadow flex items-center gap-1.5 active:scale-95"
            >
              <span>Launch Store</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20 overflow-hidden">
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── 2. HERO SECTION: WHAT IT IS, WHO IT'S FOR, NEXT ACTION ─────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-20 sm:pb-28 text-center flex flex-col items-center">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 border border-stone-300/60 text-stone-800 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Next-Gen E-Commerce Engine</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-stone-950 tracking-tight leading-[1.04] font-serif max-w-5xl mb-6"
          >
            Commerce crafted <br className="hidden sm:inline" />
            for distinction.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl md:text-2xl text-stone-600 font-normal max-w-3xl leading-relaxed mb-10"
          >
            Deploy high-performance luxury storefronts in seconds. Powered by isolated multi-tenant PostgreSQL, sub-second checkout, and curated editorial themes. Zero plugin bloat. Pure craft.
          </motion.p>

          {/* Primary Action Group */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link
              to="/onboarding"
              className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm px-8 py-4 rounded-full transition-all shadow-md hover:shadow-xl inline-flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Create Your Store in 60s</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/store"
              className="w-full sm:w-auto bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 font-bold text-sm px-8 py-4 rounded-full transition-all inline-flex items-center justify-center gap-2"
            >
              <span>Explore Live Demo</span>
              <ExternalLink className="w-4 h-4 text-stone-500" />
            </Link>
          </motion.div>

          {/* Architectural Metrics Ribbon */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-8 border-t border-stone-200/80 w-full max-w-4xl text-left"
          >
            <div className="space-y-0.5">
              <p className="text-xl sm:text-2xl font-bold font-serif text-stone-950">&lt; 100ms</p>
              <p className="text-xs text-stone-500 font-medium">Edge API Latency</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xl sm:text-2xl font-bold font-serif text-stone-950">100% Isolated</p>
              <p className="text-xs text-stone-500 font-medium">PostgreSQL Multi-Tenant</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xl sm:text-2xl font-bold font-serif text-stone-950">Zero Plugins</p>
              <p className="text-xs text-stone-500 font-medium">Native Speed & Security</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xl sm:text-2xl font-bold font-serif text-stone-950">1-Click SSL</p>
              <p className="text-xs text-stone-500 font-medium">Custom Domain Routing</p>
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── 3. INTERACTIVE PRODUCT CANVAS MOCKUP ───────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-28">
          <div className="bg-white rounded-3xl sm:rounded-[36px] border border-stone-200/80 shadow-2xl overflow-hidden">
            {/* Window Chrome */}
            <div className="bg-stone-100 border-b border-stone-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <div className="ml-3 hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-stone-200 text-[11px] font-mono text-stone-600">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>easyio.get-oru.com</span>
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-xl">
                <button
                  onClick={() => setActivePreviewTab('storefront')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePreviewTab === 'storefront' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Luxury Storefront
                </button>
                <button
                  onClick={() => setActivePreviewTab('admin')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePreviewTab === 'admin' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Merchant Hub
                </button>
                <button
                  onClick={() => setActivePreviewTab('checkout')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePreviewTab === 'checkout' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  One-Page Checkout
                </button>
              </div>
            </div>

            {/* Canvas Interactive Screen */}
            <div className="p-6 sm:p-10 bg-stone-50/50">
              <AnimatePresence mode="wait">
                {activePreviewTab === 'storefront' && (
                  <motion.div
                    key="storefront"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                  >
                    <div className="md:col-span-6 space-y-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-stone-200 text-stone-800">
                        Editorial Presentation
                      </span>
                      <h3 className="text-2xl sm:text-4xl font-bold font-serif text-stone-950">
                        Oud Royale & Rare Amber
                      </h3>
                      <p className="text-sm text-stone-600 leading-relaxed">
                        Precision-crafted storefront with fluid typography, responsive slideovers, and instant cart updates.
                      </p>
                      <div className="pt-2 flex items-center gap-3">
                        <span className="font-serif font-bold text-xl text-stone-950">₹3,499</span>
                        <span className="px-5 py-2 rounded-full bg-stone-900 text-white font-bold text-xs">
                          Add to Bag
                        </span>
                      </div>
                    </div>
                    <div className="md:col-span-6 aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden border border-stone-200 shadow-md">
                      <img
                        src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80"
                        alt="Product Showcase"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                )}

                {activePreviewTab === 'admin' && (
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                        <p className="text-xs text-stone-500 font-semibold">Today's Revenue</p>
                        <p className="text-2xl font-bold font-serif text-stone-950 mt-1">₹48,250</p>
                        <p className="text-[11px] text-emerald-600 font-bold mt-1.5">↑ 24% vs last week</p>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                        <p className="text-xs text-stone-500 font-semibold">Active Orders</p>
                        <p className="text-2xl font-bold font-serif text-stone-950 mt-1">19</p>
                        <p className="text-[11px] text-stone-500 mt-1.5">All fulfilled in &lt; 2 hours</p>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                        <p className="text-xs text-stone-500 font-semibold">Conversion Rate</p>
                        <p className="text-2xl font-bold font-serif text-stone-950 mt-1">4.8%</p>
                        <p className="text-[11px] text-emerald-600 font-bold mt-1.5">Top 5% across commerce</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-stone-200 flex items-center justify-between text-xs font-semibold text-stone-700">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Razorpay Live Gateway Connected
                      </span>
                      <span className="text-stone-400">Merchant ID: mch_09a4f</span>
                    </div>
                  </motion.div>
                )}

                {activePreviewTab === 'checkout' && (
                  <motion.div
                    key="checkout"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center"
                  >
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
                      <h4 className="font-serif font-bold text-base text-stone-950">Express Delivery</h4>
                      <div className="space-y-2">
                        <div className="h-9 bg-stone-100 rounded-xl px-3 flex items-center text-xs text-stone-600">
                          Sarah Jenkins • sarah@example.com
                        </div>
                        <div className="h-9 bg-stone-100 rounded-xl px-3 flex items-center text-xs text-stone-600">
                          104 Victoria Promenade, Suite 4B
                        </div>
                      </div>
                      <div className="pt-2 flex gap-2">
                        <span className="flex-1 py-2 text-center rounded-xl bg-stone-900 text-white font-bold text-xs">
                          Pay with UPI / Card
                        </span>
                        <span className="flex-1 py-2 text-center rounded-xl bg-stone-100 text-stone-700 font-bold text-xs">
                          Cash on Delivery
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-serif font-bold text-lg text-stone-950">Zero-Friction Conversion</h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Single-page progressive checkout flow. Native auto-fill, address pin validation, and guaranteed instant confirmation.
                      </p>
                      <ul className="space-y-1.5 text-xs text-stone-700 font-medium">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Razorpay instant verification
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automated GST billing & PDF receipts
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── 4. ARCHITECTURAL PILLARS (BENTO GRID) ──────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-stone-200/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-stone-200/70 text-stone-800">
              The Orufy Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold font-serif text-stone-950 mt-4 leading-tight">
              Engineered without compromise.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 mt-3">
              We eliminated the brittle plugin ecosystems and bloated architectures of legacy platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Tile 1: Multi-Tenant PostgreSQL */}
            <div className="md:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-900">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-serif text-stone-950">
                  Isolated Multi-Tenant PostgreSQL
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed max-w-xl">
                  Every store operates in a secure, isolated database context. Your orders, customers, inventory, and analytics are fortified with strict schema partitioning.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-100 flex items-center gap-3 text-xs font-bold text-stone-900">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Enterprise ACID Compliance • Zero Data Leaks</span>
              </div>
            </div>

            {/* Tile 2: Sub-Second Speed */}
            <div className="md:col-span-5 bg-stone-950 text-white p-8 sm:p-10 rounded-3xl shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-serif">
                  Sub-Second Page Loads
                </h3>
                <p className="text-sm text-stone-300 leading-relaxed">
                  Engineered with modern Vite bundling, Brotli compression, and zero heavy frameworks. Your customers never wait.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-stone-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>99+ Google Lighthouse Score</span>
              </div>
            </div>

            {/* Tile 3: Curated Design Presets */}
            <div className="md:col-span-4 bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-900">
                  <Layout className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-serif text-stone-950">
                  Curated Editorial Themes
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Pre-configured typographic scales, obsidian dark accents, and fluid grid layouts that look iconic on first view.
                </p>
              </div>
              <Link to="/store" className="mt-6 text-xs font-bold text-stone-900 hover:text-stone-700 flex items-center gap-1">
                <span>View Themes</span> &rarr;
              </Link>
            </div>

            {/* Tile 4: Custom Domains */}
            <div className="md:col-span-4 bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-900">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-serif text-stone-950">
                  1-Click Custom Domains
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Connect your own apex or subdomain with automatic SSL certificate issuance and edge routing.
                </p>
              </div>
              <span className="mt-6 text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Automated DNS Verification
              </span>
            </div>

            {/* Tile 5: Native POS & Orders */}
            <div className="md:col-span-4 bg-white p-8 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-900">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-serif text-stone-950">
                  Integrated POS & Payments
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Seamless payment flow with Razorpay UPI, Cards, Netbanking, and Cash on Delivery with full ledger tracking.
                </p>
              </div>
              <span className="mt-6 text-xs font-bold text-stone-500">
                Direct Merchant Settlement
              </span>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── 5. COMPARISON SECTION: LEGACY CMS VS ORUFY ─────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section id="architecture" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-stone-200/80">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-950">
              The standard for modern commerce.
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              Why leading brands are switching from bloated legacy builders to Orufy.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs">
            <div className="grid grid-cols-3 bg-stone-100/80 p-4 sm:p-5 border-b border-stone-200 font-serif font-bold text-xs sm:text-sm text-stone-900">
              <div>Capability</div>
              <div className="text-stone-500">Legacy Builders</div>
              <div className="text-stone-950 font-black">Orufy Commerce</div>
            </div>

            <div className="divide-y divide-stone-100 text-xs sm:text-sm">
              <div className="grid grid-cols-3 p-4 sm:p-5 items-center">
                <div className="font-semibold text-stone-900">Page Speed</div>
                <div className="text-stone-500">2.5s – 4.2s (Bloated)</div>
                <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> &lt; 0.8s (Edge Optimized)
                </div>
              </div>

              <div className="grid grid-cols-3 p-4 sm:p-5 items-center">
                <div className="font-semibold text-stone-900">Plugins Required</div>
                <div className="text-stone-500">20+ brittle plugins</div>
                <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 0 plugins (Native stack)
                </div>
              </div>

              <div className="grid grid-cols-3 p-4 sm:p-5 items-center">
                <div className="font-semibold text-stone-900">Database Security</div>
                <div className="text-stone-500">Shared MySQL tables</div>
                <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Isolated PostgreSQL context
                </div>
              </div>

              <div className="grid grid-cols-3 p-4 sm:p-5 items-center">
                <div className="font-semibold text-stone-900">Checkout Flow</div>
                <div className="text-stone-500">Multi-step page reloads</div>
                <div className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Instant single-page modal
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── 6. FINAL HIGH-IMPACT CTA ───────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="bg-stone-950 text-white rounded-3xl sm:rounded-[40px] p-10 sm:p-16 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-stone-800/20 rounded-full blur-3xl pointer-events-none" />

            <span className="text-[11px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full bg-white/10 text-stone-300 inline-block border border-white/15">
              Launch Today
            </span>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold font-serif tracking-tight leading-tight max-w-2xl mx-auto">
              Your brand deserves more than generic templates.
            </h2>

            <p className="text-sm sm:text-base text-stone-400 max-w-xl mx-auto leading-relaxed">
              Join discerning merchants who demand speed, security, and pure editorial design.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/onboarding"
                className="w-full sm:w-auto bg-white hover:bg-stone-100 text-stone-950 font-bold text-sm px-9 py-4 rounded-full transition-all shadow-lg active:scale-98 inline-flex items-center justify-center gap-2"
              >
                <span>Launch Your Store Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/store"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-8 py-4 rounded-full transition-colors border border-white/20"
              >
                View Live Demo Store
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 7. QUIET MINIMALIST FOOTER ─────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-stone-200/80 bg-white py-12 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-serif font-black text-stone-900 text-sm">ORUFY</span>
            <span className="text-stone-400">•</span>
            <span>© {new Date().getFullYear()} Orufy Commerce Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link to="/privacy-policy" className="hover:text-stone-900 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-stone-900 transition-colors">
              Terms of Service
            </Link>
            <Link to="/refund-policy" className="hover:text-stone-900 transition-colors">
              Refund Policy
            </Link>
            <Link to="/shipping-policy" className="hover:text-stone-900 transition-colors">
              Shipping Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlatformLandingPage;
