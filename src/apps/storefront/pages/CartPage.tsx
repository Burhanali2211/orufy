import React from 'react';
import { CustomerCartPage } from '@/apps/customer/pages/CustomerCartPage';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CartPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50/60 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <Link 
              to="/products" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wider mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-stone-800" />
              Your Shopping Cart
            </h1>
          </div>
        </div>

        {/* Cart Contents */}
        <CustomerCartPage />

      </div>
    </div>
  );
};

export default CartPage;
