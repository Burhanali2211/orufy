import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, Clock, Truck, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PromoBanner: React.FC = React.memo(() => {
  return (
    <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="hero-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="2" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#hero-pattern)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
          >
            <Gift className="h-5 w-5" />
            <span className="font-semibold">Limited Time Offer</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Fast Shipping on All Orders
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl mb-8 max-w-2xl mx-auto opacity-90"
          >
            No minimum purchase required. Plus get exclusive access to member-only deals and early bird discounts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              >
                <span>Shop Now</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>

            <div className="flex items-center space-x-2 text-emerald-100">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Offer ends in 48 hours</span>
            </div>
          </motion.div>
        </div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <Truck className="h-8 w-8 text-emerald-200" />
            <div>
              <h3 className="font-semibold text-lg">Fast Delivery</h3>
              <p className="text-emerald-100 text-sm">2-day shipping nationwide</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <Shield className="h-8 w-8 text-emerald-200" />
            <div>
              <h3 className="font-semibold text-lg">Secure Payment</h3>
              <p className="text-emerald-100 text-sm">256-bit SSL encryption</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <Gift className="h-8 w-8 text-emerald-200" />
            <div>
              <h3 className="font-semibold text-lg">Easy Returns</h3>
              <p className="text-emerald-100 text-sm">30-day return policy</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

PromoBanner.displayName = 'PromoBanner';