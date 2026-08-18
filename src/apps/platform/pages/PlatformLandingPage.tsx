import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Smartphone,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Store,
  ChevronRight,
  ShieldCheck,
  Zap,
  Check,
  TrendingUp,
  Globe,
  Database,
  ArrowUpRight,
  Banknote,
  Percent,
  SlidersHorizontal,
  Building2,
  ExternalLink,
  PackageCheck,
  BadgeCheck,
  RefreshCw,
  Share2,
  Flame,
  Send,
  Layers,
  Heart,
  Eye,
  Sliders
} from 'lucide-react';

// Animation presets
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: custom * 0.1, ease: "easeOut" }
  })
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
};

interface ProductShowcase {
  id: string;
  category: string;
  name: string;
  price: number;
  tag: string;
  image: string;
  story: string;
  colorScheme: {
    accent: string;
    pill: string;
    bgGlow: string;
  };
}

const SHOWCASE_PRODUCTS: ProductShowcase[] = [
  {
    id: 'perfume',
    category: 'Haute Parfumerie',
    name: 'Oud Royale & Smoked Amber',
    price: 2899,
    tag: 'Artisan Batch',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1000&q=85',
    story: 'Pure hydro-distilled botanicals aged in French oak casks for 18-hour longevity.',
    colorScheme: {
      accent: '#09090B',
      pill: 'bg-[#09090B] text-white',
      bgGlow: 'from-stone-900/10 to-transparent'
    }
  },
  {
    id: 'streetwear',
    category: 'Contemporary Streetwear',
    name: 'Heavyweight Raw Fleece Hoodie',
    price: 3499,
    tag: 'Limited 150 Units',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&q=85',
    story: '500 GSM organic French terry cotton with structured boxy silhouette and custom metal aglets.',
    colorScheme: {
      accent: '#0071E3',
      pill: 'bg-[#0071E3] text-white',
      bgGlow: 'from-blue-600/10 to-transparent'
    }
  },
  {
    id: 'ceramics',
    category: 'Artisanal Ceramics',
    name: 'Wabi-Sabi Stoneware Vessel',
    price: 1950,
    tag: 'Hand Thrown',
    image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=1000&q=85',
    story: 'Wheel-thrown iron-rich clay finished with natural wood-ash glaze and matte texture.',
    colorScheme: {
      accent: '#047857',
      pill: 'bg-[#047857] text-white',
      bgGlow: 'from-emerald-600/10 to-transparent'
    }
  }
];

const LIVE_STREAM_ORDERS = [
  { city: 'Mumbai', amount: '₹2,899', method: 'UPI Instant', time: 'Just now', item: 'Oud Royale' },
  { city: 'Bengaluru', amount: '₹3,499', method: 'Google Pay', time: '12s ago', item: 'Fleece Hoodie' },
  { city: 'Delhi NCR', amount: '₹1,950', method: 'PhonePe', time: '28s ago', item: 'Stoneware Vessel' },
  { city: 'Hyderabad', amount: '₹5,798', method: 'NetBanking', time: '45s ago', item: 'Oud Royale (2x)' },
];

