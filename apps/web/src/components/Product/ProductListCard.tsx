import React, { useState } from 'react';
import { Star, Heart, ShoppingCart, Check } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { MiniTrustIndicators } from '../Trust';
import ProductImage from '../Common/ProductImage';
import { useCartButtonState } from '../../hooks/useCartButtonState';

import { AddToCartButton } from './AddToCartButton';

interface ProductListCardProps {
  product: Product;
}

export const ProductListCard: React.FC<ProductListCardProps> = ({ product }) => {
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const { isInCart, justAdded, markAsJustAdded, buttonState } = useCartButtonState(product);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addToWishlist(product);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const getStockStatus = () => {
    if (product.stock === 0) return { text: 'Out of Stock', color: 'bg-red-500', textColor: 'text-red-600' };
    if (product.stock <= 5) return { text: 'Low Stock', color: 'bg-orange-500', textColor: 'text-orange-600' };
    return { text: 'In Stock', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="product-list-card group flex flex-col sm:flex-row bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 touch-manipulation">
      {/* Product Image Section */}
      <div className="relative overflow-hidden group/image bg-gray-50 sm:w-48 flex-shrink-0">
        <Link to={`/products/${product.id}`} className="block h-full">
          <div className="aspect-[4/3] sm:aspect-square h-full relative overflow-hidden">
            <ProductImage
              product={product}
              className="w-full h-full object-cover"
              alt={product.name}
              size="medium"
            />

            {/* Image Navigation - Amazon Style */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                      index === currentImageIndex
                        ? 'bg-white shadow-md'
                        : 'bg-white/70 hover:bg-white/90'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Subtle Overlay */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </Link>

        {/* Amazon-Style Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1 z-10">
          {discount > 0 && (
            <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-sm">
              -{discount}% OFF
            </span>
          )}

          {product.stock <= 0 && (
            <span className="bg-gray-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-sm">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Information Section */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="space-y-2 flex-1">
            <span className="text-xs text-gray-600 uppercase tracking-wide font-medium">
              {product.category}
            </span>
            <Link to={`/products/${product.id}`}>
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {product.name}
              </h3>
            </Link>
            
            {/* Rating */}
            <div className="flex items-center space-x-1">
              <div className="flex items-center space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">({product.rating})</span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              {discount > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-1.5 py-0.5 rounded">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center">
              <span className={`text-sm font-medium ${
                product.stock > 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                {product.stock > 0 ? (product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`) : 'Out of stock'}
              </span>
            </div>

            {/* Trust Indicators */}
            <div className="pt-2 border-t border-gray-100">
              <MiniTrustIndicators
                freeShipping={product.price >= 2000}
                warranty={true}
                returns={true}
                className="justify-start"
              />
            </div>
          </div>

            {/* Action Buttons - Positioned at the bottom right */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
              <div className="flex sm:flex-col gap-2 sm:gap-3">
                <button
                  onClick={handleWishlistToggle}
                  className={`p-2 rounded-full shadow-sm border transition-colors duration-200 ${
                    isInWishlist(product.id)
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-white text-gray-600 hover:text-red-500 border-gray-200 hover:border-red-200'
                  } touch-manipulation`}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <AddToCartButton 
                product={product}
                className="min-w-[140px]"
              />
            </div>
        </div>
      </div>
    </div>
  );
};