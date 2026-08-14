import React, { useEffect, memo } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProducts } from '../../contexts/ProductContext';
import { ProductGridSkeleton } from '../Common/ProductCardSkeleton';
import { HomepageProductCard } from '../Product/HomepageProductCard';
import { Link } from 'react-router-dom';

/**
 * FeaturedProducts Component
 * Modernized with luxury editorial header and staggered entrance
 */
export const FeaturedProducts: React.FC = memo(() => {
    const { featuredProducts, featuredLoading, fetchFeaturedProducts } = useProducts();

    useEffect(() => {
        fetchFeaturedProducts(8, true);
    }, [fetchFeaturedProducts]);

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-1">
                        <h2 className="text-[28px] font-normal text-[#202124] leading-tight">
                            Featured Essentials
                        </h2>
                        <p className="text-[#5f6368] text-[16px] font-normal">Handpicked premium products curated just for you.</p>
                    </div>
                    
                    <Link to="/products?featured=true" className="group flex items-center gap-1.5 text-[14px] font-medium text-[#1A73E8] hover:text-[#1557B0] transition-colors">
                        Discover More <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Products Display — 2 full rows (8 products) */}
                {featuredLoading ? (
                    <ProductGridSkeleton count={8} variant="featured" />
                ) : featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
                        {featuredProducts.map((product, index) => (
                            <HomepageProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[24px] border border-gray-200">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f8f9fa] rounded-full mb-6 border border-gray-100">
                            <Star className="h-8 w-8 text-[#5f6368]" />
                        </div>
                        <h3 className="text-[#202124] text-[22px] font-normal mb-2">Refining Our Picks</h3>
                        <p className="text-[#5f6368] text-[16px] font-normal max-w-xs mx-auto">Our editors are currently hand-selecting new featured pieces for you.</p>
                    </div>
                )}
            </div>
        </section>
    );
});

FeaturedProducts.displayName = 'FeaturedProducts';

export default FeaturedProducts;
