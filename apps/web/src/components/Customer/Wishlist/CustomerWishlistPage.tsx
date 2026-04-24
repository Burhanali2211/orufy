import React, { useState } from 'react';
import { Heart, ShoppingCart, Trash2, Share2, Sparkles, TrendingUp } from 'lucide-react';
import { useWishlist } from '../../../contexts/WishlistContext';
import { useCart } from '../../../contexts/CartContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { ProductCard } from '../../Product/ProductCard';
import { ProductDetails } from '../../Product/ProductDetails';
import { Product } from '../../../types';
import { Link } from 'react-router-dom';

export const CustomerWishlistPage: React.FC = () => {
  const { items, clearWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { showInfo, showSuccess } = useNotification();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleAddAllToCart = () => {
    const inStockItems = items.filter(item => item.product.stock > 0);
    if (inStockItems.length === 0) {
      showInfo('No Items in Stock', 'None of your wishlist items are currently in stock.');
      return;
    }
    inStockItems.forEach(item => addToCart(item.product));
    showSuccess('Added to Cart', `${inStockItems.length} items added to your cart.`);
  };

  const handleClearWishlist = () => {
    if (items.length > 0) {
      clearWishlist();
      showInfo('Wishlist Cleared', 'All items have been removed from your wishlist.');
    }
  };

  const totalValue = items.reduce((sum, item) => sum + item.product.price, 0);
  const inStockCount = items.filter(item => item.product.stock > 0).length;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="max-w-lg mx-auto">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-50"></div>
            </div>
            <div className="relative p-8 bg-white rounded-3xl shadow-md w-32 h-32 mx-auto flex items-center justify-center">
              <Heart className="h-16 w-16 text-gray-300" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Your wishlist is empty
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Save items you love by clicking the heart icon on any product.
            They'll appear here for easy access later.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>Discover Products</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
             <Heart className="w-6 h-6 fill-current" />
           </div>
           <div>
             <p className="font-bold text-gray-900 text-lg">{items.length} Items</p>
             <p className="text-sm text-gray-500">₹{totalValue.toLocaleString('en-IN')} total value</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddAllToCart}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold shadow-md hover:bg-purple-700 transition-all duration-200"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Add All to Cart</span>
          </button>
          <button
            onClick={handleClearWishlist}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 border border-gray-100"
            title="Clear All"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">In Stock</p>
          <p className="text-2xl font-bold text-green-600">{inStockCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{items.length - inStockCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-purple-600">₹{totalValue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.product.id} className="transform hover:scale-[1.02] transition-transform duration-200">
            <ProductCard product={item.product} />
          </div>
        ))}
      </div>

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default CustomerWishlistPage;
