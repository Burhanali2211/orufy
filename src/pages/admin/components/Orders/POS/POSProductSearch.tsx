import React from 'react';
import { Search } from 'lucide-react';
import { Product } from './types';

interface POSProductSearchProps {
  search: string;
  setSearch: (value: string) => void;
  products: Product[];
  addToCart: (product: Product) => void;
  loading: boolean;
}

export const POSProductSearch: React.FC<POSProductSearchProps> = ({
  search,
  setSearch,
  products,
  addToCart,
  loading
}) => {
  return (
    <div className="relative mb-8">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search products by name or SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-lg"
      />
      
      {/* Search Results Dropdown */}
      {products.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="w-full flex items-center gap-4 p-4 hover:bg-amber-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <img src={product.images[0] || '/placeholder.png'} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-600">₹{(Number(product.price) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

