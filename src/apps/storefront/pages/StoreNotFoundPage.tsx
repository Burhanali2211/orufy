import React from 'react';
import { motion } from 'framer-motion';
import { Store, ArrowLeft } from 'lucide-react';

export const StoreNotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4 font-sans text-neutral-900">
      <div className="max-w-xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-24 h-24 bg-neutral-200/50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            <Store className="w-12 h-12 text-neutral-400" />
          </motion.div>

          <motion.h1
            className="text-3xl md:text-4xl font-bold mb-4 tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Store Not Found
          </motion.h1>

          <motion.p
            className="text-base text-neutral-600 mb-10 max-w-sm mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            The store you're looking for doesn't exist on this domain. It may have been moved or deleted.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <a
              href={import.meta.env.VITE_SITE_URL || 'https://get-oru.com'}
              className="inline-flex items-center px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-all shadow-md active:scale-95"
            >
              Back to Orufy
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default StoreNotFoundPage;
