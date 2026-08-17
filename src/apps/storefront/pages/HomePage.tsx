import React, { Suspense, lazy, memo } from 'react';
import { Hero } from '@/shared/components/Home/Hero';
import { CategoryChips } from '@/shared/components/Home/CategoryChips';
import { BentoGrid } from '@/shared/components/Home/BentoGrid';
import { useProducts } from '@/shared/contexts/ProductContext';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Headphones } from 'lucide-react';

const FeaturedProducts = lazy(() => import('@/shared/components/Home/FeaturedProducts'));
const LatestArrivals = lazy(() => import('@/shared/components/Home/LatestArrivals'));

const SectionLoader = memo(() => (
  <div className="py-12 bg-white">
    <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
));
SectionLoader.displayName = 'SectionLoader';

/* ─── Mini Promo Banner (Trust Signals) ─── */
const PromoBanner: React.FC = memo(() => (
  <section className="py-16 bg-white border-t border-stone-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h3 className="text-2xl sm:text-3xl font-bold text-stone-900">Why shop with us</h3>
        <p className="text-stone-500 text-sm mt-1">Exceptional quality and seamless customer experience</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-stone-50 rounded-3xl p-8 text-center flex flex-col items-center border border-stone-100">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-stone-900">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h4 className="text-lg font-bold text-stone-900 mb-2">Authentic Products</h4>
          <p className="text-sm text-stone-600">100% genuine and verified premium items curated for you.</p>
        </div>
        <div className="bg-stone-50 rounded-3xl p-8 text-center flex flex-col items-center border border-stone-100">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-stone-900">
            <Truck className="h-6 w-6" />
          </div>
          <h4 className="text-lg font-bold text-stone-900 mb-2">Fast Delivery</h4>
          <p className="text-sm text-stone-600">Carefully packaged and expedited directly to your doorstep.</p>
        </div>
        <div className="bg-stone-50 rounded-3xl p-8 text-center flex flex-col items-center border border-stone-100">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-stone-900">
            <Headphones className="h-6 w-6" />
          </div>
          <h4 className="text-lg font-bold text-stone-900 mb-2">Dedicated Support</h4>
          <p className="text-sm text-stone-600">Always here to assist with your orders, questions, and inquiries.</p>
        </div>
      </div>
    </div>
  </section>
));
PromoBanner.displayName = 'PromoBanner';

/* ─── Main Storefront Homepage ─── */
export default function HomePage() {
  const { categories, loading: categoriesLoading } = useProducts();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 1. Banner Carousel */}
      <Hero />

      {/* 2. Avatar / Circle Category Chips Carousel */}
      <CategoryChips categories={categories} loading={categoriesLoading} />

      {/* 3. Featured Products Collection */}
      <Suspense fallback={<SectionLoader />}>
        <FeaturedProducts />
      </Suspense>

      {/* 4. Shop by Category Bento Grid */}
      <BentoGrid categories={categories} loading={categoriesLoading} />

      {/* 5. Fresh Releases / Latest Arrivals */}
      <Suspense fallback={<SectionLoader />}>
        <LatestArrivals />
      </Suspense>

      {/* 6. Trust Signals & Benefits */}
      <PromoBanner />
    </div>
  );
}
