import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, LogOut, Leaf, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
const SearchBar: React.FC<{ mobile?: boolean; isLight?: boolean }> = ({ mobile = false, isLight = false }) => {
  const { products } = useProducts();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
          (p.shortDescription && p.shortDescription.toLowerCase().includes(term))
        )
        .slice(0, 6);
      setResults(filtered);
      setOpen(filtered.length > 0 || query.trim().length >= 2);
      setActiveIdx(-1);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, products]);

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

  return (
    <div ref={wrapRef} className={`relative ${mobile ? 'w-full' : 'w-full max-w-sm'}`}>
      <div className="relative flex items-center group">
        <Search className={`absolute left-4 h-3.5 w-3.5 transition-colors ${isLight ? 'text-white/40 group-focus-within:text-white' : 'text-black/30 group-focus-within:text-black'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && results.length > 0 && setOpen(true)}
          placeholder="Search collections"
          className={`w-full pl-10 pr-10 py-3 text-[14px] font-medium rounded-full border-none outline-none transition-colors ${
            isLight 
              ? 'bg-white/10 text-white placeholder:text-white/60 focus:bg-white/20' 
              : 'bg-[#f1f3f4] text-[#202124] placeholder:text-[#5f6368] focus:bg-white focus:shadow-[0_1px_6px_rgba(32,33,36,0.28)]'
          }`}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className={`absolute right-3.5 p-1.5 rounded-full transition-colors ${isLight ? 'hover:bg-white/10 text-white/60' : 'hover:bg-[#e8eaed] text-[#5f6368]'}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-[16px] shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-[200]"
          >
            {results.length > 0 ? (
              <div className="p-3">
                {results.map((product, idx) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    onClick={() => { setQuery(''); setOpen(false); }}
                    className={`flex items-center gap-4 px-3 py-2.5 rounded-2xl transition-all ${activeIdx === idx ? 'bg-[#F9F9F9]' : 'hover:bg-[#F9F9F9]'}`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F9F9F9]">
                      <img src={product.images?.[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#202124] truncate">{product.name}</p>
                      <p className="text-[12px] text-[#5f6368]">₹{product.price.toLocaleString('en-IN')}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-black/10" />
                  </Link>
                ))}
                <button
                  onClick={goToSearch}
                  className="w-full mt-2 py-3 text-[14px] font-medium text-[#1A73E8] bg-[#f8f9fa] hover:bg-[#f1f3f4] rounded-[16px] transition-all flex items-center justify-center gap-2"
                >
                  View All Collections
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-[10px] text-black/30 font-black uppercase tracking-[0.2em]">No Matches Found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ onAuthClick, onCartClick }) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { getSiteSetting } = useSettings();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isHome = location.pathname === '/';
  const siteName = getSiteSetting('site_name') || 'Aligarh Attarsavenue';
  const logoUrl = getSiteSetting('logo_url');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const headerStyles = useMemo(() => {
    return {
      bg: isScrolled ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)]' : 'bg-white',
      text: 'text-[#5f6368] hover:text-[#202124]',
      logo: 'text-[#202124]',
      searchLight: false
    };
  }, [isScrolled]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerStyles.bg} py-4`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 sm:gap-6 lg:gap-10">
            
          {/* Logo Area */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 min-w-0 group">
            <div className="flex-shrink-0 flex items-center justify-center bg-white rounded-full p-1 border border-transparent group-hover:border-gray-200 transition-colors">
              <img src="/logo.png" alt="Logo" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover" />
            </div>
            <span className={`text-[18px] sm:text-[22px] font-medium tracking-tight truncate hidden sm:block ${headerStyles.logo}`}>
              {siteName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Products', path: '/products' },
              { label: 'Categories', path: '/categories' },
              { label: 'About', path: '/about' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2.5 text-[14px] font-medium rounded-full transition-colors hover:bg-[#f8f9fa] ${headerStyles.text}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex flex-1 max-w-sm">
            <SearchBar isLight={headerStyles.searchLight} />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto lg:ml-0">
            <Link 
              to="/wishlist" 
              className={`hidden sm:flex p-2.5 rounded-full transition-colors hover:bg-[#f8f9fa] relative ${headerStyles.text}`}
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1A73E8] rounded-full border border-white"></span>
              )}
            </Link>

            <button
              onClick={onCartClick}
              className={`p-2.5 rounded-full transition-colors hover:bg-[#f8f9fa] flex items-center gap-2 ${headerStyles.text}`}
              aria-label="Cart"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#1A73E8] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {itemCount}
                  </span>
                )}
              </div>
            </button>
            
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : navigate('/auth')}
                className={`p-2.5 rounded-full transition-colors hover:bg-[#f8f9fa] ${headerStyles.text}`}
              >
                <User className="h-5 w-5" />
              </button>
              
              <AnimatePresence>
                {isUserMenuOpen && user && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-black/5 py-3 z-50"
                  >
                    <div className="px-5 py-3 border-b border-black/[0.03]">
                      <p className="text-[14px] font-medium text-[#202124] truncate">{user.name}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-100 rounded-[12px] transition-all">
                        <User className="h-4 w-4" /> My Profile
                      </Link>
                      <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-100 rounded-[12px] transition-all">
                        <ShoppingCart className="h-4 w-4" /> Order History
                      </Link>
                      <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-50 rounded-[12px] transition-all">
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
