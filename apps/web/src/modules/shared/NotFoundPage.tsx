import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, ShoppingBag } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404 Animation */}
          <motion.div
            className="text-8xl md:text-9xl font-bold text-neutral-200 mb-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            404
          </motion.div>

          {/* Main Message */}
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Oops! Page Not Found
          </motion.h1>

          <motion.p
            className="text-lg text-neutral-600 mb-8 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track!
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-3 bg-white text-neutral-700 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className="mt-12 pt-8 border-t border-neutral-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className="text-sm text-neutral-500 mb-4">Or try these popular pages:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Products
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
              >
                <Search className="w-4 h-4 mr-2" />
                Categories
              </Link>
              <Link
                to="/deals"
                className="inline-flex items-center px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
              >
                Deals
              </Link>
              <Link
                to="/new-arrivals"
                className="inline-flex items-center px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
              >
                New Arrivals
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
