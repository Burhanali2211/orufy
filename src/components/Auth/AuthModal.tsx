import React from 'react';
import { X, ShoppingCart, Heart, LogIn } from 'lucide-react';
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

  // AuthModalProvider lives outside the Router — use window.location instead of useNavigate
  const go = (mode: 'login' | 'signup') => {
    onClose();
    window.location.href = `/auth?mode=${mode}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Sheet on mobile, centered card on desktop */}
      <div
        className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl px-6 pt-6 pb-8 sm:pb-6 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ActionIcon className="w-7 h-7 text-indigo-600" />
        </div>

        {/* Heading */}
        <h2 className="text-[17px] font-bold text-gray-900 text-center leading-snug">
          Sign in to continue
        </h2>

        {/* Product name if provided */}
        {product && (
          <p className="text-sm text-gray-500 text-center mt-1 px-4 line-clamp-1">
            "{product.name}"
          </p>
        )}

        <p className="text-sm text-gray-500 text-center mt-1.5 mb-6">
          You need an account to {actionText}.
        </p>

        {/* Primary CTA */}
        <button
          onClick={() => go('login')}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 hover:bg-gray-800 active:bg-black text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Secondary CTA */}
        <button
          onClick={() => go('signup')}
          className="w-full py-3.5 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold rounded-xl text-sm transition-colors"
        >
          Create a Free Account
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-4">
          Free to join · Takes less than a minute
        </p>
      </div>
    </div>
  );
};

export { AuthModal };
export default AuthModal;
