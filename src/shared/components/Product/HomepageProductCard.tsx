import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '../../types';
import { useWishlist } from '@/shared/contexts/WishlistContext';
import { useAddToWishlistWithAuth } from '@/shared/hooks/useAddToWishlistWithAuth';
import { useNavigate } from 'react-router-dom';

interface HomepageProductCardProps {
  product: Product;
  index?: number;
}

export const HomepageProductCard: React.FC<HomepageProductCardProps> = ({
  product,
  index = 0,
}) => {
  const navigate = useNavigate();
  const { isInWishlist } = useWishlist();
  const { handleAddToWishlist } = useAddToWishlistWithAuth();
  const [imgError, setImgError] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const image = product.images?.[0] || '';
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleCardClick = () => navigate(`/products/${product.id}`);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleAddToWishlist(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        delay: Math.min(index * 0.07, 0.28),
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1] as any,
      }}
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleCardClick()}
      className="group cursor-pointer select-none"
    >
      {/* ── Card wrapper ── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden
        transition-shadow duration-300 group-hover:shadow-md h-full flex flex-col">

        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-stone-50 flex-shrink-0">
          {!imgError && image ? (
            <img
              src={image}
              alt={product.name}
              draggable={false}
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none
                transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#f8f9fa]">
              {/* Fallback Icon */}
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute top-2.5 left-2.5 bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 shadow
              flex items-center justify-center transition-transform duration-200
              hover:scale-110 active:scale-95"
          >
            <Heart
              className={`h-3.5 w-3.5 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-stone-400'}`}
            />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 p-2.5 sm:p-4 gap-1 sm:gap-1.5">
          {/* Category - Hidden on mobile to save space */}
          {product.category && (
            <p className="hidden sm:block text-[10px] font-medium text-[#5f6368] uppercase tracking-wider truncate">
              {product.category}
            </p>
          )}

          {/* Name */}
          <p className="text-[13px] sm:text-[15px] font-medium text-[#202124] leading-snug line-clamp-2
            group-hover:text-[#1A73E8] transition-colors duration-200 mt-0.5">
            {product.name}
          </p>

          {/* Price */}
          <div className="mt-1 sm:mt-auto flex flex-wrap items-baseline gap-1.5 sm:gap-2 pt-1 sm:pt-2">
            <span className="text-[14px] sm:text-[16px] font-medium text-[#202124]">
              ₹{(product.price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] sm:text-[13px] text-[#5f6368] line-through">
                ₹{(product.originalPrice / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomepageProductCard;
