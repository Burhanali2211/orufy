import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe, LayoutDashboard, Palette, Zap, Shield, ChevronRight } from 'lucide-react';

export const PlatformLandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  // Lock scroll on mount, then unlock with animation
  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans selection:bg-[#0071E3]/20 selection:text-[#1D1D1F]">
      
      {/* ── Global Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-md border-b border-black/[0.04]">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 h-[44px] flex items-center justify-between">
          <div className="text-[14px] font-semibold tracking-wide">
            StoreBuilder
          </div>
          <nav className="flex items-center gap-6 text-[12px] font-medium text-[#1D1D1F]/80">
            <Link to="/store" className="hover:text-[#1D1D1F] transition-colors">Demo</Link>
            <Link to="/auth" className="hover:text-[#1D1D1F] transition-colors">Sign In</Link>
          </nav>
        </div>
      </header>

      <main className="pt-[44px]">
        {/* ── Hero Section ── */}
        <section className="relative px-6 py-24 md:py-32 lg:py-48 max-w-[1024px] mx-auto text-center flex flex-col items-center overflow-hidden">
          <motion.div
            style={{ opacity, scale }}
            className="w-full flex flex-col items-center"
          >
            <motion.h1 
              className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[106px] leading-[1.05] font-semibold tracking-[-0.04em] text-[#1D1D1F] max-w-5xl mx-auto mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              Commerce, <br />
              <span className="text-black/30">simplified.</span>
            </motion.h1>

            <motion.p 
              className="text-[20px] md:text-[28px] text-[#86868B] font-medium tracking-tight max-w-3xl mx-auto mb-10 leading-[1.3] md:leading-[1.4]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Create your premium storefront in minutes. <br className="hidden md:block" />
              Intelligent design, zero clutter, absolute performance.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center gap-4 mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link 
                to="/onboarding"
                className="bg-[#0071E3] text-white text-[17px] font-medium px-8 py-3.5 rounded-full hover:bg-[#0077ED] transition-transform active:scale-95 flex items-center gap-2"
              >
                Get Started
              </Link>
              <Link 
                to="/store"
                className="text-[#0071E3] text-[17px] font-medium px-6 py-3.5 hover:underline transition-all flex items-center gap-1 group"
              >
                View Demo Store <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Visual Break / Large Product Image Mockup ── */}
        <section className="max-w-[1200px] mx-auto px-6 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-[300px] sm:h-[500px] md:h-[700px] rounded-[32px] md:rounded-[48px] bg-white border border-black/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.04)] overflow-hidden relative"
          >
            {/* Subtle Abstract Dashboard UI Representation */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FBFBFD] to-white" />
            <div className="absolute top-0 left-0 right-0 h-16 border-b border-black/[0.04] flex items-center px-8 gap-4">
               <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
               <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
               <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
               <div className="ml-4 w-48 h-6 rounded-full bg-black/[0.03]" />
            </div>
            <div className="absolute top-24 left-8 right-8 bottom-8 flex gap-8">
              <div className="w-1/4 rounded-2xl bg-black/[0.02] hidden md:block" />
              <div className="flex-1 rounded-2xl bg-black/[0.02] p-8 flex flex-col gap-6">
                <div className="w-1/3 h-10 rounded-xl bg-black/[0.04]" />
                <div className="w-full h-48 rounded-xl bg-black/[0.03]" />
                <div className="flex gap-4">
                  <div className="flex-1 h-32 rounded-xl bg-black/[0.02]" />
                  <div className="flex-1 h-32 rounded-xl bg-black/[0.02]" />
                  <div className="flex-1 h-32 rounded-xl bg-black/[0.02]" />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Deep Dive Features ── */}
        <section className="bg-white py-32 border-t border-black/[0.04]">
          <div className="max-w-[1024px] mx-auto px-6">
            
            <div className="text-center mb-24">
              <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tight text-[#1D1D1F] mb-4 leading-[1.1]">
                Everything you need. <br className="hidden md:block" />
                Nothing you don't.
              </h2>
              <p className="text-[21px] text-[#86868B] max-w-2xl mx-auto leading-relaxed">
                We stripped away the complexity of traditional e-commerce to give you a tool that just works. Beautifully.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-20">
              
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                  <Palette className="w-7 h-7 text-[#1D1D1F]" />
                </div>
                <h3 className="text-[28px] font-semibold tracking-tight text-[#1D1D1F]">
                  Iconic Design
                </h3>
                <p className="text-[17px] leading-[1.5] text-[#86868B]">
                  Your storefront is automatically styled using principles from the world's most successful brands. Clean typography, generous whitespace, and perfect proportions.
                </p>
              </div>

              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                  <LayoutDashboard className="w-7 h-7 text-[#1D1D1F]" />
                </div>
                <h3 className="text-[28px] font-semibold tracking-tight text-[#1D1D1F]">
                  Intelligent Dashboard
                </h3>
                <p className="text-[17px] leading-[1.5] text-[#86868B]">
                  Manage inventory, process orders, and view analytics from a singular, distraction-free interface built for speed and clarity.
                </p>
              </div>

              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                  <Globe className="w-7 h-7 text-[#1D1D1F]" />
                </div>
                <h3 className="text-[28px] font-semibold tracking-tight text-[#1D1D1F]">
                  Instant Deploy
                </h3>
                <p className="text-[17px] leading-[1.5] text-[#86868B]">
                  Connect your custom domain and go live instantly. We handle the SSL certificates, global CDN routing, and server provisioning automatically.
                </p>
              </div>

              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                  <Shield className="w-7 h-7 text-[#1D1D1F]" />
                </div>
                <h3 className="text-[28px] font-semibold tracking-tight text-[#1D1D1F]">
                  Secure by Default
                </h3>
                <p className="text-[17px] leading-[1.5] text-[#86868B]">
                  Enterprise-grade tenant isolation. Your data, products, and customer information are walled off in a completely secure PostgreSQL architecture.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="bg-[#1D1D1F] py-32 text-center text-white">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-[48px] md:text-[72px] font-semibold tracking-tight mb-8">
              Start building.
            </h2>
            <Link 
              to="/onboarding"
              className="inline-flex items-center justify-center bg-white text-[#1D1D1F] text-[17px] font-medium px-10 py-4 rounded-full hover:bg-gray-100 transition-transform active:scale-95"
            >
              Create your store
            </Link>
          </div>
        </section>

      </main>

      {/* ── Minimal Footer ── */}
      <footer className="bg-[#FBFBFD] py-12 border-t border-black/[0.04]">
        <div className="max-w-[1024px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-[12px] text-[#86868B]">
          <p>Copyright © {new Date().getFullYear()} StoreBuilder Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="hover:text-[#1D1D1F] transition-colors">Privacy Policy</Link>
            <span className="w-[1px] h-3 bg-[#d2d2d7] self-center"></span>
            <Link to="/terms-of-service" className="hover:text-[#1D1D1F] transition-colors">Terms of Use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlatformLandingPage;
