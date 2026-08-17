import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Sparkles } from 'lucide-react';
import { ProductCard } from '@/shared/components/Product/ProductCard';
import { ProductDetails } from '@/shared/components/Product/ProductDetails';
import { useProducts } from '@/shared/contexts/ProductContext';
import { Product } from '@/shared/types';
import { useProductFilters } from '@/shared/hooks/useProductFilters';

export const SearchPage: React.FC = () => {
  const { search, setSearch, sort, setSort, resetFilters } = useProductFilters();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products } = useProducts();

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(product =>
        (product.name && product.name.toLowerCase().includes(q)) ||
        (product.description && product.description.toLowerCase().includes(q)) ||
        (product.category && product.category.toLowerCase().includes(q)) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    if (sort === 'price_asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price_desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return list;
  }, [products, search, sort]);

  return (
    <div className="min-h-screen bg-stone-50/50">
      {/* Search Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-xs border-b border-stone-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={(e) => e.preventDefault()} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collection, notes, fragrances..."
                className="w-full pl-12 pr-12 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 focus:bg-white text-base transition-all outline-none"
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-3.5 p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            {search ? (
              <div>
                <h1 className="text-2xl font-serif font-bold text-stone-900">
                  Search Results for "{search}"
                </h1>
                <p className="text-stone-500 text-sm mt-1">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-serif font-bold text-stone-900">All Products</h1>
                <p className="text-stone-500 text-sm mt-1">
                  {filteredProducts.length} items in catalog
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900 shadow-xs"
            >
              <option value="newest">Sort by: Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif text-stone-900 mb-2">
              {search ? 'No matches found' : 'Explore the Catalog'}
            </h3>
            <p className="text-stone-500 text-sm mb-6 max-w-sm mx-auto">
              {search 
                ? `We couldn't find any products matching "${search}". Try checking for spelling or searching for a different scent.`
                : 'Browse our full luxury fragrance collection.'
              }
            </p>
            {search && (
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
              >
                Clear Search Query
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default SearchPage;
