import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2, ShieldCheck } from 'lucide-react';
import { useCart } from '@/shared/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { normalizeImageUrl } from '@/shared/utils/imageUrlUtils';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, total, loading, itemCount } = useCart();
  const navigate = useNavigate();

  // ── Keyboard & Scroll Lock Accessibility ──
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Cart"
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Unified Slide-Over Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-stone-200"
            >
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4.5 border-b border-stone-100 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-stone-900 font-serif leading-tight">
                      Shopping Bag
                    </h2>
                    <p className="text-xs text-stone-500">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-stone-100">
                {loading ? (
                  <div className="flex items-center justify-center h-48 text-stone-400">
                    <p className="text-sm font-medium">Loading bag...</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4 text-stone-400">
                      <ShoppingBag className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-stone-900 mb-1">
                      Your bag is empty
                    </h3>
                    <p className="text-xs text-stone-500 max-w-xs mb-6">
                      Discover our curated catalog of luxury fragrances and artisanal essentials.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/products');
                      }}
                      className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      Explore Collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    {items.map((item) => {
                      if (!item.product) return null;
                      const rawPrice = item.product.price;
                      const unitPrice = typeof rawPrice === 'number'
                        ? rawPrice
                        : parseFloat(String(rawPrice || 0));

                      const rawImg = Array.isArray(item.product.images) ? item.product.images[0] : (item.product as any)?.image;
                      const imgSrc = normalizeImageUrl(rawImg) || '/placeholder.png';

                      return (
                        <div
                          key={item.id || item.product.id}
                          className="flex gap-4 py-3.5 items-start group"
                        >
                          {/* Image */}
                          <div className="w-18 h-18 bg-stone-50 rounded-2xl overflow-hidden flex-shrink-0 border border-stone-200/80">
                            <img
                              src={imgSrc}
                              alt={item.product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.png';
                              }}
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-semibold text-stone-900 text-sm truncate leading-snug">
                                {item.product.name}
                              </h4>
                              <button
                                onClick={() => removeFromCart(item.id || item.product.id)}
                                className="text-stone-300 hover:text-red-600 p-1 transition-colors cursor-pointer"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="text-xs font-medium text-stone-500 mt-0.5">
                              ₹{unitPrice.toLocaleString('en-IN')}
                            </p>

                            <div className="flex items-center justify-between mt-3">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden shadow-2xs">
                                <button
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      updateQuantity(item.product.id, item.quantity - 1);
                                    } else {
                                      removeFromCart(item.product.id);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-white text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-3 text-xs font-bold text-stone-900 min-w-[24px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="p-1.5 hover:bg-white text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <span className="font-bold text-sm text-stone-900">
                                ₹{(unitPrice * item.quantity).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer / Summary Action */}
              {items.length > 0 && (
                <div className="flex-shrink-0 border-t border-stone-100 p-6 bg-stone-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Subtotal
                    </span>
                    <span className="text-lg font-bold text-stone-900 font-serif">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200/80 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Complimentary signature packaging & insured shipping included.</span>
                  </div>

                  <div>
                    <button
                      onClick={handleCheckoutClick}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 px-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};