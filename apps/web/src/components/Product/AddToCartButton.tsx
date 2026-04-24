import React, { useState } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { useCartButtonStyles } from '../../hooks/useCartButtonStyles';
import { useCartButtonState } from '../../hooks/useCartButtonState';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  className = '',
  size = 'md',
  showIcon = true,
}) => {
  const { addItem: addToCart } = useCart();
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();
  const { cartButtonText, cartButtonStyle, cartButtonHoverStyle } = useCartButtonStyles();
  const { buttonState, markAsJustAdded } = useCartButtonState(product);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Require login — show clean modal instead of guest cart
    if (!user) {
      showAuthModal(product, 'cart');
      return;
    }

    if (product.stock > 0 && !isAdding) {
      setIsAdding(true);
      try {
        await addToCart(product, 1);
        markAsJustAdded();
      } finally {
        setIsAdding(false);
      }
    }
  };

  const isOutOfStock = product.stock === 0;
  const isAdded = buttonState === 'added' || buttonState === 'in-cart';

  // Dynamic sizing - compact on mobile to prevent bulge
  const sizeClasses = {
    sm: 'h-7 sm:h-8 px-2.5 sm:px-3 text-[11px] sm:text-xs gap-1 sm:gap-2 rounded-md sm:rounded-lg',
    md: 'h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm gap-1.5 sm:gap-2 rounded-md sm:rounded-lg',
    lg: 'h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base gap-2 rounded-lg',
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 18,
  };

  const transition = { duration: 0.2, ease: 'easeInOut' as const };

  return (
    <motion.button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleAddToCart}
      disabled={isOutOfStock || isAdding}
      className={`
        relative overflow-hidden flex items-center justify-center gap-2 font-bold rounded-lg
        transition-all duration-300 select-none touch-manipulation min-h-0
        ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
        ${isAdded ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg' : ''}
        ${sizeClasses[size]}
        ${className}
      `}
      style={!isOutOfStock && !isAdded ? {
        ...cartButtonStyle,
        ...(isHovered ? cartButtonHoverStyle : {}),
      } : undefined}
      whileTap={!isOutOfStock ? { scale: 0.96 } : {}}
    >
      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={transition}
          >
            <Loader2 className="animate-spin" size={iconSize[size]} />
          </motion.div>
        ) : isAdded ? (
          <motion.div
            key="added"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
            transition={transition}
          >
            {showIcon && <Check size={iconSize[size]} strokeWidth={3} />}
            <span>{buttonState === 'added' ? 'Added!' : 'In Cart'}</span>
          </motion.div>
        ) : isOutOfStock ? (
          <motion.div
            key="outofstock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <span>Out of Stock</span>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2"
            transition={transition}
          >
            {showIcon && <ShoppingCart size={iconSize[size]} />}
            <span>{cartButtonText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glossy overlay on hover */}
      {!isOutOfStock && !isAdded && isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
        />
      )}
    </motion.button>
  );
};

export default AddToCartButton;
