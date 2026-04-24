import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { Product } from '../../types';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAddToWishlistWithAuth } from '../../hooks/useAddToWishlistWithAuth';
import ProductImage from '../Common/ProductImage';

interface LatestArrivalProductCardProps {
  product: Product;
  index?: number;
}

/**
 * Compact marketplace-style card for horizontal scroll sections.
 * Square image ratio, minimal info below — Flipkart/Meesho style.
 */
export const LatestArrivalProductCard: React.FC<LatestArrivalProductCardProps> = ({ product, index = 0 }) => {
  const { isInWishlist } = useWishlist();
  const { handleAddToWishlist } = useAddToWishlistWithAuth();

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddToWishlist(product);
  };

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <article className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-green-400 hover:shadow-md transition-all duration-200">
        {/* Square image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <ProductImage
            product={product}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            alt={product.name}
            size="small"
            priority={index < 3 ? 'critical' : 'normal'}
          />

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={`absolute top-1.5 right-1.5 p-1.5 rounded-full shadow transition-all ${
              isInWishlist(product.id)
                ? 'bg-red-500 text-white'
                : 'bg-white/95 text-gray-400 hover:text-red-500'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`h-3.5 w-3.5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Info */}
        <div className="p-2">
          <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight mb-1 min-h-[2rem]">
            {product.name}
          </p>

          {/* Rating row */}
          {product.rating > 0 && (
            <div className="flex items-center gap-0.5 mb-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-semibold text-gray-600">{product.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-sm font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] text-gray-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default LatestArrivalProductCard;
