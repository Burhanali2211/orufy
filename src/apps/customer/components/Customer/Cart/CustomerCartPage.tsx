import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart, ShieldCheck, RefreshCw } from 'lucide-react';
import { useCart } from '@/shared/contexts/CartContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';

export const CustomerCartPage: React.FC = () => {
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

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 sm:p-12 text-center max-w-2xl mx-auto">
        <div className="max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-stone-100 border border-stone-200 rounded-3xl mx-auto flex items-center justify-center text-stone-800 shadow-sm">
              <ShoppingBag className="h-12 w-12 text-stone-700" />
            </div>
          </div>

          <h3 className="text-2xl font-serif font-bold text-stone-900 mb-3">
            Your cart is currently empty
          </h3>
          <p className="text-stone-600 text-sm mb-8 leading-relaxed">
            Discover our premium collection of curated products.
          </p>

          <div className="flex justify-center">
            <Link to="/products">
              <button className="px-8 py-3.5 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-stone-800 transition-all flex items-center justify-center gap-2">
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Cart Items List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-900 border border-stone-200">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-stone-900 text-base">{items.length} {items.length === 1 ? 'Item' : 'Items'}</p>
              <p className="text-xs text-stone-500">In your shopping cart</p>
            </div>
          </div>
          <button
            onClick={() => {
              clearCart();
              showSuccess('Cart cleared', 'All items removed from cart');
            }}
            className="text-stone-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1.5 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>

        <div className="space-y-3.5">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${JSON.stringify((item as any).selectedOptions || {})}`}
              className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs hover:border-stone-300 transition-all flex flex-col sm:flex-row gap-4"
            >
              {/* Product Image */}
              <div className="w-full sm:w-28 h-28 flex-shrink-0 bg-stone-100 rounded-xl overflow-hidden border border-stone-200">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-stone-900 text-base truncate font-serif">
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => removeItem(item.product.id, (item as any).selectedOptions)}
                      className="p-1.5 text-stone-400 hover:text-red-600 transition-colors rounded-lg"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {(item as any).selectedOptions && Object.keys((item as any).selectedOptions).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Object.entries((item as any).selectedOptions).map(([key, value]) => (
                        <span key={key} className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md font-medium capitalize border border-stone-200">
                          {key}: {value as string}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                  <div className="flex items-center gap-3 bg-stone-100/80 rounded-xl p-1 border border-stone-200">
                    <button
                      onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), (item as any).selectedOptions)}
                      className="p-1 hover:bg-white hover:shadow-xs rounded-lg text-stone-700 transition-all cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-stone-900 min-w-[1.25rem] text-center text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, (item as any).selectedOptions)}
                      className="p-1 hover:bg-white hover:shadow-xs rounded-lg text-stone-700 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-bold text-stone-900">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-stone-500 font-medium">
                      ₹{item.product.price.toLocaleString('en-IN')} each
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-xs border border-stone-200 p-6 sticky top-24">
          <h3 className="text-base font-bold text-stone-900 mb-4 pb-3 border-b border-stone-100">Order Summary</h3>
          
          <div className="space-y-3 mb-6 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal ({items.length} items)</span>
              <span className="font-semibold text-stone-900">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Shipping</span>
              <span className="text-stone-800 font-medium">Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Estimated Tax</span>
              <span className="font-medium text-stone-800">Included</span>
            </div>
            <div className="pt-3 border-t border-stone-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-stone-900">Total Amount</span>
                <span className="text-xl font-bold text-stone-900 font-serif">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 mb-3 cursor-pointer active:scale-95"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            to="/products"
            className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            Continue Shopping
          </Link>

          {/* Trust Badges */}
          <div className="mt-6 pt-6 border-t border-stone-100 grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <ShieldCheck className="w-5 h-5 text-stone-800 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-stone-800 uppercase tracking-wider">Secure Checkout</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <RefreshCw className="w-5 h-5 text-stone-800 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-stone-800 uppercase tracking-wider">Authentic Products</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCartPage;
