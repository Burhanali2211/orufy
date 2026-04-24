import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { useShopSettings } from '../useShopSettings';
import { useStorefrontCart } from '../StorefrontCartContext';

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useStorefrontCart();
  const image = product.images?.[0];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="flex flex-col">
      <Link to={`/products/${product.id}`} className="block">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
              {product.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 mt-2 truncate">{product.name}</p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-sm font-semibold text-gray-900">
            ₹{(product.price / 100).toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ₹{(product.originalPrice! / 100).toFixed(0)}
            </span>
          )}
        </div>
      </Link>
      <button
        onClick={() => addItem(product, 1)}
        disabled={product.stock <= 0}
        className="w-full mt-2 border border-gray-300 text-gray-700 text-sm py-1.5 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {product.stock <= 0 ? 'Out of stock' : 'Add to cart'}
      </button>
    </div>
  );
}

export default function StorefrontHomePage() {
  const { settings, loading: settingsLoading } = useShopSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch('/api/shop/products?limit=40')
      .then(r => r.json())
      .then((data: { products?: Product[] } | Product[]) => {
        const list = Array.isArray(data) ? data : data.products ?? [];
        setProducts(list);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  const bannerUrl = settings?.settings?.bannerUrl;

  return (
    <div>
      {/* Banner */}
      <div className="w-full max-h-48 rounded-lg overflow-hidden mb-6 bg-gray-100 flex items-center justify-center">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="w-full max-h-48 object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-32 flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
            <span className="text-xl font-bold text-gray-500">
              {settingsLoading ? '' : (settings?.name ?? 'Welcome')}
            </span>
          </div>
        )}
      </div>

      {/* Products grid */}
      {loadingProducts ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="h-3 bg-gray-200 rounded mt-2 w-3/4" />
              <div className="h-3 bg-gray-200 rounded mt-1 w-1/3" />
              <div className="h-8 bg-gray-200 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-400 py-16 text-sm">No products yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
