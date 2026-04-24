import React, { useMemo, useCallback, memo, useState } from 'react';
import { Star, Heart, ShoppingCart, Check, Zap } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { Link } from 'react-router-dom';
import ProductImage from '../Common/ProductImage';
import { AddToCartButton } from './AddToCartButton';
import { BuyNowButton } from './BuyNowButton';

interface ProductCardProps {
  product: Product;
  isListView?: boolean;
  onCompareToggle?: (id: string) => void;
  isComparing?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  isListView = false,
  onCompareToggle,
  isComparing = false
}) => {
  const { isInWishlist, addItem: addToWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { user } = useAuth();
  const { showAuthModal } = useAuthModal();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlist(product);
  }, [addToWishlist, product]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { showAuthModal(product, 'cart'); return; }
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  }, [addToCart, product, user, showAuthModal]);

  const handleCompareClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCompareToggle) onCompareToggle(product.id);
  }, [onCompareToggle, product.id]);

  // Memoize derived category flags — no string ops on every render
  const { isTech, isFashion } = useMemo(() => {
    const catName = (product.category || '').toLowerCase();
    return {
      isTech: catName.includes('electronics'),
      isFashion: catName.includes('fashion'),
    };
  }, [product.category]);

  if (isListView) {
    return (
      <div className="group flex flex-row gap-3 sm:gap-6 p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-gray-100 hover:border-green-200 transition-all duration-300 shadow-sm hover:shadow-xl relative">
        {/* Image Section - Fixed width on all screens */}
        <div className="relative w-28 sm:w-40 md:w-52 lg:w-64 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
          <Link to={`/products/${product.id}`} className="block h-full">
            <ProductImage
              product={product}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 aspect-square"
              alt={product.name}
            />
          </Link>
        </div>
        
        {/* Content Section */}
        <div className="flex flex-col flex-1 min-w-0 justify-between py-0 sm:py-2">
          <div>
            {/* Category & Rating Row */}
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-green-50 text-green-800 truncate max-w-[80px] sm:max-w-none">
                {product.category || 'Discovery'}
              </span>
              <div className="flex items-center text-amber-400 ml-auto flex-shrink-0">
                <Star className="h-3 sm:h-3.5 w-3 sm:w-3.5 fill-current" />
                <span className="text-xs sm:text-sm font-bold text-gray-700 ml-0.5 sm:ml-1">{product.rating || '4.5'}</span>
                <span className="text-[10px] sm:text-xs text-gray-400 ml-0.5 sm:ml-1 font-medium hidden sm:inline">(2.4k)</span>
              </div>
            </div>
            
            {/* Product Name */}
            <Link to={`/products/${product.id}`}>
              <h3 className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-green-800 transition-colors line-clamp-2 sm:line-clamp-1">
                {product.name}
              </h3>
            </Link>
            
            {/* Description - Hidden on very small screens */}
            <p className="hidden sm:block text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2 sm:mb-4 font-normal">
              {product.shortDescription || product.description}
            </p>
            
            {/* Trust Badges - Simplified on mobile */}
            <div className="hidden md:flex flex-wrap items-center gap-4 text-[11px] text-gray-500 font-medium">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-500" /> Free Returns</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Get it by <b>Tomorrow</b></span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-500" /> Cash on Delivery</span>
            </div>
          </div>

          {/* Price & Actions Row */}
          <div className="flex items-center justify-between mt-2 sm:mt-4 gap-2 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
              <span className="text-lg sm:text-2xl md:text-3xl font-black text-[#131921]">₹{product.price.toLocaleString('en-IN')}</span>
              {product.originalPrice && (
                <span className="text-[10px] sm:text-sm text-gray-400 line-through font-medium">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              )}
            </div>
            <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
              <button 
                onClick={handleWishlistToggle}
                className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all shrink-0 ${
                  isInWishlist(product.id) ? 'bg-red-50 text-red-500 border-red-100' : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100'
                }`}
              >
                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
              </button>
              <AddToCartButton 
                product={product} 
                className="h-7 sm:h-10 px-2.5 sm:px-4 text-[11px] sm:text-xs"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [''];
  const hasMultipleImages = images.length > 1;
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 h-full" style={{ minHeight: 0 }}>

      {/* Image area — 4:3 on mobile (shorter), square on sm+ */}
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

        {/* Discount badge */}
        {discount > 0 && !product.featured && (
          <div className="absolute top-2 left-2">
            <span className="bg-red-500 text-white text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm">
              -{discount}%
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
        {/* Category */}
        {product.category && (
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
            {product.category}
          </span>
        )}

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${s <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
              ))}
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium">
              {product.rating.toFixed(1)}{product.reviewCount ? ` (${product.reviewCount})` : ''}
            </span>
          </div>
        )}

        {/* Product name */}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 hover:text-gray-700 transition-colors">
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
        <BuyNowButton
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="mt-1.5 sm:mt-3"
        />
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
