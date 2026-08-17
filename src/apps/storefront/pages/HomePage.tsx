import React, { Suspense, lazy, memo, useMemo, useState, useEffect } from 'react';
import { Hero } from '@/shared/components/Home/Hero';
import { CategoryChips } from '@/shared/components/Home/CategoryChips';
import { FlashSale } from '@/shared/components/Home/FlashSale';
import { BestSellers } from '@/shared/components/Home/BestSellers';
import { useProducts } from '@/shared/contexts/ProductContext';

import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Headphones, ArrowUpRight,  } from 'lucide-react';
import { HomepageProductCard } from '@/shared/components/Product/HomepageProductCard';

import { BentoGrid } from '@/shared/components/Home/BentoGrid';

import { ShopByOccasion } from '@/shared/components/Home/ShopByOccasion';
import { StoreVisitorsTestimonials } from '@/shared/components/Home/StoreVisitorsTestimonials';

const FeaturedProducts = lazy(() => import('@/shared/components/Home/FeaturedProducts'));
const LatestArrivals = lazy(() => import('@/shared/components/Home/LatestArrivals'));

const SectionLoader = memo(() => (
  <div className="py-6 bg-white">
    <div className="max-w-7xl mx-auto px-4"><></></div>
  </div>
));
SectionLoader.displayName = 'SectionLoader';

/* ─── Price-Filter Strips ─── */
const PRICE_FILTERS = [
  { label: 'Under ₹499', link: '/products?maxPrice=499', bg: 'bg-stone-50 border-stone-200 text-stone-800' },
  { label: 'Under ₹999', link: '/products?maxPrice=999', bg: 'bg-orange-50 border-orange-200 text-orange-800' },
  { label: 'Under ₹1999', link: '/products?maxPrice=1999', bg: 'bg-amber-50 border-amber-200 text-amber-800' },
  { label: 'Under ₹2999', link: '/products?maxPrice=2999', bg: 'bg-green-50 border-green-200 text-green-800' },
  { label: 'Luxury Attars', link: '/products?minPrice=3000', bg: 'bg-stone-100 border-stone-300 text-stone-900' },
];

const ShopByPrice: React.FC = memo(() => (
  <section className="py-12 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-[28px] sm:text-[32px] font-semibold text-[#1d1d1f] tracking-[0.007em]">
          Shop by price
        </h3>
      </div>
      <div className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide pb-2">
        {PRICE_FILTERS.map(({ label, link }) => (
          <Link
            key={label}
            to={link}
            className="flex-shrink-0 px-6 py-2.5 rounded-full border border-[#d2d2d7] text-[14px] text-[#1d1d1f] font-normal transition-colors hover:bg-[#f5f5f7]"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  </section>
));
ShopByPrice.displayName = 'ShopByPrice';

/* ─── Mini Promo Banner ─── */
/* ─── Mini Promo Banner (Google Features Grid) ─── */
const PromoBanner: React.FC = memo(() => (
  <section className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h3 className="text-3xl font-medium text-[#202124]">Why choose us</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#f8f9fa] rounded-[24px] p-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-[#1A73E8]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h4 className="text-[18px] font-medium text-[#202124] mb-2">Authentic Products</h4>
          <p className="text-[14px] text-[#5f6368]">100% genuine pure attars and authentic Islamic literature.</p>
        </div>
        <div className="bg-[#f8f9fa] rounded-[24px] p-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-[#1A73E8]">
            <Truck className="h-6 w-6" />
          </div>
          <h4 className="text-[18px] font-medium text-[#202124] mb-2">Fast Delivery</h4>
          <p className="text-[14px] text-[#5f6368]">Secure, leak-proof packaging shipped directly to your door.</p>
        </div>
        <div className="bg-[#f8f9fa] rounded-[24px] p-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-[#1A73E8]">
            <Headphones className="h-6 w-6" />
          </div>
          <h4 className="text-[18px] font-medium text-[#202124] mb-2">Dedicated Support</h4>
          <p className="text-[14px] text-[#5f6368]">Our team is always here to help you find the perfect fragrance.</p>
        </div>
      </div>
    </div>
  </section>
));
PromoBanner.displayName = 'PromoBanner';

/* ─── Main Page ─── */
export default function HomePage() {
  const { categories, loading: categoriesLoading } = useProducts();

  return (
    <div className="min-h-screen bg-[#f8f9fa]">

      {/* 1. Banner Carousel */}
      <Hero />

      {/* 2. Featured Collection */}
      <Suspense fallback={<div className="h-64 flex items-center justify-center bg-white"><div className="w-8 h-8 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin" /></div>}>
        <FeaturedProducts />
      </Suspense>

      {/* 3. Removed Testimonials as per request */}
    </div>
  );
}
