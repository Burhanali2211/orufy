import React from 'react';
import { useProducts } from '../contexts/ProductContext';
import { ProductCard } from '../components/Product/ProductCard';
import { Clock } from 'lucide-react';

export const NewArrivalsPage: React.FC = () => {
  const { products } = useProducts();

  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20); // Get top 20 new arrivals

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Arrivals</h1>
              <p className="text-gray-600 mt-1">
                Check out the latest additions to our collection.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {newArrivals.map((product, index) => (
            <div key={product.id}>
              <ProductCard 
                product={product} 
                imagePriority={index < 4 ? 'critical' : 'normal'}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewArrivalsPage;
