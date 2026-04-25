import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LOGOS = [
  { name: 'Swiss', color: 'text-gray-400' },
  { name: '† KOBE', color: 'text-gray-700' },
  { name: 'On_Event', color: 'text-gray-400' },
  { name: 'Ether', color: 'text-gray-400' },
  { name: 'oslo.', color: 'text-gray-700' },
  { name: 'Imprintify', color: 'text-gray-400' },
  { name: 'Berlin', color: 'text-gray-700' },
  { name: 'U-Turn', color: 'text-gray-400' },
];

const Hero: React.FC = () => {
  return (
    <section className="relative pt-24 pb-40 md:pt-32 md:pb-48 overflow-hidden bg-gradient-to-b from-purple-50 to-white">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #A78BFA 0%, transparent 70%)' }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white mb-8 mx-auto block"
        >
          <span className="text-xs font-semibold">New</span>
          <span className="text-xs font-medium">Revolutionize your design workflow</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-black text-center text-[#1A1A1A] mb-8 leading-[1.1] tracking-tight"
        >
          Bring ideas to life in <br className="hidden sm:block" />
          just a few clicks.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-center text-lg md:text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Design, prototype, and collaborate in real-time - all in one powerful platform. Elevate your creative
          process with <span className="font-semibold">seamless teamwork</span> and limitless possibilities.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex justify-center"
        >
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Get Started • it's free
            <ArrowRight size={20} />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mt-24"
        >
          <p className="text-center text-sm font-medium text-gray-500 mb-8">Trusted by leading companies</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {LOGOS.map((logo) => (
              <div key={logo.name} className={`${logo.color} font-bold text-lg`}>
                {logo.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;


