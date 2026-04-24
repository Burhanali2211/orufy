import React from 'react';
import { Link } from 'react-router-dom';
import { GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';

export const ComparePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          <GitCompare className="h-12 w-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Compare Feature Coming Soon</h1>
        <p className="text-gray-600 mb-8">We're working on adding product comparison functionality.</p>
        <Link to="/products">
          <motion.button
            className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Browse Products
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default ComparePage;

