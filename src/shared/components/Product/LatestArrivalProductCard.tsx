import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '../../types';
import { useWishlist } from '@/shared/contexts/WishlistContext';
import { useAddToWishlistWithAuth } from '@/shared/hooks/useAddToWishlistWithAuth';
import ProductImage from '../Common/ProductImage';

interface LatestArrivalProductCardProps {
  product: Product;
  index?: number;
}

/**
 * Compact premium card for horizontal scroll sections.
 */
export const LatestArrivalProductCard: React.FC<LatestArrivalProductCardProps> = ({ product, index = 0 }) => {
  const { isInWishlist } = useWishlist();
  const { handleAddToWishlist } = useAddToWishlistWithAuth();

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddToWishlist(product);
  };

  const isSelectedInWishlist = isInWishlist(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <Link to={`/products/${product.id}`} className="block">
        <article className="relative">
          {/* Image Container */}
          <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden bg-[#F5F5F5] transition-all duration-700 group-hover:shadow-xl group-hover:shadow-black/5">
            <ProductImage
              product={product}
              className="w-full h-full object-cover transition-transform duration-[1.5s] cubic-bezier(0.2, 0.8, 0.2, 1) group-hover:scale-110"
              alt={product.name}
              size="small"
              priority={index < 3 ? 'critical' : 'normal'}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Wishlist - Floating */}
            <button
              onClick={handleWishlist}
              className="absolute top-3 right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center transition-all duration-500 hover:bg-black group/wishlist z-10"
              aria-label="Wishlist"
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${isSelectedInWishlist ? 'fill-red-500 text-red-500' : 'text-black group-hover/wishlist:text-white'}`} />
            </button>

            {/* Quick View Tag (Desktop Only) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hidden sm:block">
              <div className="bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl border border-white/20">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black whitespace-nowrap">
                  View Details
                </span>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-3 px-1">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-black/25 uppercase tracking-[0.25em] block group-hover:text-black/50 transition-colors">
                {product.category || 'Collection'}
              </span>
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-xs sm:text-lg font-serif italic text-black leading-tight truncate group-hover:text-stone-600 transition-colors flex-1">
                  {product.name}
                </h3>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs sm:text-base font-black text-black">
                    ₹{(product.price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
};

export default LatestArrivalProductCard;
