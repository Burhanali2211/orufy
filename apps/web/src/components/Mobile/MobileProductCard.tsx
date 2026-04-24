import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';

import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useNotification } from '../../contexts/NotificationContext';
import { MobileTouchButton, MobileIconButton } from '../Common/Button';
import { useSwipeGesture } from '../../hooks/useMobileGestures';
import ProductImage from '../Common/ProductImage';
import { useCartButtonStyles } from '../../hooks/useCartButtonStyles';

import { AddToCartButton } from '../Product/AddToCartButton';

interface MobileProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
}

export const MobileProductCard: React.FC<MobileProductCardProps> = ({
  product,
  variant = 'default'
}) => {
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const { addItem } = useCart();
  const { showNotification } = useNotification();
  const { cartButtonText } = useCartButtonStyles();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Swipe gesture for image carousel
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: () => {
      if (product.images.length > 1) {
        setCurrentImageIndex(prev =>
          prev === product.images.length - 1 ? 0 : prev + 1
        );
      }
    },
    onSwipeRight: () => {
      if (product.images.length > 1) {
        setCurrentImageIndex(prev =>
          prev === 0 ? product.images.length - 1 : prev - 1
        );
      }
    }
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (product.stock > 0) {
      addItem(product);
      showNotification({
        type: 'success',
        title: 'Added to Cart',
        message: `${product.name} has been added to your cart.`,
        duration: 3000
      });
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addToWishlist(product);
    showNotification({
      type: 'success',
      title: isInWishlist(product.id) ? 'Removed from Wishlist' : 'Added to Wishlist',
      message: `${product.name} has been ${isInWishlist(product.id) ? 'removed from' : 'added to'} your wishlist.`,
      duration: 3000
    });
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const stockStatus = {
    text: product.stock > 10 ? 'In Stock' : product.stock > 0 ? `${product.stock} left` : 'Out of Stock',
    color: product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'
  };

  if (variant === 'compact') {
    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden"
      >
        <Link to={`/products/${product.id}`} className="block">
          <div className="flex">
            {/* Compact Image */}
            <div className="w-16 sm:w-20 h-16 sm:h-20 flex-shrink-0 relative">
              <ProductImage
                product={product}
                className="w-full h-full object-cover"
                alt={product.name}
                size="small"
              />
              {discount > 0 && (
                <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1 py-0.5 rounded font-bold">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Compact Content */}
            <div className="flex-1 p-2.5 min-h-[64px] sm:min-h-[80px] flex flex-col justify-between">
              <div>
                <h3 className="font-medium text-neutral-900 text-xs leading-tight line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-[10px] text-neutral-500 mt-1">{product.category}</p>
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-neutral-900 text-xs">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.originalPrice && (
                    <span className="text-[10px] text-neutral-500 line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] text-neutral-600">{product.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="product-card bg-white overflow-hidden rounded-lg sm:rounded-xl shadow-sm border border-neutral-200"
    >
      {/* Mobile-Optimized Image Section */}
      <div className="relative">
        <Link to={`/products/${product.id}`} className="block">
          <div
            className="aspect-square relative overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <ProductImage
              product={product}
              className="w-full h-full object-cover transition-transform duration-300"
              alt={product.name}
              size="medium"
            />

            {/* Image indicators for multiple images */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-1 h-1 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Mobile-Optimized Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col space-y-1">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
              -{discount}%
            </span>
          )}

          <span className={`${stockStatus.color} text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm flex items-center space-x-1`}>
            <div className={`w-1 h-1 rounded-full bg-white ${product.stock > 0 ? 'animate-pulse' : ''}`}></div>
            <span>{stockStatus.text}</span>
          </span>
        </div>

        {/* Mobile Action Buttons */}
        <div className="absolute top-1.5 right-1.5 flex flex-col space-y-1.5">
          <MobileIconButton
            icon={Heart}
            onClick={handleWishlistToggle}
            variant={isInWishlist(product.id) ? 'primary' : 'secondary'}
            size="minimum"
            ariaLabel={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
            active={isInWishlist(product.id)}
          />


        </div>
      </div>

      {/* Mobile-Optimized Content */}
      <div className="p-2.5 sm:p-3 space-y-2">
        <div>
          <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
            {product.category}
          </p>
          <Link to={`/products/${product.id}`}>
            <h3 className="font-medium text-neutral-900 text-sm leading-tight line-clamp-2 mt-0.5">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price and Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-neutral-900 text-base">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && (
              <span className="text-xs text-neutral-500 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-neutral-600 font-medium">{product.rating}</span>
          </div>
        </div>

        {/* Mobile Add to Cart Button */}
        <AddToCartButton 
          product={product}
          className="w-full"
          size="md"
        />
      </div>
    </div>
  );
};