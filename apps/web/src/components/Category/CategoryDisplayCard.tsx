import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../../types';
import { ArrowRight } from 'lucide-react';
import { useMobileDetection } from '../../hooks/useMobileGestures';
import { normalizeImageUrl, isValidImageUrl, getSafeImageUrl } from '../../utils/imageUrlUtils';

interface CategoryDisplayCardProps {
  category: Category;
}

export const CategoryDisplayCard: React.FC<CategoryDisplayCardProps> = ({ category }) => {
  const { isMobile } = useMobileDetection();
  const [categoryImage, setCategoryImage] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  // Normalize category image URL from database
  useEffect(() => {
    const imageUrl = category.imageUrl || (category as any).image_url;
    const normalized = getSafeImageUrl(
      imageUrl,
      '/placeholder-category.jpg'
    );
    
    if (normalized && isValidImageUrl(normalized)) {
      setCategoryImage(normalized);
      setImageError(false);
    } else {
      setCategoryImage('/placeholder-category.jpg');
      setImageError(false);
    }
  }, [category]);

  const handleImageError = () => {
    if (categoryImage !== '/placeholder-category.jpg') {
      setCategoryImage('/placeholder-category.jpg');
      setImageError(false);
    } else {
      setImageError(true);
    }
  };

  // Mobile-specific styling
  const cardClasses = isMobile
    ? "group relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer h-64 flex flex-col justify-end touch-manipulation"
    : "group relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer h-80 flex flex-col justify-end";

  const textClasses = isMobile
    ? "text-lg font-bold mb-1 text-white drop-shadow-lg"
    : "text-2xl font-bold mb-2 text-white drop-shadow-lg";

  const countClasses = isMobile
    ? "text-xs font-semibold"
    : "text-sm font-semibold";

  return (
    <Link to={`/products?category=${category.id}`}>
      <div className={cardClasses}>
        {!imageError && categoryImage ? (
          <img
            src={categoryImage}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-100 to-amber-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm font-medium">No Image</span>
          </div>
        )}
        {/* Enhanced gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent"></div>

        <div className="relative p-4 sm:p-6 text-white z-10">
          <h3 className={textClasses}>{category.name}</h3>
          <div className="flex items-center text-sm font-medium text-white drop-shadow-md mt-2">
            <span>Explore Now</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </div>

        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white/95 text-neutral-900 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg backdrop-blur-sm">
          <span className={countClasses}>{category.productCount}+ items</span>
        </div>
      </div>
    </Link>
  );
};