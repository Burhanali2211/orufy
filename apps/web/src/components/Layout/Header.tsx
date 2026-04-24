import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, ChevronDown, LogOut, Leaf, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useProducts } from '../../contexts/ProductContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Product } from '../../types';

interface HeaderProps {
  onAuthClick: () => void;
  onCartClick: () => void;
}

// Reusable inline search with live dropdown
const SearchBar: React.FC<{ mobile?: boolean }> = ({ mobile = false }) => {
  const { products } = useProducts();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced local filter — 220ms, zero DB queries
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
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
      setResults(filtered);
      setOpen(filtered.length > 0 || query.trim().length >= 2);
      setActiveIdx(-1);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, products]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goToSearch = useCallback(() => {
    if (!query.trim()) return;
    navigate(`/products?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
    setOpen(false);
  }, [query, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && results[activeIdx]) {
        navigate(`/products/${results[activeIdx].id}`);
        setQuery('');
        setOpen(false);
      } else {
        goToSearch();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapRef} className={`relative ${mobile ? 'w-full' : 'flex-1 max-w-xl'}`}>
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && results.length > 0 && setOpen(true)}
          placeholder={mobile ? 'Search bags, baskets, artisan craft...' : 'Search woven bags, handmade baskets, woolen craft...'}
          className="w-full pl-9 pr-16 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-gray-300 transition-all placeholder-gray-400"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-9 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={goToSearch}
          className="absolute right-0 top-0 bottom-0 px-3 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown results */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[200]">
          {results.length > 0 ? (
            <>
              {results.map((product, idx) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  onClick={() => { setQuery(''); setOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors group ${activeIdx === idx ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Search className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-green-800 transition-colors">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-gray-700">₹{product.price.toLocaleString('en-IN')}</span>
                      {product.category && (
                        <span className="text-xs text-gray-400">{product.category}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-green-600 flex-shrink-0 transition-colors" />
                </Link>
              ))}
              {/* View all */}
              <button
                onClick={goToSearch}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors border-t border-gray-100"
              >
                See all results for "{query}"
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-gray-500">No results for "<strong>{query}</strong>"</p>
              <button
                onClick={goToSearch}
                className="mt-2 text-xs font-semibold text-green-700 hover:text-green-800"
              >
                Search all products →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ onAuthClick, onCartClick }) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { categories } = useProducts();
  const { getSiteSetting } = useSettings();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const shopDropdownRef = useRef<HTMLDivElement>(null);

  const siteName = getSiteSetting('site_name') || 'Orufy';
  const logoUrl = getSiteSetting('logo_url');
  const nameParts = siteName.trim().split(/\s+/);
  const nameFirst = nameParts[0];
  const nameRest = nameParts.slice(1).join(' ');

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsShopDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(e.target as Node)) setIsShopDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { setIsScrolled(window.scrollY > 4); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const categoryItems = useMemo(() => categories.filter(c => c.isActive !== false), [categories]);
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${isScrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>

      {/* ROW 1: Logo · Search · Icons */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center gap-3 h-14">

        {/* Logo — raw image from DB, Leaf icon fallback, no container box */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0"
          onClick={() => window.scrollTo(0, 0)}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              className="w-7 h-7 object-contain"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <Leaf className="w-6 h-6 text-gray-900 flex-shrink-0" />
          )}
          <div className="leading-none">
            <span className="block text-[13px] font-black text-gray-900 tracking-tight leading-none">
              {nameFirst}
            </span>
            {nameRest && (
              <span className="block text-[10px] font-semibold text-gray-400 tracking-widest uppercase leading-none mt-0.5">
                {nameRest}
              </span>
            )}
          </div>
        </Link>

        {/* Desktop live search */}
        <div className="hidden md:flex flex-1 mx-4">
          <SearchBar />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 ml-auto">

          <Link
            to="/wishlist"
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all hidden sm:flex"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistItems.length > 0 && (
              <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-gray-900 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
              </span>
            )}
          </Link>

          <div className="relative hidden sm:block" ref={userMenuRef}>
            <button
              onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : navigate('/auth')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              aria-label={user ? 'My account' : 'Sign in'}
            >
              <User className="h-[18px] w-[18px]" />
              <span className="text-xs font-medium hidden lg:block">
                {user ? (user.name?.split(' ')[0] || 'Account') : 'Sign in'}
              </span>
            </button>
            {isUserMenuOpen && user && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 pb-2 mb-1 border-b border-gray-100">
                  <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900" onClick={() => setIsUserMenuOpen(false)}>
                  <User className="h-4 w-4" /> My Profile
                </Link>
                <Link to="/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900" onClick={() => setIsUserMenuOpen(false)}>
                  <ShoppingCart className="h-4 w-4" /> My Orders
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onCartClick}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-gray-900 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE ROW 2: Live search bar */}
      <div className="md:hidden px-4 pb-2.5">
        <SearchBar mobile />
      </div>

      {/* DESKTOP ROW 2: Nav */}
      <div className="hidden md:block border-t border-green-100/70 bg-green-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center justify-center h-11 gap-0.5 text-sm">

            {/* Home */}
            <Link
              to="/"
              className={`relative px-4 h-8 flex items-center rounded-md font-semibold text-[13px] tracking-wide transition-all duration-150 ${
                isActive('/')
                  ? 'text-green-900 bg-green-100'
                  : 'text-gray-600 hover:text-green-900 hover:bg-green-50'
              }`}
            >
              Home
              {isActive('/') && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-green-700 rounded-full" />}
            </Link>

            {/* Shop dropdown */}
            <div className="relative h-full flex items-center" ref={shopDropdownRef}>
              <button
                onClick={() => setIsShopDropdownOpen(!isShopDropdownOpen)}
                className={`relative flex items-center gap-1.5 px-4 h-8 rounded-md font-semibold text-[13px] tracking-wide transition-all duration-150 ${
                  isActive('/products')
                    ? 'text-green-900 bg-green-100'
                    : 'text-gray-600 hover:text-green-900 hover:bg-green-50'
                }`}
              >
                Shop All
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isShopDropdownOpen ? 'rotate-180' : ''}`} />
                {isActive('/products') && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-green-700 rounded-full" />}
              </button>

              {isShopDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-56 bg-white shadow-2xl border border-gray-100 rounded-2xl py-2 z-50 mt-2 overflow-hidden">
                  <div className="px-3 pb-1.5 mb-1 border-b border-gray-100">
                    <Link
                      to="/products"
                      className="flex items-center justify-between w-full px-2 py-2 text-[13px] font-bold text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                      onClick={() => setIsShopDropdownOpen(false)}
                    >
                      View All Products
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="px-3 pt-0.5">
                    <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categories</p>
                    {categoryItems.slice(0, 8).map(cat => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${cat.slug || cat.id}`}
                        className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-gray-700 hover:bg-green-50 hover:text-green-900 rounded-lg transition-colors"
                        onClick={() => setIsShopDropdownOpen(false)}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* New Arrivals */}
            <Link
              to="/new-arrivals"
              className={`relative px-4 h-8 flex items-center gap-1.5 rounded-md font-semibold text-[13px] tracking-wide transition-all duration-150 ${
                isActive('/new-arrivals')
                  ? 'text-green-900 bg-green-100'
                  : 'text-gray-600 hover:text-green-900 hover:bg-green-50'
              }`}
            >
              New Arrivals
              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-green-600 text-white rounded-full leading-none">
                NEW
              </span>
              {isActive('/new-arrivals') && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-green-700 rounded-full" />}
            </Link>

            {/* Deals */}
            <Link
              to="/deals"
              className={`relative px-4 h-8 flex items-center gap-1.5 rounded-md font-semibold text-[13px] tracking-wide transition-all duration-150 ${
                isActive('/deals')
                  ? 'text-red-700 bg-red-50'
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
              }`}
            >
              Deals
              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-red-500 text-white rounded-full leading-none">
                SALE
              </span>
              {isActive('/deals') && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-500 rounded-full" />}
            </Link>

            {/* About */}
            <Link
              to="/about"
              className={`relative px-4 h-8 flex items-center rounded-md font-semibold text-[13px] tracking-wide transition-all duration-150 ${
                isActive('/about')
                  ? 'text-green-900 bg-green-100'
                  : 'text-gray-600 hover:text-green-900 hover:bg-green-50'
              }`}
            >
              About
              {isActive('/about') && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-green-700 rounded-full" />}
            </Link>

            {/* Contact */}
            <Link
              to="/contact"
              className={`relative px-4 h-8 flex items-center rounded-md font-semibold text-[13px] tracking-wide transition-all duration-150 ${
                isActive('/contact')
                  ? 'text-green-900 bg-green-100'
                  : 'text-gray-600 hover:text-green-900 hover:bg-green-50'
              }`}
            >
              Contact
              {isActive('/contact') && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-green-700 rounded-full" />}
            </Link>

          </nav>
        </div>
      </div>

    </header>
  );
};

export default Header;

