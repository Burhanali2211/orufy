import React from 'react';

interface ProductCardSkeletonProps {
  variant?: 'featured' | 'bestseller' | 'latest';
}

/**
 * ProductCardSkeleton Component
 * Three distinct skeleton loader styles matching each product card design
 */
export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ variant = 'featured' }) => {
  // Featured Product Skeleton - Luxurious
  if (variant === 'featured') {
    return (
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
        {/* Image Skeleton */}
        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300"></div>
        
        {/* Content Skeleton */}
        <div className="p-5">
          {/* Category */}
          <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
          
          {/* Title */}
          <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-5 bg-gray-300 rounded w-1/2 mb-3"></div>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-3 bg-gray-200 rounded w-8"></div>
          </div>
          
          {/* Price */}
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-3"></div>
          
          {/* Description */}
          <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
        </div>
        
        {/* Bottom Border */}
        <div className="h-1 bg-gray-200"></div>
      </div>
    );
  }

  // Best Seller Skeleton - Bold
  if (variant === 'bestseller') {
    return (
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-md border-2 border-gray-200 animate-pulse">
        {/* Rank Badge */}
        <div className="absolute top-0 left-0 z-20">
          <div className="w-16 h-16 bg-gray-300 rounded-br-3xl"></div>
        </div>
        
        {/* Badge */}
        <div className="absolute top-3 right-3 z-10 h-6 w-24 bg-gray-300 rounded-full"></div>
        
        {/* Image Skeleton */}
        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300"></div>
        
        {/* Content Skeleton */}
        <div className="p-4">
          {/* Rating */}
          <div className="flex items-center justify-between mb-3">
            <div className="h-6 bg-gray-200 rounded-lg w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          
          {/* Title */}
          <div className="h-5 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-5 bg-gray-300 rounded w-2/3 mb-3"></div>
          
          {/* Price */}
          <div className="flex items-center gap-2">
            <div className="h-6 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  // Latest Arrival Skeleton - Minimalist
  return (
    <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-pulse">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 h-6 w-16 bg-gray-300 rounded-lg"></div>
      <div className="absolute top-3 right-3 z-10 h-6 w-20 bg-gray-200 rounded-lg"></div>
      
      {/* Image Skeleton */}
      <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300"></div>
      
      {/* Content Skeleton */}
      <div className="p-4">
        {/* Time Indicator */}
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        
        {/* Title */}
        <div className="h-5 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
        
        {/* Category Tag */}
        <div className="h-5 bg-gray-200 rounded w-20 mb-3"></div>
        
        {/* Price */}
        <div className="h-6 bg-gray-300 rounded w-24 mb-3"></div>
        
        {/* Description */}
        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
      
      {/* Bottom Line */}
      <div className="h-0.5 bg-gray-200"></div>
    </div>
  );
};

// Grid of Skeleton Cards
interface ProductGridSkeletonProps {
  count?: number;
  variant?: 'featured' | 'bestseller' | 'latest';
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ 
  count = 4, 
  variant = 'featured' 
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {[...Array(count)].map((_, index) => (
        <ProductCardSkeleton key={index} variant={variant} />
      ))}
    </div>
  );
};

export default ProductCardSkeleton;

