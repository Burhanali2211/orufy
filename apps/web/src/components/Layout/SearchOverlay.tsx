import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, ArrowRight, Leaf } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { useSettings } from '../../contexts/SettingsContext';
import ProductImage from '../Common/ProductImage';
import { Product } from '../../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const trendingSearches = ['Elegant Dresses', 'Floral Tops', 'Silk Scarves', 'Modern Abaya', 'Accessories', 'Gift Cards'];

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, initialQuery = '' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { products } = useProducts();
  const { getSiteSetting } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const siteName = getSiteSetting('site_name') || 'Orufy';
  const logoUrl = getSiteSetting('logo_url');

  // Sync initial query when overlay opens
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }, [isOpen, initialQuery]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Debounced local filter — 250ms, zero DB queries
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const timer = setTimeout(() => {
      const term = query.toLowerCase();
      const filtered = products
        .filter(p =>
          p.name.toLowerCase().includes(term) ||
          (p.category && p.category.toLowerCase().includes(term)) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(term)) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
        )
        .slice(0, 6);
      setSuggestions(filtered);
      setActiveIndex(-1);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, products]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const q = activeIndex >= 0 && suggestions[activeIndex]
      ? suggestions[activeIndex].name
      : query;
    if (!q.trim()) return;
    navigate(`/products?q=${encodeURIComponent(q.trim())}`);
    onClose();
  }, [query, activeIndex, suggestions, navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        navigate(`/products/${suggestions[activeIndex].id}`);
        onClose();
      } else {
        handleSubmit();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="min-h-screen pt-16 pb-10 px-4 overflow-y-auto">
        <div
          className="max-w-2xl mx-auto"
          onClick={e => e.stopPropagation()}
        >

          {/* Brand header inside overlay */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              {/* Logo from DB, fallback to Leaf icon */}
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="w-7 h-7 object-contain rounded-lg"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-white font-bold text-sm">{siteName}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search input */}
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, categories..."
                className="w-full pl-12 pr-12 py-4 text-base bg-white rounded-2xl shadow-2xl border-0 focus:outline-none focus:ring-2 focus:ring-green-400"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Results panel */}
          <div className="mt-3 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {suggestions.length > 0 ? (
              <>
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</p>
                  <span className="text-xs text-gray-400">{suggestions.length} found</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {suggestions.map((product, idx) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      onClick={onClose}
                      className={`flex items-center gap-3 p-3 transition-colors group ${activeIndex === idx ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                    >
                      <ProductImage
                        product={{ id: product.id, name: product.name, images: product.images }}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        alt={product.name}
                        size="small"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm group-hover:text-green-800 transition-colors">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-semibold text-gray-800">₹{product.price.toLocaleString('en-IN')}</span>
                          {product.category && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{product.category}</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-green-600 flex-shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
                <Link
                  to={`/products?q=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors border-t border-gray-100"
                >
                  See all results for "{query}"
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : query.length >= 2 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-gray-500 text-sm">No products found for "<strong>{query}</strong>"</p>
                <Link
                  to={`/products?q=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="inline-block mt-3 text-sm font-semibold text-green-700 hover:text-green-800"
                >
                  Search in all products →
                </Link>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Popular Searches</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-green-100 hover:text-green-800 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-white/50">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">↑↓</kbd> navigate &nbsp;
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">Enter</kbd> select &nbsp;
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 font-mono">Esc</kbd> close
          </p>
        </div>
      </div>
    </div>
  );
};
