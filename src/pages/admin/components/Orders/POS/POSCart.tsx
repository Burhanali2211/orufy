import React from 'react';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { Product, CartItem } from './types';

interface POSCartProps {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
}

export const POSCart: React.FC<POSCartProps> = ({ cart, updateQuantity, removeFromCart }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-amber-600" />
          Order Items
        </h3>
        <span className="text-sm font-medium text-gray-500">{cart.length} items</span>
      </div>
      <div className="divide-y divide-gray-100">
        {cart.length > 0 ? (
          cart.map(item => (
            <div key={item.id} className="p-6 flex items-center gap-6">
              <img src={item.images[0] || '/placeholder.png'} alt="" className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                <p className="text-sm text-amber-600 font-semibold mt-1">₹{(Number(item.price) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => updateQuantity(item.id, -1)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-bold text-gray-900 min-w-[20px] text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, 1)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="w-24 text-right">
                <p className="font-bold text-gray-900">₹{(Number(item.price * item.quantity) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <button 
                onClick={() => removeFromCart(item.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500">Cart is empty. Search products to add.</p>
          </div>
        )}
      </div>
    </div>
  );
};

