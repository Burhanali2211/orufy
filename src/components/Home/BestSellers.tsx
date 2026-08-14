import React, { useEffect, memo } from 'react';
import { ArrowRight, Flame, ShoppingBag } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { motion } from 'framer-motion';

export const BestSellers: React.FC = memo(() => {
  const { bestSellers, bestSellersLoading, fetchBestSellers } = useProducts();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();

  useEffect(() => {
    fetchBestSellers(1); // Fetch only 1 product
  }, [fetchBestSellers]);

  if (bestSellersLoading || bestSellers.length === 0) return null;

  const product = bestSellers[0];
  const image = product.images?.[0] || '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { showAuthModal(product, 'cart'); return; }
    addItem(product, 1);
  };

  return (
    <section className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h2 className="text-[28px] font-normal text-[#202124] leading-tight flex items-center gap-2">
              Curated Essential <Flame className="h-6 w-6 text-amber-600 fill-amber-600" />
            </h2>
            <p className="text-[#5f6368] text-[16px] font-normal">
              Our #1 most loved product this week.
            </p>
          </div>
          
          <Link
            to="/products?sort=best_sellers"
            className="group flex items-center gap-1.5 text-[14px] font-medium text-[#1A73E8] hover:text-[#1557B0] transition-colors"
          >
            Discover More <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Google-Inspired Product Spotlight */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-[#f8f9fa] rounded-[32px] overflow-hidden flex flex-col-reverse lg:flex-row items-center border border-gray-100"
        >
          {/* Text Content */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 xl:p-20 flex flex-col justify-center relative z-10">
            {/* Category / Label */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-[12px] font-medium text-[#5f6368] mb-6 shadow-sm w-fit">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Top Pick</span>
            </div>

            {/* Title */}
            <h3 className="text-[32px] sm:text-[40px] lg:text-[48px] font-normal text-[#202124] leading-tight mb-4">
              {product.name}
            </h3>

            {/* Description */}
            <p className="text-[16px] sm:text-[18px] text-[#5f6368] mb-8 leading-relaxed max-w-lg">
              {product.description || product.shortDescription || 'Experience the finest quality with our top-rated essential. Perfectly crafted for you.'}
            </p>

            {/* Price & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[24px] sm:text-[28px] font-medium text-[#202124]">
                  ₹{(product.price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[14px] text-[#5f6368] line-through">
                    ₹{(product.originalPrice / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 sm:flex-none bg-[#1A73E8] text-white px-8 py-3.5 rounded-full font-medium text-[16px] hover:bg-[#1557B0] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <Link
                  to={`/products/${product.id}`}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 text-[#5f6368] hover:bg-gray-50 hover:text-[#1A73E8] transition-colors"
                  aria-label="View Details"
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Image Content */}
          <div className="w-full lg:w-1/2 h-[300px] sm:h-[400px] lg:h-[100%] lg:absolute lg:top-0 lg:right-0 lg:bottom-0">
            {image ? (
              <img
                src={image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#e8eaed] flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-[#bdc1c6]" />
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </section>
  );
});

BestSellers.displayName = 'BestSellers';
export default BestSellers;
