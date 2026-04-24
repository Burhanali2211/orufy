import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Cpu, Layers, ShieldCheck, Zap, Activity } from 'lucide-react';

const BRANDS = [
  { icon: Activity, name: 'Pulse.AI', type: 'black' },
  { icon: Globe, name: 'GlobalNet', type: 'bold' },
  { icon: Cpu, name: 'Core.os', type: 'black' },
  { icon: Zap, name: 'Veloce', type: 'italic' },
  { icon: ShieldCheck, name: 'Fortis', type: 'black' },
  { icon: Layers, name: 'Stack.io', type: 'bold' },
];

const BrandBar: React.FC = () => {
  return (
    <div className="bg-[#FAF9F6] py-16 md:py-20 border-y border-[#E5E1D8] relative z-30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 mb-12"
        >
          Powering the world's most ambitious brands
        </motion.p>
        
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 md:gap-x-24 opacity-40 grayscale hover:opacity-100 transition-opacity duration-700">
          {BRANDS.map((brand, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="flex items-center gap-2.5 group cursor-default"
            >
              <brand.icon size={22} className="text-[#1A1A1A]" />
              <span className={`text-xl tracking-tighter ${
                brand.type === 'black' ? 'font-black uppercase' : 
                brand.type === 'italic' ? 'font-bold italic' : 
                'font-bold'
              }`}>
                {brand.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandBar;


