import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingCart, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '@/shared/contexts/CartContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';

const fmt = (n: number | string) => {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { showSuccess, showInfo } = useNotification();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (items.length === 0) {
      showInfo('Cart is empty', 'Add some items before checking out');
      return;
    }
    navigate('/checkout');
  };

  const freeShippingThreshold = 499;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - total);
  const freeShippingProgress = Math.min(100, (total / freeShippingThreshold) * 100);

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs space-y-5">
          <div className="w-20 h-20 bg-stone-100 border border-stone-200 rounded-3xl mx-auto flex items-center justify-center text-stone-800">
            <ShoppingBag className="h-10 w-10 text-stone-700" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              Your bag is empty
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm max-w-sm mx-auto">
              Explore our collection of bespoke items and artisanal creations.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xs hover:bg-stone-800 transition-all"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/60 py-8 sm:py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="space-y-1">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wider mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
              <ShoppingBag className="w-7 h-7 text-stone-800" />
              Shopping Cart ({items.length})
            </h1>
          </div>

          <button
            onClick={() => {
              clearCart();
              showSuccess('Cart cleared', 'All items removed');
            }}
            className="text-stone-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>

        {/* Free Shipping Tracker */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-stone-800">
              <Truck className="w-4 h-4 text-stone-700" />
              {remainingForFreeShipping > 0 ? (
                <span>Add <strong>{fmt(remainingForFreeShipping)}</strong> more to qualify for <strong>Free Shipping</strong></span>
              ) : (
                <span className="text-emerald-700">Congratulations! You have unlocked Free Express Shipping</span>
              )}
            </span>
            <span className="text-stone-500">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-900 rounded-full transition-all duration-300"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* ── Main Cart Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => {
              const itemTotal = (item.product.price || 0) * item.quantity;
              return (
                <div
                  key={`${item.product.id}-${JSON.stringify((item as any).selectedOptions || {})}`}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                      <img
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/products/${item.product.id}`} className="hover:underline">
                        <h3 className="font-bold text-sm sm:text-base text-stone-900 truncate font-serif">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-xs font-medium text-stone-500 mt-0.5">
                        {fmt(item.product.price)} each
                      </p>
                      <button
                        onClick={() => removeItem(item.product.id, (item as any).selectedOptions)}
                        className="text-stone-400 hover:text-rose-600 text-xs font-semibold inline-flex items-center gap-1 mt-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Quantity & Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), (item as any).selectedOptions)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-stone-700 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-stone-900 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, (item as any).selectedOptions)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-stone-700 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-base font-bold text-stone-900 font-mono">
                      {fmt(itemTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-5 sticky top-20">
            <h3 className="text-base font-bold text-stone-900 uppercase tracking-wider font-serif">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs text-stone-600 border-b border-stone-100 pb-4">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-stone-900">{fmt(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated Shipping</span>
                <span className="font-bold text-stone-900">
                  {remainingForFreeShipping === 0 ? 'FREE' : '₹50'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated Taxes (GST)</span>
                <span className="text-stone-500">Calculated at checkout</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-base font-bold text-stone-900 pt-1">
              <span>Estimated Total</span>
              <span className="text-xl font-bold font-mono">{fmt(total + (remainingForFreeShipping === 0 ? 0 : 50))}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-xs cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400 font-medium pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Secure 256-Bit SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
