import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

export const PLANS = [
  {
    name: 'Basic',
    price: '₹299',
    period: '/mo',
    description: 'Perfect for small businesses starting their digital journey.',
    features: [
      '1 Active Storefront',
      'Up to 1,000 Products',
      'Standard Analytics',
      'Orufy Subdomain',
      'Community Support',
      'Standard Templates',
    ],
    highlighted: false,
    cta: 'Start 14-Day Trial',
  },
  {
    name: 'Standard',
    price: '₹499',
    period: '/mo',
    description: 'The sweet spot for growing brands with higher volume.',
    features: [
      '3 Active Storefronts',
      'Unlimited Products',
      'Advanced Sales Insights',
      'Custom Domain Support',
      'Priority Email Support',
      'Premium Design Themes',
      'API Access (v1)',
    ],
    highlighted: true,
    cta: 'Get Standard Now',
  },
  {
    name: 'Premium',
    price: '₹799',
    period: '/mo',
    description: 'Enterprise-grade features for established high-volume retailers.',
    features: [
      '10 Active Storefronts',
      'Unlimited Products',
      'Real-time BI Dashboard',
      'Custom SSL & Hosting',
      '24/7 Phone & Priority Support',
      'Dedicated Store Architect',
      'White-label Checkout',
      'Custom Integrations',
    ],
    highlighted: false,
    cta: 'Go Premium',
  },
];

const Pricing: React.FC = () => {
  return (
    <section className="py-24 md:py-40 bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-black text-[#1A1A1A] mb-8 tracking-tight"
          >
            Plans for brands of all sizes.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl md:text-2xl text-[#666666] max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Transparent pricing that scales with your ambition. No hidden fees, 
            no surprises. Just pure performance.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PLANS.map((plan, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -8 }}
              className={`relative flex flex-col p-10 rounded-[40px] border ${
                plan.highlighted 
                  ? 'bg-white border-[#6344F5] shadow-[0_32px_64px_-16px_rgba(99,68,245,0.15)] z-10 lg:scale-105' 
                  : 'bg-white border-[#E5E1D8]'
              } transition-all duration-500`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#6344F5] text-white px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 shadow-xl shadow-[#6344F5]/30">
                  <Sparkles size={14} fill="currentColor" /> Most Popular
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-[#6344F5] mb-6">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black text-[#1A1A1A] tracking-tighter">{plan.price}</span>
                  {plan.period && <span className="text-2xl text-[#666666] font-bold">{plan.period}</span>}
                </div>
                <p className="mt-6 text-[#666666] font-medium text-lg leading-relaxed">{plan.description}</p>
              </div>

              <div className="space-y-5 mb-12 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full ${plan.highlighted ? 'bg-[#6344F5]/10 text-[#6344F5]' : 'bg-[#1A1A1A]/5 text-[#1A1A1A]'} flex items-center justify-center shrink-0`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-lg text-[#1A1A1A] font-medium tracking-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/signup"
                className={`w-full py-5 rounded-2xl font-black text-lg text-center transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-[#6344F5] text-white hover:bg-[#1A1A1A] shadow-xl shadow-[#6344F5]/20'
                    : 'bg-[#1A1A1A] text-white hover:bg-[#6344F5]'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;


