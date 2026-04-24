import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { Link } from 'react-router-dom';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, total, clearCart, loading, itemCount } = useCart();

  // Debug logging
  React.useEffect(() => {
    if (isOpen) {
    }
  }, [isOpen, items, total, itemCount]);

  return (
    <>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          <div
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-xl z-50 animate-slide-in-right"
            style={{
              position: 'fixed',
              height: '100vh',
              maxHeight: '100vh',
              right: 0,
              top: 0,
              zIndex: 50
            }}
          >
            <div className="flex flex-col h-full max-h-screen">
              {/* Header - flex-shrink-0 to prevent shrinking */}
              <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-neutral-200">
                <h2 className="text-xl font-semibold text-neutral-900">Shopping Cart ({itemCount})</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5 text-neutral-600" />
                </button>
              </div>

              {/* Cart Items - flex-grow with overflow handling */}
              <div className="flex-grow overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                    <ShoppingBag className="h-16 w-16 mb-4 text-neutral-300" />
                    <p className="text-lg font-medium mb-2 text-neutral-700">Your cart is empty</p>
                    <p className="text-sm text-neutral-500">Add some products to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <>
                      {items.map((item) => {
                        // Skip items with missing product data
                        if (!item.product) {
                          return null;
                        }

                        return (
                          <div
                            key={item.id || item.product.id}
                            className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-fade-in"
                          >
                            <img
                              src={(item.product.images && item.product.images.length > 0 ? item.product.images[0] : '') || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4='}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />

                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">
                                {item.product.name}
                              </h3>
                              <p className="text-sm text-gray-500">₹{item.product.price.toLocaleString('en-IN')}</p>

                              <div className="flex items-center space-x-2 mt-2">
                                <button
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      updateQuantity(item.id!, item.quantity - 1);
                                    }
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  aria-label={`Decrease quantity of ${item.product.name}`}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="px-2 py-1 bg-gray-100 rounded text-sm min-w-[40px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  aria-label={`Increase quantity of ${item.product.name}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                              </p>
                              <button
                                onClick={() => {
                                  if (item.id) {
                                    removeFromCart(item.id);
                                  }
                                }}
                                className="text-red-500 text-sm hover:text-red-700 mt-1"
                                aria-label={`Remove ${item.product.name} from cart`}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>

                    {items.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="w-full text-red-500 text-sm hover:text-red-700 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer - flex-shrink-0 to prevent shrinking */}
              {items.length > 0 && (
                <div className="flex-shrink-0 border-t border-neutral-200 p-6 bg-neutral-50">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-semibold text-neutral-700">Total:</span>
                    <span className="text-2xl font-bold text-neutral-900">₹{total.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 bg-white border-2 border-neutral-200 text-neutral-700 py-3.5 px-4 rounded-lg font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-colors duration-200 text-sm"
                    >
                      ← Back to Shop
                    </button>
                    <Link to="/checkout" onClick={onClose} className="flex-1">
                      <button
                        className="w-full bg-neutral-900 text-white py-3.5 px-4 rounded-lg font-medium hover:bg-neutral-800 transition-colors duration-200 shadow-lg active:scale-95 text-sm"
                      >
                        Checkout →
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};