import React from 'react';

/**
 * SkeletonScreens.tsx
 * Comprehensive skeleton loading screens for all public pages
 * Replaces all loaders/spinners with smooth skeleton screens
 */

// ============================================================================
// PRODUCT LIST / GRID SKELETON
// ============================================================================

export const ProductListSkeleton: React.FC<{ count?: number; columns?: number }> = ({
  count = 12,
  columns = 4
}) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${columns} gap-4`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg overflow-hidden border border-gray-200 hidden">
          {/* Image */}
          <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300" />

          {/* Content */}
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-5 bg-gray-300 rounded w-full" />
            <div className="h-5 bg-gray-300 rounded w-2/3" />
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-300 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// PRODUCT DETAIL PAGE SKELETON
// ============================================================================

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 hidden">
      {/* Left: Image Gallery */}
      <div>
        {/* Main Image */}
        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-4" />

        {/* Thumbnails */}
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Right: Product Info */}
      <div className="space-y-6">
        {/* Category */}
        <div className="h-4 bg-gray-200 rounded w-1/4" />

        {/* Title */}
        <div>
          <div className="h-8 bg-gray-300 rounded w-full mb-2" />
          <div className="h-6 bg-gray-300 rounded w-3/4" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-5 w-5 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded w-12" />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-300 rounded w-1/3" />
          <div className="h-5 bg-gray-200 rounded w-1/4" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full" />
          ))}
        </div>

        {/* Stock Status */}
        <div className="h-5 bg-gray-200 rounded w-1/3" />

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <div className="h-12 bg-gray-300 rounded-lg flex-1" />
          <div className="h-12 bg-gray-200 rounded-lg w-12" />
        </div>

        {/* Specifications */}
        <div className="border-t pt-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-300 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SEARCH RESULTS SKELETON
// ============================================================================

export const SearchResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>

      {/* Results */}
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-4 border border-gray-200 rounded-lg p-4">
            {/* Image */}
            <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-300 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
              <div className="flex justify-between items-center mt-3">
                <div className="h-6 bg-gray-300 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CART PAGE SKELETON
// ============================================================================

export const CartSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 hidden">
      {/* Left: Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 flex gap-4">
            {/* Product Image */}
            <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0" />

            {/* Product Info */}
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-300 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />

              {/* Quantity & Price */}
              <div className="flex justify-between items-center mt-3">
                <div className="h-6 bg-gray-200 rounded w-20" />
                <div className="h-6 bg-gray-300 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Checkout Summary */}
      <div className="border border-gray-200 rounded-lg p-6 h-fit space-y-4">
        {/* Items */}
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-300 rounded w-1/4" />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Total */}
        <div className="flex justify-between">
          <div className="h-6 bg-gray-300 rounded w-1/4" />
          <div className="h-6 bg-gray-300 rounded w-1/4" />
        </div>

        {/* Checkout Button */}
        <div className="h-12 bg-gray-300 rounded-lg mt-6" />
      </div>
    </div>
  );
};

// ============================================================================
// CHECKOUT PAGE SKELETON
// ============================================================================

export const CheckoutSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 hidden">
      {/* Left: Forms */}
      <div className="lg:col-span-2 space-y-6">
        {/* Shipping Info */}
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>

        {/* Billing Info */}
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>

        {/* Payment */}
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>

      {/* Right: Order Summary */}
      <div className="border border-gray-200 rounded-lg p-6 h-fit space-y-4">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4" />

        {/* Order Items */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-3 pb-4 border-b border-gray-200">
            <div className="w-16 h-16 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}

        {/* Pricing */}
        <div className="space-y-2 pt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-300 rounded w-1/4" />
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-4 flex justify-between">
          <div className="h-6 bg-gray-300 rounded w-1/3" />
          <div className="h-6 bg-gray-300 rounded w-1/4" />
        </div>

        {/* Checkout Button */}
        <div className="h-12 bg-gray-300 rounded-lg mt-6" />
      </div>
    </div>
  );
};

// ============================================================================
// WISHLIST PAGE SKELETON
// ============================================================================

export const WishlistSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 bg-gray-300 rounded w-1/4" />
      </div>

      {/* Items */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Image */}
            <div className="aspect-square bg-gray-200" />

            {/* Content */}
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-5 bg-gray-300 rounded w-3/4" />
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-300 rounded w-1/3" />
                <div className="h-8 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ORDER HISTORY SKELETON
// ============================================================================

export const OrderHistorySkeleton: React.FC = () => {
  return (
    <div className="space-y-4 hidden">
      {/* Header */}
      <div className="h-6 bg-gray-300 rounded w-1/4 mb-6" />

      {/* Order List */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="h-5 bg-gray-300 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
            <div className="h-5 bg-gray-300 rounded w-1/4" />
          </div>

          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/5" />
            </div>
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// CATEGORY PAGE SKELETON
// ============================================================================

export const CategoryPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="hidden">
        <div className="h-12 bg-gray-300 rounded w-1/3 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-2/3" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 hidden">
        <div className="h-6 bg-gray-300 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-5 bg-gray-200 rounded w-1/3" />
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <ProductListSkeleton count={12} />
    </div>
  );
};

// ============================================================================
// HOMEPAGE SECTIONS SKELETON
// ============================================================================

export const FeaturedProductsSectionSkeleton: React.FC = () => {
  return (
    <div className="hidden">
      <div className="h-8 bg-gray-300 rounded w-1/4 mb-6" />
      <ProductListSkeleton count={4} columns={4} />
    </div>
  );
};

export const BestSellersSectionSkeleton: React.FC = () => {
  return (
    <div className="hidden">
      <div className="h-8 bg-gray-300 rounded w-1/4 mb-6" />
      <ProductListSkeleton count={6} columns={3} />
    </div>
  );
};

export const LatestArrivalsSectionSkeleton: React.FC = () => {
  return (
    <div className="hidden">
      <div className="h-8 bg-gray-300 rounded w-1/4 mb-6" />
      <ProductListSkeleton count={5} columns={5} />
    </div>
  );
};

// ============================================================================
// PROFILE PAGE SKELETON
// ============================================================================

export const ProfilePageSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 hidden">
      {/* Sidebar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Avatar */}
        <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* Name */}
        <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-6" />

        {/* Menu Items */}
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="h-6 bg-gray-300 rounded w-1/4 mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between py-3 border-b border-gray-200">
            <div className="h-5 bg-gray-200 rounded w-1/4" />
            <div className="h-5 bg-gray-300 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  ProductListSkeleton,
  ProductDetailSkeleton,
  SearchResultsSkeleton,
  CartSkeleton,
  CheckoutSkeleton,
  WishlistSkeleton,
  OrderHistorySkeleton,
  CategoryPageSkeleton,
  FeaturedProductsSectionSkeleton,
  BestSellersSectionSkeleton,
  LatestArrivalsSectionSkeleton,
  ProfilePageSkeleton,
};
