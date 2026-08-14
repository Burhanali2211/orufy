import React, { useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, ArrowRight, ChevronRight } from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';
import { getSafeImageUrl } from '../utils/imageUrlUtils';

// ── Attar / perfume emoji map ────────────────────────────────────────────────
const EMOJI_MAP: [string, string][] = [
  ['attar',       '🌹'],
  ['oud',         '🪵'],
  ['agarwood',    '🪵'],
  ['floral',      '🌸'],
  ['flower',      '🌸'],
  ['rose',        '🌹'],
  ['musky',       '🌫️'],
  ['musk',        '🌫️'],
  ['citrus',      '🍋'],
  ['fresh',       '🍃'],
  ['amber',       '🍂'],
  ['resin',       '🍂'],
  ['gift',        '🎁'],
  ['new',         '✨'],
  ['arrival',     '✨'],
  ['best',        '⭐'],
  ['seller',      '⭐'],
  ['woody',       '🌲'],
  ['oriental',    '🕌'],
  ['spice',       '🌶️'],
  ['herbal',      '🌿'],
  ['aquatic',     '🌊'],
];

function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of EMOJI_MAP) {
    if (lower.includes(key)) return emoji;
  }
  return '💎';
}

// ── Gradient palette — cycles through aesthetically cohesive gradients ───────
const GRADIENTS = [
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-sky-400 to-blue-600',
  'from-red-400 to-rose-600',
  'from-yellow-400 to-amber-600',
  'from-indigo-400 to-violet-600',
  'from-green-400 to-emerald-600',
  'from-cyan-400 to-sky-600',
];

// ── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden bg-gray-100 hidden">
    <div className="aspect-[4/3] bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  </div>
);

// ── Single category card ─────────────────────────────────────────────────────
const CategoryCard = memo(({
  id, name, slug, imageUrl, index,
}: {
  id: string; name: string; slug?: string; imageUrl?: string; index: number;
}) => {
  const href = `/products?category=${slug || id}`;
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const emoji = getEmoji(name);
  const safe = getSafeImageUrl(imageUrl, '');
  const hasImage = !!safe && !safe.includes('placeholder');

  return (
    <Link
      to={href}
      className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 bg-white border border-gray-100"
    >
      {/* Image / gradient background */}
      <div className={`aspect-[4/3] relative bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        {hasImage ? (
          <img
            src={safe}
            alt={name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : null}

        {/* Emoji fallback centred inside gradient */}
        {!hasImage && (
          <span className="text-5xl drop-shadow-sm select-none">{emoji}</span>
        )}

        {/* Subtle bottom gradient overlay for text contrast */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Arrow badge top-right */}
        <span className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ChevronRight className="w-4 h-4 text-white" />
        </span>
      </div>

      {/* Name row */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">{name}</p>
        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all duration-150" />
      </div>
    </Link>
  );
});
CategoryCard.displayName = 'CategoryCard';

// ── Page ─────────────────────────────────────────────────────────────────────
const CategoriesPage: React.FC = () => {
  const { categories, loading } = useProducts();

  const activeCategories = useMemo(
    () => categories.filter(c => c.isActive !== false),
    [categories]
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Categories</h1>
            {!loading && activeCategories.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {activeCategories.length} collection{activeCategories.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors"
          >
            All Products
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-5">

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && activeCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <LayoutGrid className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No categories yet</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon.</p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-black transition-colors"
            >
              Browse all products
            </Link>
          </div>
        )}

        {/* Category grid */}
        {!loading && activeCategories.length > 0 && (
          <>
            {/* "All products" hero card — full width on mobile */}
            <Link
              to="/products"
              className="group flex items-center justify-between gap-4 bg-gray-900 text-white rounded-2xl px-5 py-4 mb-4 hover:bg-black active:scale-[0.99] transition-all duration-150 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="font-bold text-base leading-tight">All Products</p>
                  <p className="text-white/60 text-xs mt-0.5">Browse the full collection</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-150 flex-shrink-0" />
            </Link>

            {/* 2-col mobile, 3-col tablet, 4-col desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {activeCategories.map((cat, i) => (
                <CategoryCard
                  key={cat.id}
                  id={cat.id}
                  name={cat.name}
                  slug={(cat as any).slug}
                  imageUrl={(cat as any).imageUrl || (cat as any).image_url}
                  index={i}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
