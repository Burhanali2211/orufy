import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Package,
  ShoppingBag
} from 'lucide-react';
import { CustomerDashboardLayout } from './CustomerDashboardLayout';
import { useWishlist } from '@/shared/contexts/WishlistContext';
import { useCart } from '@/shared/contexts/CartContext';
import { useNotification } from '@/shared/contexts/NotificationContext';

const fmt = (n: number | string) => {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const CustomerWishlistPage: React.FC = () => {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const { showSuccess } = useNotification();

  const handleMoveToCart = (product: any) => {
    addItem(product, 1);
    removeItem(product.id);
    showSuccess('Moved to cart', `${product.name} has been added to your shopping cart.`);
  };

  return (
    <CustomerDashboardLayout title="Saved Wishlist" subtitle="Your curated collection of favorites">
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-stone-500">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearWishlist}
              className="text-xs font-semibold text-stone-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((product: any) => {
              const inStock = product.stock === undefined || product.stock > 0;
              return (
                <div
                  key={product.id}
                  className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="aspect-square rounded-xl bg-stone-100 overflow-hidden relative border border-stone-200/80">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-stone-400" />
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(product.id)}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 text-stone-600 hover:text-rose-600 shadow-xs transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <Link to={`/products/${product.id}`} className="hover:underline">
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate font-serif">
                          {product.name}
                        </h4>
                      </Link>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs sm:text-sm font-bold text-stone-900">
                          {fmt(product.price)}
                        </span>
                        <span className={`text-[10px] font-bold ${inStock ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => handleMoveToCart(product)}
                      disabled={!inStock}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Move to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <Heart className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-900">Your wishlist is empty</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Save your favorite items from our collection to purchase later.
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Catalog</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
};

export default CustomerWishlistPage;
