import React from 'react';
import { Drawer } from 'vaul';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2, ShieldCheck } from 'lucide-react';
import { useCart } from '@/shared/contexts/CartContext';
import { Link } from 'react-router-dom';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, total, clearCart, loading, itemCount } = useCart();

  const CartContent = (
    <div className="flex flex-col h-full bg-white max-h-[85vh] sm:max-h-full">
      {/* Mobile Handle */}
      <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-stone-300 my-3 sm:hidden" />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-stone-100">
        <div>
          <h2 className="text-xl font-serif font-bold text-stone-900">Shopping Bag</h2>
          <p className="text-xs text-stone-500">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
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
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-400">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-900 mb-1">Your bag is empty</h3>
            <p className="text-sm text-stone-500 max-w-xs mb-6">Discover our curated collection of luxury fragrances and attars.</p>
            <Link
              to="/products"
              onClick={onClose}
              className="px-6 py-2.5 bg-stone-900 text-white font-medium text-sm rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {items.map((item) => {
              if (!item.product) return null;
              const unitPrice = typeof item.product.price === 'number'
                ? item.product.price
                : parseFloat(String(item.product.price || 0));

              return (
                <div
                  key={item.id || item.product.id}
                  className="flex gap-4 py-3 items-start group"
                >
                  <div className="w-20 h-20 bg-stone-100 rounded-2xl overflow-hidden flex-shrink-0 border border-stone-200">
                    <img
                      src={item.product.images?.[0] || '/placeholder.png'}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif font-semibold text-stone-900 text-sm truncate">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id || item.product.id)}
                        className="text-stone-300 hover:text-red-600 p-1 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-stone-500 mt-0.5">
                      ₹{unitPrice.toLocaleString('en-IN')}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.product.id, item.quantity - 1);
                            } else {
                              removeFromCart(item.product.id);
                            }
                          }}
                          className="p-1.5 hover:bg-white text-stone-600 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-stone-900 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-white text-stone-600 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="font-serif font-bold text-sm text-stone-900">
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

      {/* Footer */}
      {items.length > 0 && (
        <div className="flex-shrink-0 border-t border-stone-100 p-6 bg-stone-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-600">Subtotal:</span>
            <span className="text-xl font-serif font-bold text-stone-900">₹{total.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-500 bg-white p-2 rounded-xl border border-stone-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Complimentary luxury packaging & insured delivery included.</span>
          </div>

          <div className="flex gap-3">
            <Link to="/checkout" onClick={onClose} className="flex-1">
              <button
                className="w-full bg-stone-900 text-white py-3.5 px-5 rounded-2xl font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-md shadow-stone-900/10 active:scale-[0.98]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Native Vaul Bottom Sheet Drawer */}
      <div className="sm:hidden">
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50" />
            <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] h-[85vh] fixed bottom-0 left-0 right-0 z-50 outline-none">
              {CartContent}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>

      {/* Desktop Slideover Modal */}
      <div className="hidden sm:block">
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div 
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity" 
              onClick={onClose} 
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-md bg-white shadow-2xl border-l border-stone-200">
                {CartContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};