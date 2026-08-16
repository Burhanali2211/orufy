import React from 'react';
import { Heart, ShoppingCart, Trash2, TrendingUp } from 'lucide-react';
import { useWishlist } from '@/shared/contexts/WishlistContext';
import { useCart } from '@/shared/contexts/CartContext';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { ProductCard } from '@/shared/components/Product/ProductCard';
import { Link } from 'react-router-dom';

export const WishlistPage: React.FC = () => {
  const { items, clearWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { showInfo, showSuccess } = useNotification();

  const handleAddAllToCart = () => {
    const inStock = items.filter(i => i.product.stock > 0);
    if (inStock.length === 0) {
      showInfo('Nothing in stock', 'None of your saved items are available right now.');
      return;
    }
    inStock.forEach(i => addToCart(i.product));
    showSuccess(`${inStock.length} items added to cart`);
  };

  const handleClear = () => {
    if (items.length === 0) return;
    clearWishlist();
    showInfo('Wishlist cleared');
  };

  const totalValue = items.reduce((sum, i) => sum + i.product.price, 0);
  const inStockCount = items.filter(i => i.product.stock > 0).length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Minimal page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Heart className="h-4 w-4 text-gray-700" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Wishlist</h1>
              {items.length > 0 && (
                <p className="text-xs text-gray-400 leading-tight">
                  {items.length} {items.length === 1 ? 'item' : 'items'} · ₹{(totalValue / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddAllToCart}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add all to cart</span>
                <span className="sm:hidden">Add all</span>
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs font-medium text-gray-500 rounded-lg hover:border-gray-300 hover:text-gray-700 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {items.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <Heart className="h-7 w-7 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Your wishlist is empty</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
              Tap the <Heart className="inline h-3.5 w-3.5 text-red-400 fill-red-400" /> on any product to save it here.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                <></>
                Browse products
              </Link>
              <Link
                to="/products?sort=best_sellers"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:border-gray-300 transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                Best sellers
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Compact stats strip */}
            <div className="flex gap-4 mb-5 text-sm">
              <span className="text-gray-400">{items.length} saved</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">{inStockCount} in stock</span>
              {items.length - inStockCount > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400">{items.length - inStockCount} out of stock</span>
                </>
              )}
            </div>

            {/* Products grid — same grid as the rest of the site */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {items.map(item => (
                <ProductCard key={item.product.id} product={item.product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
