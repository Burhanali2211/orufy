import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useStorefrontCart } from './StorefrontCartContext';
import { useShopSettings } from './useShopSettings';

function CartIcon() {
  const { itemCount } = useStorefrontCart();
  return (
    <Link to="/cart" className="relative inline-flex items-center p-1">
      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  );
}

export function StorefrontLayout({ children }: { children: ReactNode }) {
  const { settings } = useShopSettings();
  const shopName = settings?.name ?? 'Shop';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gray-900 truncate max-w-[60%]">
            {shopName}
          </Link>
          <CartIcon />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-4">
        {children}
      </main>

      <footer className="border-t border-gray-100 py-4">
        <p className="text-xs text-gray-400 text-center">Powered by Orufy</p>
      </footer>
    </div>
  );
}
