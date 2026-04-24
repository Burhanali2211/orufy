import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '@/types';
import { useStorefrontCart } from '../StorefrontCartContext';

export default function StorefrontProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useStorefrontCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setAdded(false);
    fetch(`/api/shop/products/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error('Failed to load product');
        return r.json() as Promise<Product>;
      })
      .then(data => { if (data) setProduct(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!product || product.stock <= 0) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 mt-4">
        <div className="aspect-square max-w-sm bg-gray-200 rounded-lg" />
        <div className="h-6 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-20 bg-gray-200 rounded" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Product not found.</p>
        <Link to="/" className="text-sm text-blue-600 hover:underline">Back to shop</Link>
      </div>
    );
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const outOfStock = product.stock <= 0;
  const image = product.images?.[0];

  return (
    <div className="pb-8">
      <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Image */}
        <div className="aspect-square max-w-sm w-full bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {image ? (
            <img src={image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300">
              {product.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1">
          {product.category && (
            <span className="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mb-2">
              {product.category}
            </span>
          )}

          {outOfStock && (
            <span className="inline-block text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full mb-2 ml-2">
              Out of stock
            </span>
          )}

          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl font-semibold text-gray-900">
              ₹{(product.price / 100).toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="text-gray-400 line-through text-base">
                ₹{(product.originalPrice! / 100).toFixed(0)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-gray-600 mt-4 text-sm whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Quantity */}
          {!outOfStock && (
            <div className="flex items-center gap-3 mt-6">
              <span className="text-sm text-gray-600">Quantity</span>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-lg leading-none"
                >
                  −
                </button>
                <span className="px-4 py-1.5 text-sm font-medium border-x border-gray-300">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-lg leading-none"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="mt-4 bg-blue-600 text-white w-full sm:max-w-xs py-3 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {outOfStock ? 'Out of stock' : added ? 'Added!' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
