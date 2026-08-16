import React from 'react';
import { MapPin, Award, Heart, BookOpen, ShieldCheck, CheckCircle2, Quote, Flame, ArrowRight, Store, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const { settings, getSiteSetting } = useSettings();
  const { contactInfo } = settings;
  const siteName = getSiteSetting('site_name') || 'Our Store';

  const addressContact = contactInfo.find(c => c.contact_type === 'address' && c.is_primary) ||
                         contactInfo.find(c => c.contact_type === 'address');
  const address = addressContact?.value || `${siteName}, Main Market, Placeholder City, 10001`;

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900">

      {/* ── 1. Hero Header ── */}
      <div className="relative bg-stone-900 text-white overflow-hidden py-20 sm:py-28 border-b border-stone-800">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80')] bg-cover bg-center opacity-20 filter contrast-125" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/80 to-stone-950/60" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-stone-200 text-[10px] font-bold uppercase tracking-[0.3em]"
          >
            <div className="w-3.5 h-3.5 text-blue-400" />
            Premium Storefront
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-stone-100 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {siteName}
          </motion.h1>

          <motion.p
            className="text-base sm:text-xl max-w-2xl mx-auto text-stone-300 font-light leading-relaxed italic font-serif"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            "A premium shopping experience featuring highly curated products and essentials."
          </motion.p>

          <motion.div
            className="inline-flex items-center gap-2 text-stone-400 text-xs sm:text-sm font-medium bg-stone-900/90 px-4 py-2 rounded-xl border border-stone-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <span>{address}</span>
          </motion.div>
        </div>
      </div>

      {/* ── 2. Founder & Heritage Story ── */}
      <section className="py-16 sm:py-24 bg-[#FBF9F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Founder Master Portrait */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-sm">
                <div className="rounded-2xl overflow-hidden border border-stone-300 shadow-md bg-stone-100 aspect-[4/5]">
                  <img
                    src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80"
                    alt={`Founder - ${siteName}`}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="mt-4 bg-white p-4 rounded-xl border border-stone-200 shadow-xs text-center">
                  <h3 className="font-serif font-bold text-stone-900 text-base">Founder & CEO</h3>
                  <p className="text-xs text-stone-500 font-medium">{siteName} · Visionary</p>
                </div>
              </div>
            </div>

            {/* Right: Story Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/80 text-stone-800 text-[10px] font-bold uppercase tracking-wider">
                <Quote className="w-3.5 h-3.5 text-stone-700" />
                Our Story & Vision
              </div>

              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 leading-tight">
                Delivering Excellence Directly to You
              </h2>

              <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
                {siteName} was established with a singular commitment: to bring premium quality products directly to discerning customers. We work with the finest suppliers globally to curate an exceptional collection.
              </p>

              <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
                Every item featured in our store undergoes a rigorous selection process, ensuring you receive only the highest standard of quality and craftsmanship.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white rounded-xl border border-stone-200">
                  <span className="text-2xl font-serif font-bold text-stone-900 block">10+ Yrs</span>
                  <span className="text-xs text-stone-500 font-medium">Industry Experience</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-stone-200">
                  <span className="text-2xl font-serif font-bold text-stone-900 block">100% Quality</span>
                  <span className="text-xs text-stone-500 font-medium">Satisfaction Guaranteed</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. Four Core House Pillars ── */}
      <section className="py-16 sm:py-20 bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-serif font-bold text-stone-900 mb-3">Our Collections</h2>
            <p className="text-xs sm:text-sm text-stone-600">Handcrafted products prepared with authentic care and uncompromising quality.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1 */}
            <div className="bg-[#FBF9F5] border border-stone-200 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-full h-44 rounded-xl overflow-hidden mb-4 border border-stone-200">
                  <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80" alt="Collection 1" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base mb-1">Premium Collection</h3>
                <p className="text-xs text-stone-600 leading-relaxed">Discover our top-tier curated selections designed for excellence.</p>
              </div>
              <Link to="/products" className="mt-4 text-xs font-bold text-stone-900 hover:underline inline-flex items-center gap-1">
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#FBF9F5] border border-stone-200 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-full h-44 rounded-xl overflow-hidden mb-4 border border-stone-200">
                  <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80" alt="Collection 2" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base mb-1">Everyday Essentials</h3>
                <p className="text-xs text-stone-600 leading-relaxed">High quality everyday items that elevate your daily routine.</p>
              </div>
              <Link to="/products" className="mt-4 text-xs font-bold text-stone-900 hover:underline inline-flex items-center gap-1">
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#FBF9F5] border border-stone-200 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-full h-44 rounded-xl overflow-hidden mb-4 border border-stone-200">
                  <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80" alt="Collection 3" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base mb-1">Exclusive Items</h3>
                <p className="text-xs text-stone-600 leading-relaxed">Limited edition and exclusive pieces available only here.</p>
              </div>
              <Link to="/products" className="mt-4 text-xs font-bold text-stone-900 hover:underline inline-flex items-center gap-1">
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Pillar 4 */}
            <div className="bg-[#FBF9F5] border border-stone-200 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-full h-44 rounded-xl overflow-hidden mb-4 border border-stone-200">
                  <img src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80" alt="Collection 4" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base mb-1">Bestsellers</h3>
                <p className="text-xs text-stone-600 leading-relaxed">Our most popular and highly rated customer favorites.</p>
              </div>
              <Link to="/products" className="mt-4 text-xs font-bold text-stone-900 hover:underline inline-flex items-center gap-1">
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. Guarantees ── */}
      <section className="py-16 bg-[#FBF9F5]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Our Authenticity & Satisfaction Promise
          </h2>
          <p className="text-stone-700 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
            We inspect every product and ensure premium packaging for safe delivery. If you ever have a query about your order, our dedicated team is always ready to assist you.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors"
            >
              Browse Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
