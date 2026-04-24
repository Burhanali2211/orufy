import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Star, Heart, ShoppingBag, Flame } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCartButtonStyles } from '../../hooks/useCartButtonStyles';
import { AddToCartButton } from './AddToCartButton';

interface BestSellerProductCardProps {
  product: Product;
  rank?: number;
}

/**
 * BestSellerProductCard - Bold & Attention-Grabbing Design
 * Emphasizes social proof, ratings, and popularity
 */
export const BestSellerProductCard: React.FC<BestSellerProductCardProps> = ({ product, rank }) => {
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const { cartButtonText, cartButtonStyle, cartButtonHoverStyle } = useCartButtonStyles();
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
      // Notification is handled by WishlistContext
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border-2 border-amber-100 hover:border-amber-300">
        {/* Rank Badge (Top Left) */}
        {rank && rank <= 3 && (
          <div className="absolute top-0 left-0 z-20">
            <div className={`w-16 h-16 flex items-center justify-center font-bold text-2xl ${rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900' :
                rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900' :
                  'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900'
              } rounded-br-3xl shadow-lg`}>
              #{rank}
            </div>
          </div>
        )}

        {/* Best Seller Badge (Top Right) */}
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
          <Flame className="h-3.5 w-3.5" />
          Best Seller
        </div>

        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.images?.[0] || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-product.jpg';
            }}
          />

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-sm shadow-md transition-all duration-300 hover:scale-110 z-10 ${isInWishlist(product.id)
                ? 'bg-red-500 text-white'
                : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            aria-label="Add to wishlist"
          >
            <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>

          {/* Quick Add to Cart Button (Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg text-white"
              style={cartButtonStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, cartButtonHoverStyle);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, cartButtonStyle);
              }}
            >
              <ShoppingBag className="h-4 w-4" />
              {cartButtonText}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Rating & Reviews (Prominent) */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
                <Star className="h-4 w-4 text-amber-500 fill-current" />
                <span className="ml-1 text-sm font-bold text-gray-900">
                  {Number(product.rating).toFixed(1) || '0.0'}
                </span>
              </div>
              <span className="text-xs text-gray-600 ml-1">
                ({Number(product.reviewCount) || 0} reviews)
              </span>
            </div>
            <div className="flex items-center text-xs text-orange-600 font-semibold">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              Trending
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors duration-300">
            {product.name}
          </h3>

          {/* Price with Discount Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    {Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Social Proof */}
          {product.reviewCount && Number(product.reviewCount) > 50 && (
            <div className="mt-3 flex items-center text-xs text-gray-600 bg-green-50 px-3 py-1.5 rounded-lg">
              <span className="font-semibold text-green-700">
                {Number(product.reviewCount)}+ customers love this!
              </span>
            </div>
          )}
        </div>

        {/* Accent Border on Hover */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-400 rounded-2xl transition-colors duration-300 pointer-events-none"></div>
      </div>
    </Link>
  );
};

export default BestSellerProductCard;