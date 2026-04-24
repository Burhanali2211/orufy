import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart, Sparkles } from 'lucide-react';
import { useCart } from '../../../contexts/CartContext';
import { useNotification } from '../../../contexts/NotificationContext';
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="max-w-lg mx-auto">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full blur-3xl opacity-50"></div>
            </div>
            <div className="relative p-8 bg-white rounded-3xl shadow-md w-32 h-32 mx-auto flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-gray-300" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Looks like you haven't added anything to your cart yet. 
            Start exploring our collections and find something you love!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>Start Shopping</span>
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
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{items.length} Items</p>
              <p className="text-sm text-gray-500">In your shopping cart</p>
            </div>
          </div>
          <button
            onClick={() => {
              clearCart();
              showSuccess('Cart cleared', 'All items removed from cart');
            }}
            className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cart
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${JSON.stringify(item.selectedOptions)}`}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4"
            >
              {/* Product Image */}
              <div className="w-full sm:w-32 h-32 flex-shrink-0">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-gray-900 text-lg truncate">
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => removeItem(item.product.id, item.variantId)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(item.selectedOptions).map(([key, value]) => (
                        <span key={key} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md capitalize">
                          {key}: {value as string}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.variantId)}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-600 transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-gray-900 min-w-[1.5rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-600 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({items.length} items)</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Estimated Tax</span>
              <span>Included</span>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-purple-600">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 mb-4"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <Link
            to="/products"
            className="w-full py-3 flex items-center justify-center gap-2 text-gray-600 font-medium hover:text-purple-600 transition-colors"
          >
            Continue Shopping
          </Link>

          {/* Trust Badges */}
          <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">Secure Payment</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
                <ArrowRight className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">Easy Returns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCartPage;
