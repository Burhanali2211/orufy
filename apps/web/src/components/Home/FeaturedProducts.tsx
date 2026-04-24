import React, { useEffect, memo } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { ProductGridSkeleton } from '../Common/ProductCardSkeleton';
import { HomepageProductCard } from '../Product/HomepageProductCard';
import { Link } from 'react-router-dom';

/**
 * FeaturedProducts Component
 * Amazon-style section with compact header and dense grid layout
 * 2 cards per row on mobile, 4 on desktop
 */
export const FeaturedProducts: React.FC = memo(() => {
    const { featuredProducts, featuredLoading, fetchFeaturedProducts } = useProducts();

    useEffect(() => {
        fetchFeaturedProducts(4);
    }, [fetchFeaturedProducts]);

    return (
        <section className="py-6 sm:py-8 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header - Amazon style */}
                <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-bold text-gray-900">⭐ Featured Products</span>
                    </div>
                    <Link to="/products?featured=true" className="text-sm font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1">
                        View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {/* Products Display */}
                {featuredLoading ? (
                    <ProductGridSkeleton count={4} variant="featured" />
                ) : featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                        {featuredProducts.map((product, index) => (
                            <div key={product.id} className="w-full">
                                <HomepageProductCard product={product} index={index} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
                            <Star className="h-10 w-10 text-amber-600" />
                        </div>
                        <p className="text-gray-900 text-xl font-semibold mb-2">No featured products yet</p>
                        <p className="text-gray-500">Check back soon for our curated picks!</p>
                    </div>
                )}
            </div>
        </section>
    );
});

FeaturedProducts.displayName = 'FeaturedProducts';

export default FeaturedProducts;
