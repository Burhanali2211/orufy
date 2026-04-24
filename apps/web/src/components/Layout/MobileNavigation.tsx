import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, Home, ShoppingBag, Sparkles, Tag, Info, User, ShoppingCart, Heart, 
  ChevronRight, LogOut, Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useSwipeGesture } from '../../hooks/useMobileGestures';
import { useProducts } from '../../contexts/ProductContext';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onCartClick: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  hasDropdown?: boolean;
  dropdownItems?: {
    name: string;
    href: string;
  }[];
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  onCartClick
}) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { categories } = useProducts();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Build navigation items with real categories
  const navigationItems: NavigationItem[] = [
    { 
      name: 'Home', 
      href: '/', 
      icon: <Home className="h-5 w-5" />
    },
    {
      name: 'Shop All',
      href: '/products',
      icon: <ShoppingBag className="h-5 w-5" />,
      hasDropdown: categories.length > 0,
      dropdownItems: [
        { name: 'All Products', href: '/products' },
        ...categories
          .filter(c => c.isActive !== false)
          .map(c => ({
            name: c.name,
            href: `/products?category=${c.slug || c.id}`
          }))
      ]
    },
    { 
      name: 'New Arrivals', 
      href: '/new-arrivals', 
      icon: <Sparkles className="h-5 w-5" />,
      badge: 'NEW',
      badgeColor: 'bg-emerald-500'
    },
    { 
      name: 'Special Offers', 
      href: '/deals', 
      icon: <Tag className="h-5 w-5" />,
      badge: 'SALE',
      badgeColor: 'bg-rose-500'
    },
    { 
      name: 'About Us', 
      href: '/about', 
      icon: <Info className="h-5 w-5" />
    },
  ];

  const { bindGestures } = useSwipeGesture({
    onSwipeLeft: () => onClose(),
  });

  useEffect(() => {
    onClose();
    setActiveDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    if (navRef.current && isOpen) {
      bindGestures(navRef.current);
    }
  }, [isOpen, bindGestures]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isActiveLink = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const toggleDropdown = (itemName: string) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-label="Close navigation menu"
      />

      {/* Drawer */}
      <div
        ref={navRef}
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-[320px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-semibold text-lg text-gray-900">Menu</span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Section */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
          {user ? (
            <div className="flex items-center gap-3">
              <img
                src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}&backgroundColor=f59e0b`}
                alt={user.name}
                className="h-12 w-12 rounded-full border-2 border-amber-200"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Welcome!</p>
                <button
                  onClick={() => {
                    navigate('/auth');
                    onClose();
                  }}
                  className="mt-1 text-sm text-amber-600 font-medium hover:text-amber-700"
                >
                  Sign In / Register
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                onCartClick();
                onClose();
              }}
              className="flex flex-col items-center justify-center p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="relative">
                <ShoppingCart className="h-4 w-4 text-gray-600" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-gray-600 mt-1.5">Cart</span>
            </button>

            <Link
              to="/wishlist"
              onClick={onClose}
              className="flex flex-col items-center justify-center p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="relative">
                <Heart className="h-4 w-4 text-gray-600" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-gray-600 mt-1.5">Wishlist</span>
            </Link>

            <Link
              to="/orders"
              onClick={onClose}
              className="flex flex-col items-center justify-center p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Package className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600 mt-1.5">Orders</span>
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="py-2">
            {navigationItems.map((item) => (
              <div key={item.name}>
                {item.hasDropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors ${
                        isActiveLink(item.href)
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActiveLink(item.href) ? 'text-amber-600' : 'text-gray-400'}>
                          {item.icon}
                        </span>
                        <span className="font-medium">{item.name}</span>
                        {item.badge && (
                          <span className={`${item.badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                          activeDropdown === item.name ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown Items */}
                    <div
                      className={`bg-gray-50 overflow-hidden transition-all duration-200 ${
                        activeDropdown === item.name ? 'max-h-[500px]' : 'max-h-0'
                      }`}
                    >
                      {item.dropdownItems?.map((dropdownItem, index) => (
                        <Link
                          key={`${item.name}-${index}`}
                          to={dropdownItem.href}
                          onClick={onClose}
                          className={`block pl-14 pr-5 py-3 text-sm transition-colors ${
                            isActiveLink(dropdownItem.href)
                              ? 'text-amber-700 bg-amber-50 font-medium'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                      isActiveLink(item.href)
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={isActiveLink(item.href) ? 'text-amber-600' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.name}</span>
                    {item.badge && (
                      <span className={`${item.badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}

            {/* Account Section for logged in users */}
            {user && (
              <>
                <div className="my-3 mx-5 border-t border-gray-200" />
                
                <Link
                  to="/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">My Profile</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-400 text-center">
            Free shipping on orders over ₹999
          </p>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
