import React, { useRef, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, ChevronRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { Category } from '../../types';
import { getSafeImageUrl } from '../../utils/imageUrlUtils';

interface CategoryChipsProps {
  categories: Category[];
  loading?: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default-1', name: 'Electronics', slug: 'electronics', isActive: true } as Category,
  { id: 'default-2', name: 'Fashion', slug: 'fashion', isActive: true } as Category,
  { id: 'default-3', name: 'Home & Decor', slug: 'home', isActive: true } as Category,
  { id: 'default-4', name: 'Beauty', slug: 'beauty', isActive: true } as Category,
  { id: 'default-5', name: 'Sports', slug: 'sports', isActive: true } as Category,
  { id: 'default-6', name: 'Toys', slug: 'toys', isActive: true } as Category,
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
};

export const CategoryChips: React.FC<CategoryChipsProps> = memo(({ categories, loading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const activeCategories = useMemo(() => {
    const active = categories.filter(c => c.isActive !== false).slice(0, 10);
    return active.length > 0 ? active : DEFAULT_CATEGORIES;
  }, [categories]);

  if (loading) {
    return (
      <div className="flex gap-6 px-8 py-10 overflow-hidden max-w-7xl mx-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-3 hidden">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F5F5F5]" />
            <div className="w-12 h-2 bg-[#F5F5F5] rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="bg-white py-6 border-b border-black/[0.05]">
      <motion.div
        ref={scrollRef}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="flex gap-3 px-4 sm:px-6 lg:px-8 overflow-x-auto overflow-y-hidden scrollbar-hide max-w-7xl mx-auto"
      >
        {/* All Collections Pill */}
        <motion.div variants={itemVariants} className="flex-shrink-0">
          <Link
            to="/products"
            className="flex items-center gap-2 px-4 py-2 h-9 rounded-full border border-[#dadce0] bg-white hover:bg-[#f1f3f4] hover:text-[#202124] transition-colors"
          >
            <LayoutGrid className="w-4 h-4 text-[#5f6368]" />
            <span className="text-[14px] font-medium text-[#3c4043]">
              All Collections
            </span>
          </Link>
        </motion.div>

        {activeCategories.map((cat) => {
          const rawUrl = cat.imageUrl || (cat as any).image_url;
          const imageUrl = getSafeImageUrl(rawUrl, '');
          const hasRealImage = !!imageUrl;
          
          return (
            <motion.div key={cat.id} variants={itemVariants} className="flex-shrink-0">
              <Link
                to={`/products?category=${cat.slug || cat.id}`}
                className="flex items-center gap-2 px-4 py-2 h-9 rounded-full border border-[#dadce0] bg-white hover:bg-[#f1f3f4] hover:text-[#202124] transition-colors"
              >
                {hasRealImage && (
                  <img
                    src={imageUrl}
                    alt={cat.name}
                    loading="lazy"
                    crossOrigin="anonymous"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="text-[14px] font-medium text-[#3c4043]">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          );
        })}

        {/* Explore More Pill */}
        <motion.div variants={itemVariants} className="flex-shrink-0">
          <Link
            to="/products"
            className="flex items-center gap-2 px-4 py-2 h-9 rounded-full border border-dashed border-[#dadce0] bg-[#f8f9fa] hover:bg-[#e8eaed] transition-colors"
          >
            <span className="text-[14px] font-medium text-[#5f6368]">
              Explore More
            </span>
            <ChevronRight className="w-4 h-4 text-[#5f6368]" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
});

CategoryChips.displayName = 'CategoryChips';
export default CategoryChips;
