import React, { useState, useEffect, memo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useProducts } from '@/shared/contexts/ProductContext';
import { ProductCard } from './ProductCard';

interface ProductRecommendationsProps {
  currentProduct?: Product;
  type?: 'related' | 'frequently-bought' | 'you-may-like' | 'recently-viewed';
  title?: string;
  subtitle?: string;
  maxItems?: number;
  className?: string;
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = memo(({
  currentProduct,
  type = 'related',
  title,
  subtitle,
  maxItems = 4,
  className = ''
}) => {
  const { products } = useProducts();
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!products || products.length === 0) return;

    let list = products;
    if (currentProduct) {
      // 1. Same category first
      const sameCat = products.filter(
        (p) => p.id !== currentProduct.id && p.category && p.category === currentProduct.category
      );
      const other = products.filter(
        (p) => p.id !== currentProduct.id && (!p.category || p.category !== currentProduct.category)
      );
      list = [...sameCat, ...other];
    }

    setRecommendedProducts(list.slice(0, maxItems));
  }, [currentProduct, products, maxItems]);

  if (recommendedProducts.length === 0) {
    return null;
  }

  const defaultTitle = type === 'related' ? 'You May Also Like' : 'Recommended For You';
  const defaultSubtitle = 'Hand-picked pieces curated to complement your selection';

  return (
    <section className={`py-12 bg-white ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-stone-700" />
            {title || defaultTitle}
          </h3>
          <p className="text-sm text-stone-500">{subtitle || defaultSubtitle}</p>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-xs font-bold text-stone-900 hover:text-stone-700 transition-colors uppercase tracking-wider"
        >
          View Collection <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Unified Product Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {recommendedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
});

ProductRecommendations.displayName = 'ProductRecommendations';

export default ProductRecommendations;