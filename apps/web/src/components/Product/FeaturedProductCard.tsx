import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCartButtonStyles } from '../../hooks/useCartButtonStyles';
import { AddToCartButton } from './AddToCartButton';

interface FeaturedProductCardProps {
  product: Product;
  index?: number;
}

/**
 * FeaturedProductCard - Sophisticated Premium Design
 * Clean, editorial-style card with emphasis on product imagery
 */
export const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({ product, index = 0 }) => {
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const { cartButtonStyle, cartButtonHoverStyle } = useCartButtonStyles();
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { showAuthModal(product, 'cart'); return; }
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToWishlist(product);
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  return (
    <Link to={`/products/${product.id}`} className="group block h-full">
      <article className="relative bg-white h-full flex flex-col overflow-hidden border border-gray-100 hover:border-green-300 transition-all duration-300 rounded-xl shadow-sm hover:shadow-xl">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
          <img
            src={product.images?.[0] || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-product.jpg';
            }}
          />

          {/* Wishlist Button - Always visible */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2.5 rounded-full shadow-md transition-all duration-200 ${
              isInWishlist(product.id)
                ? 'bg-rose-500 text-white'
                : 'bg-white/95 text-gray-600 hover:text-rose-500 hover:bg-white'
            }`}
            aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>

            {/* Quick Add to Cart - Shows on Hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <AddToCartButton 
                product={product}
                className="w-full"
                size="sm"
              />
            </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col flex-grow p-4">
          {/* Category */}
          {product.category && (
            <span className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1.5">
              {product.category}
            </span>
          )}

          {/* Product Name */}
          <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-800 transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating && Number(product.rating) > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(Number(product.rating) || 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({Number(product.reviewCount) || 0})
              </span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-2 border-t border-gray-100">
            <span className="text-lg md:text-xl font-bold text-gray-900">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <span className="text-sm text-gray-400 line-through">
                ₹{Number(product.originalPrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Short Description - Desktop only */}
          {product.description && (
            <p className="hidden lg:block text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
};

export default FeaturedProductCard;
