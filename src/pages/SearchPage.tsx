import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { ProductCard } from '../components/Product/ProductCard';
import { ProductDetails } from '../components/Product/ProductDetails';
import { useProducts } from '../contexts/ProductContext';
import { Product } from '../types';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { products } = useProducts();

  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);

    if (query.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchParams, products]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands, categories..."
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
              />
              <Search className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchParams({});
                  }}
                  className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {searchParams.get('q') ? (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Search Results for "{searchParams.get('q')}"
                </h1>
                <p className="text-gray-600 mt-1">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
                <p className="text-gray-600 mt-1">
                  {filteredProducts.length} products available
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Sort by: Relevance</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest</option>
              <option>Best Rating</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Results Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-gray-400 text-6xl mb-6">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {searchParams.get('q') ? 'No products found' : 'Start your search'}
              </h3>
              <p className="text-gray-600 mb-8">
                {searchParams.get('q') 
                  ? 'Try different keywords or browse our categories to find what you\'re looking for.'
                  : 'Enter a search term above to find products, brands, or categories.'
                }
              </p>
              {searchParams.get('q') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchParams({});
                  }}
                  className="btn-primary hover:scale-105 transition-transform duration-200"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id}>
                <ProductCard
                  product={product}
                />
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredProducts.length > 20 && (
          <div className="text-center mt-12">
            <button className="btn-primary hover:scale-105 transition-transform duration-200">
              Load More Products
            </button>
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
