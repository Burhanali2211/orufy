import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStorefrontCart } from '../StorefrontCartContext';

export default function StorefrontCartPage() {
  const { items, total, removeItem, updateQuantity } = useStorefrontCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        <p className="text-gray-400 mb-4 text-sm">Your cart is empty.</p>
        <Link to="/" className="text-blue-600 text-sm hover:underline">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Your cart</h1>

      <div className="space-y-4">
        {items.map((item: any) => {
          const image = item.product.images?.[0];
          return (
            <div key={item.id} className="flex gap-3 border-b border-gray-100 pb-4">
              {/* Image */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {image ? (
                  <img src={image} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                    {item.product.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                <p className="text-sm text-gray-600 mt-0.5">₹{(item.product.price / 100).toFixed(0)}</p>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border border-gray-200 rounded overflow-hidden text-sm">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-2 py-0.5 hover:bg-gray-50 text-gray-600"
                    >−</button>
                    <span className="px-2 border-x border-gray-200">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="px-2 py-0.5 hover:bg-gray-50 text-gray-600"
                    >+</button>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Line total */}
              <div className="text-sm font-semibold text-gray-900 flex-shrink-0">
                ₹{((item.product.price * item.quantity) / 100).toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtotal */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">Subtotal</span>
        <span className="text-base font-bold text-gray-900">₹{(total / 100).toFixed(0)}</span>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        className="mt-4 bg-blue-600 text-white w-full py-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Proceed to checkout
      </button>

      <Link to="/" className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-3">
        Continue shopping
      </Link>
    </div>
  );
}