export const PlatformLandingPage: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductShowcase>(SHOWCASE_PRODUCTS[0]);
  const [phoneState, setPhoneState] = useState<'browsing' | 'cart' | 'success'>('browsing');
  const [activeTab, setActiveTab] = useState<'customer' | 'owner'>('customer');
  const [salesItems, setSalesItems] = useState(45);
  const [avgPrice, setAvgPrice] = useState(2400);
  const [activeLiveIndex, setActiveLiveIndex] = useState(0);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Ticker for simulated real-time verified order feed
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLiveIndex((prev) => (prev + 1) % LIVE_STREAM_ORDERS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const totalMonthlyEarnings = salesItems * avgPrice;

  return (
    <div
      className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] antialiased selection:bg-[#0071E3]/15 selection:text-[#0071E3] relative"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#0071E3] z-50 origin-left"
        style={{ scaleX }}
      />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 1. QUIET FROSTED HEADER ────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#FBFBFD]/85 backdrop-blur-xl border-b border-black/[0.05] transition-all">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 h-12 flex items-center justify-between">
          {/* Brand Mark */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-6 h-6 rounded-lg bg-[#09090B] text-white flex items-center justify-center text-[11px] font-semibold shadow-xs"
            >
              <Store className="w-3.5 h-3.5" strokeWidth={2} />
            </motion.div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[15px] tracking-[-0.02em] text-[#09090B]">
                Orufy
              </span>
              <span className="text-[10px] font-semibold text-[#86868B] px-1.5 py-0.5 rounded-full bg-black/[0.04]">
                Commerce 2.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-[12px] font-medium text-[#1D1D1F]/75">
            <a href="#showcase" className="hover:text-[#09090B] transition-colors">
              Boutique Showcase
            </a>
            <a href="#interactive-demo" className="hover:text-[#09090B] transition-colors">
              Live Phone Demo
            </a>
            <a href="#how-it-works" className="hover:text-[#09090B] transition-colors">
              How It Works
            </a>
            <a href="#calculator" className="hover:text-[#09090B] transition-colors">
              Earnings Calculator
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-[12px] font-medium text-[#1D1D1F]/80 hover:text-[#09090B] transition-colors px-3 py-1"
            >
              Sign In
            </Link>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/onboarding"
                className="bg-[#0071E3] hover:bg-[#0077ED] text-white text-[12px] font-semibold px-4 py-1.5 rounded-full transition-all shadow-xs inline-flex items-center gap-1"
              >
                <span>Launch Store</span>
                <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-24 overflow-hidden">
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── 2. HERO: BESPOKE HIGH-IMPACT STATEMENT ─────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section className="max-w-[1160px] mx-auto px-5 sm:px-8 pt-10 pb-14 sm:pt-16 sm:pb-20 text-center flex flex-col items-center relative">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-100/40 via-stone-100/30 to-amber-100/30 blur-3xl pointer-events-none -z-10 rounded-full" />

          {/* Live Order Pulse Ribbon */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-black/[0.06] shadow-xs text-[12px] font-medium text-[#09090B] mb-7"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#86868B]">Live verified order:</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={activeLiveIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="font-semibold text-[#09090B]"
              >
                {LIVE_STREAM_ORDERS[activeLiveIndex].item} • {LIVE_STREAM_ORDERS[activeLiveIndex].amount} ({LIVE_STREAM_ORDERS[activeLiveIndex].city})
              </motion.span>
            </AnimatePresence>
          </motion.div>

          {/* Massive Kinetic Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="text-[44px] sm:text-[72px] md:text-[88px] leading-[1.02] font-semibold tracking-[-0.04em] text-[#09090B] max-w-5xl mx-auto mb-6"
          >
            Sell with pure distinction. <br />
            <span className="text-[#86868B]">Get paid straight to your bank.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[17px] sm:text-[21px] text-[#86868B] font-normal leading-[1.45] max-w-2xl mx-auto mb-9 tracking-tight"
          >
            Deploy an ultra-fast luxury storefront in 60 seconds. Share your store link on WhatsApp or Instagram, and let customers buy in 3 taps with UPI or Cash on Delivery.
          </motion.p>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link
                to="/onboarding"
                className="w-full sm:w-auto bg-[#0071E3] hover:bg-[#0077ED] text-white text-[15px] font-semibold px-8 py-3.5 rounded-full transition-all shadow-md flex items-center justify-center gap-2 group"
              >
                <span>Open Your Online Store</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <a
                href="#interactive-demo"
                className="w-full sm:w-auto bg-white hover:bg-[#F5F5F7] text-[#09090B] border border-black/[0.08] text-[15px] font-medium px-6 py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Smartphone className="w-4 h-4 text-[#0071E3]" strokeWidth={2} />
                <span>Test Interactive Demo</span>
              </a>
            </motion.div>
          </motion.div>

          {/* 3 Metric Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-14 pt-8 border-t border-black/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl text-left"
          >
            <motion.div variants={fadeInUp} custom={1} className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <Banknote className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#09090B]">100% Direct Payouts</p>
                <p className="text-[11px] text-[#86868B]">Settled straight to your UPI / Bank</p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} custom={2} className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0071E3] flex items-center justify-center shrink-0 border border-blue-100">
                <Zap className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#09090B]">Sub-Second Mobile Speed</p>
                <p className="text-[11px] text-[#86868B]">Opens in 0.5s inside Instagram chats</p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} custom={3} className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 border border-stone-200">
                <ShieldCheck className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#09090B]">Private Database Safe</p>
                <p className="text-[11px] text-[#86868B]">Dedicated tenant data isolation</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── 3. INTERACTIVE BOUTIQUE SHOWCASE (CATEGORY EXPLORER) ───────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section id="showcase" className="max-w-[1160px] mx-auto px-5 sm:px-8 py-12 mb-12">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3] bg-[#0071E3]/10 px-3 py-1 rounded-full inline-block mb-2">
              Curated Storefront Aesthetics
            </span>
            <h2 className="text-[28px] sm:text-[38px] font-semibold tracking-[-0.03em] text-[#09090B]">
              Designed for high-craft brands.
            </h2>
            <p className="text-[14px] text-[#86868B] mt-1.5">
              Select a store aesthetic below to see how your catalog comes to life.
            </p>
          </div>

          {/* Interactive Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {SHOWCASE_PRODUCTS.map((prod) => (
              <button
                key={prod.id}
                onClick={() => {
                  setSelectedProduct(prod);
                  setPhoneState('browsing');
                }}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2 ${
                  selectedProduct.id === prod.id
                    ? 'bg-[#09090B] text-white shadow-xs scale-105'
                    : 'bg-white text-[#1D1D1F] border border-black/[0.08] hover:bg-[#F5F5F7]'
                }`}
              >
                <span>{prod.category}</span>
                {selectedProduct.id === prod.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </div>

          {/* Stage Display Card with Smooth Transitions */}
          <motion.div
            key={selectedProduct.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-white rounded-[32px] border border-black/[0.08] p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F5F5F7] text-[#09090B]">
                  {selectedProduct.tag}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant Checkout Enabled</span>
                </span>
              </div>

              <h3 className="text-[26px] sm:text-[38px] font-semibold tracking-[-0.03em] text-[#09090B] leading-tight">
                {selectedProduct.name}
              </h3>

              <p className="text-[14px] sm:text-[15px] text-[#86868B] leading-relaxed">
                {selectedProduct.story}
              </p>

              <div className="pt-2 flex items-center gap-4">
                <span className="text-[24px] font-semibold text-[#09090B]">
                  ₹{selectedProduct.price.toLocaleString()}
                </span>
                <Link
                  to="/onboarding"
                  className="px-6 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[13px] font-semibold transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Build This Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 aspect-[4/3] rounded-[24px] overflow-hidden border border-black/[0.06] shadow-sm relative group bg-[#FAFAFC]">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── 4. INTERACTIVE PHONE SIMULATOR (TOUCH & FEEL IT) ───────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section id="interactive-demo" className="max-w-[1160px] mx-auto px-5 sm:px-8 py-10 mb-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3] bg-[#0071E3]/10 px-3 py-1 rounded-full inline-block mb-3">
              Live Phone Simulator
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-semibold tracking-[-0.03em] text-[#09090B] leading-tight">
              Test how your buyers shop.
            </h2>
            <p className="text-[15px] text-[#86868B] mt-2">
              Tap the interactive screen inside the phone to test the instant buyer journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-[32px] border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.03)]">
            {/* Left Controls & Flow Steps */}
            <div className="lg:col-span-5 space-y-6">
              {/* Mode Control */}
              <div className="bg-[#F5F5F7] p-1 rounded-2xl flex gap-1 text-[13px]">
                <button
                  onClick={() => setActiveTab('customer')}
                  className={`flex-1 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                    activeTab === 'customer'
                      ? 'bg-white text-[#09090B] shadow-xs'
                      : 'text-[#86868B] hover:text-[#09090B]'
                  }`}
                >
                  Customer's Mobile
                </button>
                <button
                  onClick={() => setActiveTab('owner')}
                  className={`flex-1 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                    activeTab === 'owner'
                      ? 'bg-white text-[#09090B] shadow-xs'
                      : 'text-[#86868B] hover:text-[#09090B]'
                  }`}
                >
                  Merchant Order Alert
                </button>
              </div>

              {/* 3 Steps */}
              <div className="space-y-4 pt-2">
                <motion.div
                  whileHover={{ x: 3 }}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-[#09090B]">Customer taps your link</h4>
                    <p className="text-[12px] text-[#86868B] mt-0.5">Loads in 0.5s directly inside Instagram bio, WhatsApp, or browser.</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ x: 3 }}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-[#09090B]">1-Tap Instant Checkout</h4>
                    <p className="text-[12px] text-[#86868B] mt-0.5">Address and phone auto-filled. No account creation password hurdles.</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ x: 3 }}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-[#09090B]">Direct Bank Settlement</h4>
                    <p className="text-[12px] text-[#86868B] mt-0.5">100% of money credited straight to your UPI / Bank account.</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Titanium Device Frame */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-[320px] sm:w-[350px] bg-[#121214] rounded-[46px] p-3 shadow-2xl border-4 border-[#2A2A2E] relative">
                {/* Dynamic Island */}
                <div className="absolute top-5 inset-x-0 mx-auto w-24 h-4 bg-black rounded-full z-30" />

                {/* Inner Screen */}
                <div className="w-full bg-[#FBFBFD] rounded-[38px] overflow-hidden min-h-[580px] flex flex-col justify-between p-4 pt-7 relative border border-black/10">
                  {/* Top Store Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#09090B] text-white flex items-center justify-center text-[9px] font-bold">
                        A
                      </div>
                      <span className="font-semibold text-[13px] text-[#09090B]">
                        Aura Atelier
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPhoneState(phoneState === 'browsing' ? 'cart' : 'browsing')}
                        className="relative p-1.5 rounded-full bg-black/[0.04] text-[#09090B] cursor-pointer"
                        aria-label="Cart"
                      >
                        <ShoppingBag className="w-4 h-4" strokeWidth={2} />
                        {phoneState !== 'browsing' && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0071E3] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            1
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Screen Content */}
                  <div className="my-auto py-2">
                    {activeTab === 'customer' ? (
                      <>
                        {phoneState === 'browsing' && (
                          <motion.div
                            key="browsing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-3"
                          >
                            <div className="aspect-square rounded-2xl overflow-hidden border border-black/[0.06] shadow-2xs relative bg-white">
                              <img
                                src={selectedProduct.image}
                                alt={selectedProduct.name}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[#09090B]">
                                {selectedProduct.tag}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h5 className="font-semibold text-[15px] text-[#09090B]">
                                {selectedProduct.name}
                              </h5>
                              <p className="text-[11px] text-[#86868B] line-clamp-2">
                                {selectedProduct.story}
                              </p>
                              <div className="pt-1 flex items-center justify-between">
                                <span className="font-semibold text-[17px] text-[#09090B]">
                                  ₹{selectedProduct.price.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>In Stock</span>
                                </span>
                              </div>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => setPhoneState('cart')}
                              className="w-full py-3 rounded-full bg-[#09090B] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <span>Tap to Buy Now</span>
                              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                            </motion.button>
                          </motion.div>
                        )}

                        {phoneState === 'cart' && (
                          <motion.div
                            key="cart"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-3 bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-black/[0.04]">
                              <span className="text-[12px] font-semibold text-[#09090B]">Instant 1-Tap Checkout</span>
                              <button
                                onClick={() => setPhoneState('browsing')}
                                className="text-[10px] text-[#86868B] hover:text-[#09090B]"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              <div className="w-full bg-[#F5F5F7] text-[11px] font-medium text-[#09090B] px-2.5 py-2 rounded-lg">
                                Rahul Sharma • 9876543210
                              </div>
                              <div className="w-full bg-[#F5F5F7] text-[11px] font-medium text-[#09090B] px-2.5 py-2 rounded-lg">
                                B-402 Palm Heights, Mumbai, 400050
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-[11px] text-blue-900 font-medium">
                              <span>Total to Pay:</span>
                              <span className="font-bold text-[13px]">₹{selectedProduct.price.toLocaleString()}</span>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => setPhoneState('success')}
                              className="w-full py-2.5 rounded-xl bg-[#0071E3] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Zap className="w-3.5 h-3.5" strokeWidth={2} />
                              <span>Pay with UPI / Google Pay</span>
                            </motion.button>
                          </motion.div>
                        )}

                        {phoneState === 'success' && (
                          <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6 space-y-3 bg-white p-4 rounded-2xl border border-black/[0.06]"
                          >
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                              <Check className="w-6 h-6" strokeWidth={2.5} />
                            </div>
                            <h5 className="font-semibold text-[15px] text-[#09090B]">
                              Payment Confirmed
                            </h5>
                            <p className="text-[11px] text-[#86868B] leading-relaxed">
                              ₹{selectedProduct.price.toLocaleString()} received. Order confirmation & live tracking dispatched via WhatsApp.
                            </p>
                            <button
                              onClick={() => setPhoneState('browsing')}
                              className="px-4 py-1.5 rounded-full bg-[#F5F5F7] text-[#09090B] text-[11px] font-medium hover:bg-stone-200"
                            >
                              Reset Demo
                            </button>
                          </motion.div>
                        )}
                      </>
                    ) : (
                      /* Shop Owner's Live Alert Mode */
                      <motion.div
                        key="owner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3 bg-white p-4 rounded-2xl border border-black/[0.06] shadow-xs text-left"
                      >
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-semibold w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          New Order Verified
                        </div>
                        <div>
                          <p className="text-[18px] font-semibold text-[#09090B]">₹{selectedProduct.price.toLocaleString()}.00</p>
                          <p className="text-[11px] text-[#86868B]">Directly credited to your registered bank</p>
                        </div>
                        <div className="pt-2 border-t border-black/[0.04] space-y-1 text-[11px] text-[#09090B]">
                          <p><strong>Customer:</strong> Rahul Sharma</p>
                          <p><strong>Destination:</strong> Mumbai, 400050</p>
                          <p><strong>Product:</strong> {selectedProduct.name} (1x)</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('customer')}
                          className="w-full py-2 rounded-xl bg-[#09090B] text-white text-[11px] font-medium"
                        >
                          Print Shipping Invoice / Fulfill
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Security Footnote */}
                  <div className="pt-2 border-t border-black/[0.04] flex items-center justify-center gap-1 text-[10px] text-[#86868B]">
                    <Lock className="w-3 h-3 text-[#86868B]" />
                    <span>Protected by Orufy Secure Core</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── 5. REVENUE CALCULATOR (TRANSPARENT SLIDERS) ────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section id="calculator" className="max-w-[920px] mx-auto px-5 sm:px-8 py-16 border-t border-black/[0.06]">
          <div className="bg-white rounded-[28px] border border-black/[0.08] p-8 sm:p-12 shadow-xs space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3] bg-[#0071E3]/10 px-3 py-1 rounded-full inline-block">
                Transparent Cashflow
              </span>
              <h3 className="text-[26px] sm:text-[34px] font-semibold tracking-[-0.03em] text-[#09090B]">
                Calculate your monthly income
              </h3>
              <p className="text-[14px] text-[#86868B]">
                See the exact revenue retained when selling directly to your audience without marketplace penalties.
              </p>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <div className="flex justify-between text-[13px] font-semibold text-[#09090B]">
                  <span>Monthly Orders:</span>
                  <span className="text-[#0071E3] font-bold">{salesItems} items</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={salesItems}
                  onChange={(e) => setSalesItems(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0071E3]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[13px] font-semibold text-[#09090B]">
                  <span>Average Item Price:</span>
                  <span className="text-[#0071E3] font-bold">₹{avgPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="10000"
                  step="100"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0071E3]"
                />
              </div>
            </div>

            {/* Result Box */}
            <div className="p-6 rounded-2xl bg-[#F5F5F7] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <p className="text-[12px] text-[#86868B] font-medium">Your Projected Monthly Revenue:</p>
                <p className="text-[32px] sm:text-[40px] font-bold tracking-tight text-[#09090B]">
                  ₹{totalMonthlyEarnings.toLocaleString()}
                </p>
              </div>
              <div>
                <Link
                  to="/onboarding"
                  className="bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.98] text-white text-[14px] font-semibold px-6 py-3 rounded-full transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Start Selling Now</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── 6. FINAL CONVERSION CALLOUT ────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <section className="max-w-[1160px] mx-auto px-5 sm:px-8 pt-6">
          <div className="bg-white border border-black/[0.08] rounded-[28px] sm:rounded-[36px] p-10 sm:p-16 text-center space-y-5 shadow-xs">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#0071E3] bg-[#0071E3]/10 px-3 py-1 rounded-full inline-block">
              Launch in 60 Seconds
            </span>

            <h2 className="text-[32px] sm:text-[46px] font-semibold tracking-[-0.03em] text-[#09090B] leading-tight max-w-xl mx-auto">
              Ready to launch your digital store?
            </h2>

            <p className="text-[16px] text-[#86868B] max-w-lg mx-auto leading-relaxed">
              No credit card required. Launch directly from your phone in under two minutes.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/onboarding"
                className="w-full sm:w-auto bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.98] text-white text-[15px] font-medium px-8 py-3.5 rounded-full transition-all shadow-sm inline-flex items-center justify-center gap-1.5"
              >
                <span>Create Your Store Free</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
              <Link
                to="/store"
                className="w-full sm:w-auto bg-[#F5F5F7] hover:bg-[#EBEBEF] text-[#09090B] text-[15px] font-medium px-6 py-3.5 rounded-full transition-colors"
              >
                Explore Live Store
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── 7. MINIMAL LUXURY FOOTER ───────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-black/[0.06] bg-[#FBFBFD] py-10 text-[12px] text-[#86868B]">
        <div className="max-w-[1160px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#09090B]">Orufy</span>
            <span>•</span>
            <span>Enterprise Commerce Engine</span>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/privacy-policy" className="hover:text-[#09090B] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-[#09090B] transition-colors">
              Terms of Use
            </Link>
            <Link to="/refund-policy" className="hover:text-[#09090B] transition-colors">
              Refunds
            </Link>
            <Link to="/shipping-policy" className="hover:text-[#09090B] transition-colors">
              Shipping
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlatformLandingPage;
