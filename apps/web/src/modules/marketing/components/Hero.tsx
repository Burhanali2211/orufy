import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-24 md:pt-52 md:pb-40 overflow-hidden bg-[#FCFBF7]">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.4]" 
          style={{ 
            background: 'radial-gradient(circle at 0% 0%, #E7E2FF 0%, transparent 40%), radial-gradient(circle at 100% 100%, #FAF9F6 0%, transparent 40%)' 
          }} 
        />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#E5E1D8 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.2 }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E5E1D8] shadow-sm mb-10"
        >
          <Sparkles size={14} className="text-[#6344F5]" fill="currentColor" />
          <span className="text-[11px] font-bold text-[#1A1A1A] tracking-[0.2em] uppercase">V2.0 is now live</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-black text-[#1A1A1A] mb-8 tracking-[-0.04em] leading-[1.05] max-w-5xl mx-auto"
        >
          Build your <span className="text-[#6344F5]">digital empire</span> <br className="hidden md:block" />
          without limits.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-xl md:text-2xl text-[#666666] mb-14 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          The all-in-one platform for high-performance storefronts, 
          automated workflows, and enterprise-grade design.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <Link
            to="/signup"
            className="w-full sm:w-auto bg-[#1A1A1A] text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#6344F5] transition-all duration-300 shadow-2xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started Free
            <ArrowRight size={20} />
          </Link>
          <Link
            to="/power-ups"
            className="w-full sm:w-auto px-10 py-5 rounded-2xl font-bold text-lg text-[#1A1A1A] border border-[#E5E1D8] bg-white hover:border-[#1A1A1A] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            View Features
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;


