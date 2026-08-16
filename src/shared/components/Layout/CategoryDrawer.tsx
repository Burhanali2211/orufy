import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LayoutGrid, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useProducts } from '@/shared/contexts/ProductContext';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryDrawer: React.FC<CategoryDrawerProps> = ({ isOpen, onClose }) => {
  const { categories, loading } = useProducts();
  const navigate = useNavigate();

  const activeCategories = useMemo(
    () => categories.filter(c => c.isActive !== false),
    [categories]
  );

  const handleDragEnd = (e: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const handleNavigate = (path: string) => {
    onClose();
    setTimeout(() => {
      navigate(path);
    }, 200); // Wait for drawer to close before navigating
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative bg-white rounded-t-[32px] overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mt-4 mb-2" />
            
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">Browse Collections</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:bg-black/10 transition-all active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-2">
              {/* Shop All Link */}
              <button
                onClick={() => handleNavigate('/products')}
                className="w-full flex items-center justify-between bg-black text-white rounded-2xl px-5 py-4 active:scale-[0.98] transition-transform duration-200 shadow-md mb-6"
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-white" />
                  <span className="font-bold text-base">All Products</span>
                </div>
                <ArrowRight className="w-5 h-5 text-white/50" />
              </button>

              {/* Categories List */}
              <div className="bg-[#f9f9f9] rounded-3xl p-2">
                {loading ? (
                  <div className="flex flex-col">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-14 border-b border-black/5 hidden" />
                    ))}
                  </div>
                ) : activeCategories.length > 0 ? (
                  <div className="flex flex-col">
                    {activeCategories.map((cat, i) => (
                      <button
                        key={cat.id}
                        onClick={() => handleNavigate(`/products?category=${cat.slug || cat.id}`)}
                        className={`flex items-center justify-between px-4 py-4 text-left active:bg-black/5 transition-colors ${
                          i !== activeCategories.length - 1 ? 'border-b border-black/[0.03]' : ''
                        }`}
                      >
                        <span className="font-semibold text-black text-[15px]">{cat.name}</span>
                        <ChevronRight className="w-5 h-5 text-black/20" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-black/40 text-sm font-medium">No collections found</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
