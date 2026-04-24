import React from 'react';
import { useProducts } from '../../contexts/ProductContext';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PerfectPairProps {
  currentProduct: Product;
}

export const PerfectPair: React.FC<PerfectPairProps> = ({ currentProduct }) => {
  const { products } = useProducts();

  // Simple logic: Find another product in the same category that isn't the current one
  const pair = products.find(p => p.categoryId === currentProduct.categoryId && p.id !== currentProduct.id);

  if (!pair) return null;

  return (
    <div className="py-16 border-t border-stone-200">
      <div className="flex flex-col md:flex-row items-center gap-12 bg-white p-8 md:p-12 rounded-luxury-xl shadow-luxury border border-stone-100 relative overflow-hidden">
        <div className="flex-1 space-y-6 relative z-10">
          <div className="flex items-center gap-2 text-stone-400 text-[10px] uppercase tracking-[0.3em] font-bold">
            <Sparkles className="h-4 w-4 text-amber-400" /> Olfactory Synergy
          </div>
          <h3 className="font-serif text-4xl text-stone-900 leading-tight">The Perfect Layer</h3>
          <p className="text-stone-500 font-light leading-relaxed max-w-md">
            Enhance the depth of <strong>{currentProduct.name}</strong> by layering it with <strong>{pair.name}</strong>. 
            This combination creates a unique, complex trail that is uniquely yours.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <div className="h-px w-12 bg-stone-200" />
            <span className="text-xs text-stone-400 italic">Recommended by our Spice Experts</span>
          </div>
        </div>

        <div className="w-full md:w-72 flex-shrink-0 relative z-10">
          <ProductCard product={pair} />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-50 rounded-full blur-3xl -ml-24 -mb-24 opacity-30" />
      </div>
    </div>
  );
};
