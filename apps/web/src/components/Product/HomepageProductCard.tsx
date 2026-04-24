import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Product } from '../../types';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAddToCartWithAuth } from '../../hooks/useAddToCartWithAuth';
import { useAddToWishlistWithAuth } from '../../hooks/useAddToWishlistWithAuth';
import { Link } from 'react-router-dom';
import { BuyNowButton } from './BuyNowButton';

interface HomepageProductCardProps {
  product: Product;
  index?: number;
}

export const HomepageProductCard: React.FC<HomepageProductCardProps> = ({ product, index = 0 }) => {
  const { isInWishlist } = useWishlist();
  const { handleAddToCart } = useAddToCartWithAuth();
  const { handleAddToWishlist } = useAddToWishlistWithAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleAddToWishlist(product);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleAddToCart(product, 1);
  };

  const images = product.images && product.images.length > 0 ? product.images : [''];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 h-full">

      {/* Image area — 4:3 on mobile, square on sm+ */}
      <Link to={`/products/${product.id}`} className="block relative bg-gray-50">
        <div className="aspect-[4/3] sm:aspect-square overflow-hidden">
          <img
            src={images[currentImageIndex] || ''}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Best Seller badge */}
        {product.featured && (
          <div className="absolute top-2 left-2">
            <span className="bg-white text-gray-800 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm border border-gray-100">
              Best Seller
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center transition-transform duration-200 hover:scale-110 touch-manipulation"
          aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </Link>

      {/* Image dots */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-4 sm:h-6 bg-white">
        {hasMultipleImages && images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentImageIndex(i)}
            className={`rounded-full transition-all duration-200 cursor-pointer ${
              i === currentImageIndex ? 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-800' : 'w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-300'
            }`}
            aria-label={`Image ${i + 1}`}
          />
        ))}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 px-2.5 sm:px-4 pt-2 sm:pt-3 pb-2.5 sm:pb-4 gap-0.5 sm:gap-1">
        {/* Brand / category */}
        {product.category && (
          <span className="text-[10px] sm:text-xs font-semibold text-green-600 leading-tight">{product.category}</span>
        )}

        {/* Product name */}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-bold text-gray-900 text-xs sm:text-base leading-snug line-clamp-2 hover:text-gray-700 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5">
          <span className="text-xs sm:text-base font-bold text-gray-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] sm:text-xs text-gray-400 line-through">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Buy Now button */}
        <BuyNowButton onClick={handleBuyNow} className="mt-1.5 sm:mt-3" />
      </div>
    </div>
  );
};

export default HomepageProductCard;
