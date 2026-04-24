import React from 'react';
import { Shield, Truck, Clock, Award, Users, Globe, Zap, Star } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

const stats = [
  { label: "Happy Customers", value: "50k+", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Premium Brands", value: "100+", icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Daily Shipments", value: "1,200+", icon: Truck, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Quality Check", value: "100%", icon: Shield, color: "text-amber-600", bg: "bg-amber-50" }
];

const features = [
  {
    title: "Express Delivery",
    description: "Get your pure attars and perfumes delivered within 24-48 hours across major cities.",
    icon: Zap,
  },
  {
    title: "Alcohol-Free Fragrances",
    description: "All our attars are 100% alcohol-free, crafted using traditional deg-bhapka distillation for a halal experience.",
    icon: Globe,
  },
  {
    title: "Expert Curation",
    description: "Every fragrance in our collection is handpicked by attar experts for authenticity and lasting sillage.",
    icon: Star,
  },
  {
    title: "Timeless Craft",
    description: "Made using centuries-old methods from the attar capital of India — Aligarh.",
    icon: Clock,
  }
];

export const LovedByThousands: React.FC = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <section className="py-12 sm:py-16 md:py-32 bg-white relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-600 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-600 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-gray-100 px-4 py-1.5 rounded-full mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span className="text-gray-600 font-bold text-xs tracking-widest uppercase">The Aligarh Attar House Advantage</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight"
          >
            Built on <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Trust & Quality</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            We've redefined the attar shopping experience by combining centuries-old craft with modern convenience.
          </motion.p>
        </div>

        {/* Stats Row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-16 sm:mb-24"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-center group"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${stat.bg} ${stat.color} mb-4 sm:mb-6 transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{stat.value}</h3>
              <p className="text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all duration-300 group"
            >
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-900 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                <feature.icon className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                  {feature.title}
                </h4>
                <p className="text-gray-500 leading-relaxed text-base">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LovedByThousands;
