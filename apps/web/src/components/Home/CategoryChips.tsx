import React, { useRef, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import { Category } from '../../types';
import { getSafeImageUrl } from '../../utils/imageUrlUtils';

interface CategoryChipsProps {
  categories: Category[];
  loading?: boolean;
}

// Emoji map for Islamic lifestyle / attar store categories
const categoryEmojis: Record<string, string> = {
  attar: '🫙',
  perfume: '✨',
  oud: '🪵',
  agarwood: '🪵',
  floral: '🌸',
  rose: '🌹',
  musky: '💜',
  amber: '🟤',
  hijab: '🧕',
  gift: '🎁',
  book: '📖',
  islamic: '📖',
  kids: '👶',
  toy: '🧸',
  default: '🕌',
};

function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(categoryEmojis)) {
    if (lower.includes(key)) return emoji;
  }
  return categoryEmojis.default;
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=120&q=70',
  'https://images.unsplash.com/photo-1541643600914-78b084683702?w=120&q=70',
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=120&q=70',
  'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=120&q=70',
  'https://images.unsplash.com/photo-1585241936939-be4099591252?w=120&q=70',
];

export const CategoryChips: React.FC<CategoryChipsProps> = memo(({ categories, loading }) => {
  // All hooks must be called unconditionally before any early return
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeCategories = useMemo(
    () => categories.filter(c => c.isActive !== false).slice(0, 12),
    [categories]
  );

  if (loading) {
    return (
      <div className="flex gap-4 px-4 py-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 animate-pulse">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200" />
            <div className="w-12 h-3 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="bg-white border-b border-gray-100">
      {/* Mobile: horizontal scroll. sm+: centered wrap */}
      <div
        ref={scrollRef}
        className="flex gap-3 px-3 py-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory
                   sm:flex-wrap sm:overflow-x-visible sm:justify-center sm:px-6 sm:py-4 sm:gap-4"
      >
        {/* All Categories chip — grid icon instead of weird mountain emoji */}
        <Link
          to="/products"
          className="flex-shrink-0 flex flex-col items-center gap-1.5 group snap-start"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-900 border-2 border-gray-900 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-colors shadow-sm">
            <LayoutGrid className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-800 text-center w-16 leading-tight">All</span>
        </Link>

        {activeCategories.map((cat, i) => {
          const rawUrl = cat.imageUrl || (cat as any).image_url;
          const imageUrl = getSafeImageUrl(rawUrl, fallbackImages[i % fallbackImages.length]);
          const emoji = getCategoryEmoji(cat.name);
          const hasRealImage = imageUrl && !imageUrl.includes('via.placeholder');
          return (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug || cat.id}`}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group snap-start"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-green-500 transition-colors bg-gray-50 relative">
                {hasRealImage ? (
                  <img
                    src={imageUrl}
                    alt={cat.name}
                    loading="lazy"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.style.display = 'none';
                      const sibling = t.nextElementSibling as HTMLElement | null;
                      if (sibling) sibling.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`${hasRealImage ? 'hidden' : 'flex'} absolute inset-0 w-full h-full items-center justify-center text-xl sm:text-2xl bg-green-50`}>
                  {emoji}
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-700 text-center w-16 leading-tight line-clamp-2">{cat.name}</span>
            </Link>
          );
        })}

        {/* View all */}
        <Link
          to="/products"
          className="flex-shrink-0 flex flex-col items-center gap-1.5 group snap-start"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center group-hover:border-green-500 group-hover:bg-green-50 transition-colors">
            <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-green-700 transition-colors" />
          </div>
          <span className="text-[10px] sm:text-xs font-medium text-gray-500 text-center w-16 leading-tight">View All</span>
        </Link>
      </div>
    </section>
  );
});

CategoryChips.displayName = 'CategoryChips';
export default CategoryChips;
