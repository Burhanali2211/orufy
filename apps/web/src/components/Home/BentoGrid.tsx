import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Category } from '../../types';
import { getSafeImageUrl } from '../../utils/imageUrlUtils';

interface BentoGridProps {
  categories: Category[];
  loading?: boolean;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ categories, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4 animate-pulse">
        <div className="col-span-2 md:col-span-3 md:row-span-2 bg-gray-100 rounded-xl h-[220px] sm:h-[280px] md:h-auto md:min-h-[400px]" />
        <div className="bg-gray-100 rounded-xl aspect-square sm:aspect-auto sm:h-[140px] md:h-auto" />
        <div className="bg-gray-100 rounded-xl aspect-square sm:aspect-auto sm:h-[140px] md:h-auto" />
        <div className="bg-gray-100 rounded-xl aspect-square sm:aspect-auto sm:h-[140px] md:h-auto" />
        <div className="col-span-2 bg-gray-100 rounded-xl h-[120px] sm:h-[140px] md:h-auto" />
        <div className="bg-gray-100 rounded-xl aspect-square sm:aspect-auto sm:h-[140px] md:h-auto" />
      </div>
    );
  }

  // Enhanced mapping for 6-column density
  const featuredCat = categories[0];
  const secondaryCats = categories.slice(1, 7);

  // Helper to get safe category image URL
  const getCatImage = (cat: Category, fallback: string) => {
    const rawUrl = cat.imageUrl || (cat as any).image_url;
    return getSafeImageUrl(rawUrl, fallback);
  };

  // Fallback images for different categories
  const fallbackImages = [
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600', // spices/herbs
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600', // honey/natural
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', // saffron/premium
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600', // food/cooking
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=600', // kitchen/spices
  ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-6 md:grid-rows-2 gap-2 sm:gap-3 md:gap-4">
        {/* 1. Main Featured Tile (Large - spans full width on mobile, 3 cols & 2 rows on desktop) */}
        {featuredCat && (
          <Link
            to={`/products?category=${featuredCat.id}`}
            className="group relative col-span-2 md:col-span-3 md:row-span-2 overflow-hidden rounded-xl bg-[#f8f9fa] border border-gray-100 shadow-sm hover:shadow-md transition-all min-h-[220px] sm:min-h-[280px] md:min-h-[400px]"
          >
            <img
              src={getCatImage(featuredCat, 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800')}
              alt={featuredCat.name}
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
               <div className="bg-amber-400 text-[#131921] text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded shadow-sm">
                  TOP CATEGORY
               </div>
            </div>
            <div className="absolute bottom-0 left-0 p-2 sm:p-4 md:p-6 w-full">
              <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mb-0.5 sm:mb-1 drop-shadow-md">{featuredCat.name}</h3>
              <p className="text-gray-100 text-[10px] sm:text-sm mb-2 sm:mb-4 line-clamp-2 max-w-xs drop-shadow-sm hidden sm:block">{featuredCat.description}</p>
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white text-[#131921] px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-bold shadow-lg group/btn">
                <span>Shop All</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover/btn:translate-x-1" />
              </div>
            </div>
          </Link>
        )}

        {/* 2. Small Tile 1 - Side by side on mobile */}
        {secondaryCats[0] && (
          <Link
            to={`/products?category=${secondaryCats[0].id}`}
            className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md aspect-square sm:aspect-auto sm:min-h-[140px] md:min-h-0"
          >
            <img
              src={getCatImage(secondaryCats[0], fallbackImages[0])}
              alt={secondaryCats[0].name}
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = fallbackImages[0]; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 right-2">
              <h3 className="text-[11px] sm:text-sm font-bold text-white drop-shadow-md line-clamp-1">{secondaryCats[0].name}</h3>
            </div>
          </Link>
        )}

        {/* 3. Small Tile 2 - Side by side on mobile */}
        {secondaryCats[1] && (
          <Link
            to={`/products?category=${secondaryCats[1].id}`}
            className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md aspect-square sm:aspect-auto sm:min-h-[140px] md:min-h-0"
          >
            <img
              src={getCatImage(secondaryCats[1], fallbackImages[1])}
              alt={secondaryCats[1].name}
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = fallbackImages[1]; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 right-2">
              <h3 className="text-[11px] sm:text-sm font-bold text-white drop-shadow-md line-clamp-1">{secondaryCats[1].name}</h3>
            </div>
          </Link>
        )}

        {/* 4. Wide Tile - Full width on mobile (moved up so last 2 tiles pair together) */}
        {secondaryCats[3] && (
          <Link
            to={`/products?category=${secondaryCats[3].id}`}
            className="group relative col-span-2 overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md min-h-[100px] sm:min-h-[140px] md:min-h-0"
          >
            <img
              src={getCatImage(secondaryCats[3], fallbackImages[3])}
              alt={secondaryCats[3].name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = fallbackImages[3]; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 p-3 sm:p-5 flex flex-col justify-center">
              <h3 className="text-base sm:text-xl font-black text-white mb-0.5 sm:mb-1">{secondaryCats[3].name}</h3>
              <span className="text-amber-400 text-[10px] sm:text-xs font-bold">New Arrivals &rsaquo;</span>
            </div>
          </Link>
        )}

        {/* 5. Small Tile - Side by side with tile 6 on mobile */}
        {secondaryCats[2] && (
          <Link
            to={`/products?category=${secondaryCats[2].id}`}
            className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md aspect-square sm:aspect-auto sm:min-h-[140px] md:min-h-0"
          >
            <img
              src={getCatImage(secondaryCats[2], fallbackImages[2])}
              alt={secondaryCats[2].name}
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = fallbackImages[2]; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 right-2">
              <h3 className="text-[11px] sm:text-sm font-bold text-white drop-shadow-md line-clamp-1">{secondaryCats[2].name}</h3>
            </div>
          </Link>
        )}

        {/* 6. Small Tile - Side by side with tile 5 on mobile */}
        {secondaryCats[4] && (
          <Link
            to={`/products?category=${secondaryCats[4].id}`}
            className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md aspect-square sm:aspect-auto sm:min-h-[140px] md:min-h-0"
          >
            <img
              src={getCatImage(secondaryCats[4], fallbackImages[4])}
              alt={secondaryCats[4].name}
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { (e.target as HTMLImageElement).src = fallbackImages[4]; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 right-2">
              <h3 className="text-[11px] sm:text-sm font-bold text-white drop-shadow-md line-clamp-1">{secondaryCats[4].name}</h3>
            </div>
          </Link>
        )}
      </div>
    );
};
