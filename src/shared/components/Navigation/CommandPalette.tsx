import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Package, ShoppingBag, Heart, User, Sparkles, 
  ArrowRight, Tag, Settings, Plus, ExternalLink, X 
} from 'lucide-react';
import { useProducts } from '@/shared/contexts/ProductContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useCartStore } from '@/shared/stores/useCartStore';

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { products, categories } = useProducts();
  const { user } = useAuth();
  const { toggleCart } = useCartStore();
  const navigate = useNavigate();

  // Toggle on Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    document.addEventListener('keydown', down);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, []);

  if (!open) return null;

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'seller';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" 
        onClick={() => setOpen(false)} 
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-150">
        <Command label="Global Command Menu" className="w-full">
          <div className="flex items-center px-4 border-b border-stone-100 bg-stone-50/50">
            <Search className="w-5 h-5 text-stone-400 mr-3 flex-shrink-0" />
            <Command.Input 
              placeholder="Search products, categories, pages, actions... (ESC to close)" 
              className="w-full py-4 bg-transparent outline-none text-base text-stone-900 placeholder:text-stone-400 font-sans"
              autoFocus
            />
            <button 
              onClick={() => setOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-3 space-y-3 divide-y divide-stone-100">
            <Command.Empty className="py-12 text-center text-sm text-stone-500 font-serif">
              No matching products or actions found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading={<span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 pb-1 block">Quick Navigation</span>}>
              <Command.Item 
                onSelect={() => handleSelect(() => navigate('/products'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100/80 cursor-pointer text-sm font-medium text-stone-800 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Explore All Fragrances</span>
                <span className="ml-auto text-xs text-stone-400">/products</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => handleSelect(() => toggleCart())}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100/80 cursor-pointer text-sm font-medium text-stone-800 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-stone-600" />
                <span>Open Shopping Bag</span>
                <span className="ml-auto text-xs text-stone-400">Cart</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => handleSelect(() => navigate('/dashboard/orders'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100/80 cursor-pointer text-sm font-medium text-stone-800 transition-colors"
              >
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Track My Orders</span>
                <span className="ml-auto text-xs text-stone-400">Orders</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => handleSelect(() => navigate('/wishlist'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100/80 cursor-pointer text-sm font-medium text-stone-800 transition-colors"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Saved Wishlist</span>
                <span className="ml-auto text-xs text-stone-400">Wishlist</span>
              </Command.Item>
            </Command.Group>

            {/* Products Search Results */}
            {products.length > 0 && (
              <Command.Group heading={<span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 pt-3 pb-1 block">Luxury Collection</span>}>
                {products.slice(0, 8).map((product) => (
                  <Command.Item
                    key={product.id}
                    value={`${product.name} ${product.category || ''} ${product.description || ''}`}
                    onSelect={() => handleSelect(() => navigate(`/products/${product.id}`))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100/80 cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0">
                      <img 
                        src={product.images?.[0] || '/placeholder.png'} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 text-sm truncate font-serif">{product.name}</p>
                      <p className="text-xs text-stone-500 truncate">{product.category || 'Fragrance'}</p>
                    </div>
                    <span className="font-bold text-sm text-stone-900">
                      ₹{typeof product.price === 'number' ? product.price : parseFloat(String(product.price || 0))}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <Command.Group heading={<span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 pt-3 pb-1 block">Fragrance Categories</span>}>
                {categories.map((cat) => (
                  <Command.Item
                    key={cat.id}
                    value={`Category ${cat.name}`}
                    onSelect={() => handleSelect(() => navigate(`/products?category=${cat.slug || cat.id}`))}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100/80 cursor-pointer text-sm font-medium text-stone-700 transition-colors"
                  >
                    <Tag className="w-4 h-4 text-stone-400" />
                    <span>{cat.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Admin Management Shortcuts */}
            {isAdmin && (
              <Command.Group heading={<span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider px-3 pt-3 pb-1 block">Admin Controls</span>}>
                <Command.Item
                  onSelect={() => handleSelect(() => navigate('/admin/products/new'))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 cursor-pointer text-sm font-medium text-amber-900 transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>Create New Product</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => handleSelect(() => navigate('/admin/orders'))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 cursor-pointer text-sm font-medium text-amber-900 transition-colors"
                >
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Manage Merchant Orders</span>
                </Command.Item>

                <Command.Item
                  onSelect={() => handleSelect(() => navigate('/admin/settings'))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 cursor-pointer text-sm font-medium text-amber-900 transition-colors"
                >
                  <Settings className="w-4 h-4 text-amber-600" />
                  <span>Store Identity & Payment Config</span>
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>

          <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400 font-sans">
            <span>Navigation: <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px]">↓</kbd></span>
            <span>Select: <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px]">↵</kbd></span>
            <span>Close: <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px]">ESC</kbd></span>
          </div>
        </Command>
      </div>
    </div>
  );
};
