import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const OCCASIONS = [
  {
    id: 'category1',
    title: 'Category 1',
    description: 'High quality items for everyday use.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    link: '/products?category=1',
  },
  {
    id: 'category2',
    title: 'Category 2',
    description: 'Special selections for your specific needs.',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=600&q=80',
    link: '/products?category=2',
  },
  {
    id: 'category3',
    title: 'Category 3',
    description: 'Curated boxes for your loved ones.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    link: '/products?category=3',
  },
  {
    id: 'category4',
    title: 'Category 4',
    description: 'Premium options that leave a lasting impression.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    link: '/products?category=4',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const ShopByOccasion: React.FC = memo(() => {
  return (
    <section className="py-16 sm:py-24 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h2 className="text-[28px] font-normal text-[#202124] leading-tight">
              Shop by Category
            </h2>
            <p className="text-[#5f6368] text-[16px] font-normal">
              Find the perfect product for every need.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {OCCASIONS.map((occ) => (
            <motion.div key={occ.id} variants={itemVariants}>
              <Link
                to={occ.link}
                className="group block relative rounded-[24px] overflow-hidden bg-[#f8f9fa] aspect-[4/5] sm:aspect-[3/4] hover:shadow-md transition-shadow duration-300"
              >
                {/* Image */}
                <img
                  src={occ.image}
                  alt={occ.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <h3 className="text-[22px] font-medium text-white mb-2">
                    {occ.title}
                  </h3>
                  <p className="text-[14px] text-white/80 line-clamp-2">
                    {occ.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
});

ShopByOccasion.displayName = 'ShopByOccasion';
