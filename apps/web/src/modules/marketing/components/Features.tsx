import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  MousePointer2, 
  Layers, 
  Users2, 
  BarChart3, 
  ShieldCheck, 
  Globe, 
  Cpu, 
  Smartphone,
  ArrowRight 
} from 'lucide-react';

export const FEATURES = [
  {
    icon: Globe,
    title: 'Global Infrastructure',
    description: 'Deploy your storefront on our edge network for sub-second load times anywhere in the world.',
  },
  {
    icon: Cpu,
    title: 'AI-Powered Engine',
    description: 'Automatically optimize images, code, and content for maximum performance and SEO.',
  },
  {
    icon: Smartphone,
    title: 'Mobile First Design',
    description: 'Every storefront is perfectly responsive and optimized for a premium mobile shopping experience.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption and SOC2 compliant infrastructure protect your brand and customers.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Deep behavioral insights and real-time data to help you scale your business intelligently.',
  },
  {
    icon: Layers,
    title: 'Multi-Tenant Core',
    description: 'Manage unlimited storefronts and brands from a single, powerful command center.',
  },
];

const Features: React.FC = () => {
  return (
    <section className="py-24 md:py-40 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center mb-24">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-black text-[#1A1A1A] mb-8 tracking-tight"
        >
          Everything you need <br className="hidden md:block" />
          to scale your commerce.
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl md:text-2xl text-[#666666] max-w-2xl mx-auto font-medium leading-relaxed"
        >
          Orufy provides the tools designers and teams need to build, 
          manage, and scale high-fidelity digital experiences.
        </motion.p>
      </div>

      {/* Modern Feature Grid */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {FEATURES.map((feature, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group p-10 rounded-[32px] border border-[#E5E1D8] bg-[#FAF9F6] hover:bg-white hover:border-[#6344F5] hover:shadow-2xl hover:shadow-[#6344F5]/10 transition-all duration-500"
          >
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E1D8] flex items-center justify-center text-[#1A1A1A] mb-10 group-hover:bg-[#6344F5] group-hover:text-white group-hover:border-[#6344F5] transition-all duration-500">
              <feature.icon size={28} />
            </div>
            <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4 tracking-tight">{feature.title}</h3>
            <p className="text-[#666666] text-lg font-medium leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Secondary Feature Highlight */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-6 mt-40"
      >
        <div className="bg-[#1A1A1A] rounded-[48px] p-8 md:p-20 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div className="flex-1 relative z-10 text-center lg:text-left">
            <h3 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight">
              A high-fidelity editor <br /> that feels like magic.
            </h3>
            <p className="text-xl text-white/50 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Customize every pixel with our intuitive drag-and-drop builder. 
              No code required, just pure creativity unleashed.
            </p>
            <Link 
              to="/signup"
              className="inline-flex items-center gap-3 text-white font-bold text-lg border-b-2 border-[#6344F5] pb-2 hover:text-[#6344F5] transition-colors group"
            >
              Learn about the builder 
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="flex-1 relative z-10 w-full">
            <div className="rounded-[32px] border-8 border-white/10 shadow-3xl overflow-hidden bg-black/40 backdrop-blur-xl">
              <img 
                src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=2070" 
                alt="Editor Preview" 
                className="w-full h-auto opacity-90 hover:scale-[1.02] transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Features;


