import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { Category } from '../../types';
import { getSafeImageUrl } from '../../utils/imageUrlUtils';

interface BentoGridProps {
  categories: Category[];
  loading?: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

export const BentoGrid: React.FC<BentoGridProps> = ({ categories, loading }) => {
  if (loading) {
    return (
      <section className="bg-[#f8f9fa] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 hidden">
            <div className="bg-[#f5f5f7] rounded-[24px] h-[340px]" />
            <div className="bg-[#f5f5f7] rounded-[24px] h-[340px]" />
            <div className="bg-[#f5f5f7] rounded-[24px] h-[340px]" />
            <div className="bg-[#f5f5f7] rounded-[24px] h-[340px]" />
          </div>
        </div>
      </section>
    );
  }

  const validCategories = categories.filter(cat => {
    const rawUrl = cat.imageUrl || (cat as any).image_url;
    return !!rawUrl;
  });

  const displayCats = validCategories.slice(0, 4);
  
  // If there are no categories to display, do not render the section at all.
  // This removes the "empty section" issue.
  if (displayCats.length === 0) return null;

  const getCatImage = (cat: Category) => {
    const rawUrl = cat.imageUrl || (cat as any).image_url;
    return getSafeImageUrl(rawUrl, '/images/collection.png');
  };

  return (
    <section className="bg-[#f8f9fa] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-8 text-center sm:text-left">
          <h2 className="text-[28px] font-normal text-[#202124]">Shop by Category</h2>
        </div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {displayCats.map((cat) => {
            return (
              <motion.div
                key={cat.id}
                variants={itemVariants}
              >
                <Link
                  to={`/products?category=${cat.id}`}
                  className="group flex flex-col bg-white border border-gray-200 rounded-[24px] overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  <div className="relative w-full aspect-[4/3] bg-[#f8f9fa] overflow-hidden">
                    <img
                      src={getCatImage(cat)}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  
                  <div className="p-5 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <h3 className="text-[#202124] text-[18px] font-medium mb-1">
                      {cat.name}
                    </h3>
                    <p className="text-[#5f6368] text-[14px] line-clamp-2">
                      {cat.description || 'Explore our exclusive collection.'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default BentoGrid;
