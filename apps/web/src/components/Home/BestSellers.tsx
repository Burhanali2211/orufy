import React, { useEffect, memo } from 'react';
import { Star, TrendingUp, ArrowRight, Flame, Tag, ShoppingBag } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { BuyNowButton } from '../Product/BuyNowButton';

export const BestSellers: React.FC = memo(() => {
  const { bestSellers, bestSellersLoading, fetchBestSellers } = useProducts();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();

  useEffect(() => {
    fetchBestSellers(1);
  }, [fetchBestSellers]);

  if (bestSellersLoading || bestSellers.length === 0) return null;

  const product = bestSellers[0];
  const image = product.images?.[0] || '';
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  const savings = hasDiscount ? product.originalPrice! - product.price : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { showAuthModal(product, 'cart'); return; }
    addItem(product, 1);
  };

  return (
    <section className="py-4 sm:py-6 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-green-700" />
            Best Seller
          </span>
          <Link
            to="/products?sort=best_sellers"
            className="text-xs font-medium text-green-700 hover:text-green-900 flex items-center gap-0.5"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Card container — horizontal, precious feel */}
        <div className="relative rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm overflow-hidden">

          {/* Subtle premium accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />

          <div className="flex flex-row h-full">

            {/* ── LEFT: Product image ── */}
            <Link
              to={`/products/${product.id}`}
              className="relative flex-shrink-0 w-[42%] sm:w-[38%] md:w-[40%] block"
            >
              <div className="relative h-full min-h-[180px] sm:min-h-[220px] md:min-h-[240px] overflow-hidden rounded-l-2xl">
                {image ? (
                  <img
                    src={image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-800 to-emerald-600 flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-white/40" />
                  </div>
                )}

                {/* Discount badge pinned to top-right of image */}
                {hasDiscount && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="flex items-center gap-0.5 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                      -{discountPct}%
                    </span>
                  </div>
                )}
              </div>
            </Link>

            {/* ── RIGHT: Info + actions ── */}
            <div className="flex flex-col flex-1 min-w-0 p-4 sm:p-5 md:p-6">

              {/* 1. Trust badge — first thing eyes see on the right */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  <Flame className="h-2.5 w-2.5" />
                  #1 Best Seller
                </span>
                {product.category && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {product.category}
                  </span>
                )}
              </div>

              {/* 2. Product name */}
              <Link to={`/products/${product.id}`} className="block group/name mb-1.5">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-snug line-clamp-2 group-hover/name:text-green-800 transition-colors">
                  {product.name}
                </h2>
              </Link>

              {/* 3. Rating — social proof right after name */}
              {product.rating > 0 && (
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${s <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{product.rating.toFixed(1)}</span>
                  {product.reviewCount ? (
                    <span className="text-xs text-gray-400">({product.reviewCount.toLocaleString()})</span>
                  ) : null}
                </div>
              )}

              {/* Spacer — pushes price + CTAs to the bottom */}
              <div className="flex-1" />

              {/* 4. Price — anchored bottom, original first for anchoring effect */}
              <div className="mb-3">
                {hasDiscount && (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs text-gray-400 line-through">
                      ₹{product.originalPrice!.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                      <Tag className="h-2.5 w-2.5" />
                      Save ₹{savings.toLocaleString()}
                    </span>
                  </div>
                )}
                <span className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-none">
                  ₹{product.price.toLocaleString()}
                </span>
              </div>

              {/* 5. CTAs */}
              <div className="flex flex-col gap-2">
                <BuyNowButton
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                />
                <Link
                  to={`/products/${product.id}`}
                  className="w-full flex items-center justify-center gap-1.5 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm py-2.5 rounded-xl transition-all"
                >
                  View Product
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
});

BestSellers.displayName = 'BestSellers';
export default BestSellers;
