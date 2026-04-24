import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Heart, LogIn, Sparkles, UserPlus } from 'lucide-react';
import { Product } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  action?: 'cart' | 'wishlist' | 'compare' | null;
  product?: Product | null;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, action, product }) => {
  if (!isOpen) return null;

  const isWishlist = action === 'wishlist';
  const actionText = isWishlist ? 'save to your wishlist' : 'add items to your cart';
  const ActionIcon = isWishlist ? Heart : ShoppingCart;

  const go = (mode: 'login' | 'signup') => {
    onClose();
    window.location.href = `/auth?mode=${mode}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-md rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] p-10 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6344F5]/5 rounded-full blur-3xl -mr-16 -mt-16" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FAF9F6] transition-all duration-300"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 text-center">
              {/* Logo/Icon Area */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-[#FAF9F6] rounded-[28px] flex items-center justify-center text-[#1A1A1A] shadow-sm">
                    <ActionIcon size={36} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#6344F5] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#6344F5]/20">
                    <Sparkles size={16} fill="currentColor" />
                  </div>
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-black text-[#1A1A1A] mb-2 tracking-tight">
                Unlock your experience.
              </h2>

              {product && (
                <p className="text-sm text-[#666666] font-bold mb-2 px-4 line-clamp-1 opacity-60 italic">
                  "{product.name}"
                </p>
              )}

              <p className="text-[#666666] font-medium mb-10">
                Sign in or create an account to <br />
                <span className="text-[#1A1A1A] font-black">{actionText}</span>.
              </p>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={() => go('login')}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-[#1A1A1A] hover:bg-[#6344F5] text-white font-black rounded-2xl text-lg transition-all duration-500 shadow-xl shadow-black/5 active:scale-[0.98]"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </button>

                <div className="flex items-center gap-4 px-2">
                  <div className="flex-1 h-px bg-[#E5E1D8]" />
                  <span className="text-xs font-black text-[#666666] uppercase tracking-widest opacity-40">OR</span>
                  <div className="flex-1 h-px bg-[#E5E1D8]" />
                </div>

                <button
                  onClick={() => go('signup')}
                  className="w-full flex items-center justify-center gap-3 py-5 border-2 border-[#E5E1D8] hover:border-[#6344F5] hover:text-[#6344F5] text-[#1A1A1A] font-black rounded-2xl text-lg transition-all duration-300 active:scale-[0.98]"
                >
                  <UserPlus className="w-5 h-5" />
                  Create Free Account
                </button>
              </div>

              <p className="text-sm text-[#666666] font-bold mt-8 opacity-40 uppercase tracking-[0.1em]">
                Join 25,000+ happy members
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;

