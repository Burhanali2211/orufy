import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle, MapPin } from 'lucide-react';

interface VisitorTestimonial {
  id: string;
  name: string;
  location: string;
  avatar: string;
  product: string;
  rating: number;
  date: string;
  review: string;
  visitType: 'Store Visitor' | 'Verified Buyer';
}

const VISITOR_TESTIMONIALS: VisitorTestimonial[] = [
  {
    id: '1',
    name: 'Customer 1',
    location: 'City, Country',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    product: 'Premium Product',
    rating: 5,
    date: 'Jan 2025',
    review: 'Excellent quality and amazing customer service. Highly recommend this store for anyone looking for premium products.',
    visitType: 'Verified Buyer',
  },
  {
    id: '2',
    name: 'Customer 2',
    location: 'City, Country',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    product: 'Premium Product',
    rating: 5,
    date: 'Jan 2025',
    review: 'The quality of the items is unmatched. Delivery was fast and the packaging was very secure.',
    visitType: 'Verified Buyer',
  },
  {
    id: '3',
    name: 'Customer 3',
    location: 'City, Country',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
    product: 'Premium Product',
    rating: 5,
    date: 'Dec 2024',
    review: 'A truly premium experience from start to finish. The products look exactly like the pictures.',
    visitType: 'Verified Buyer',
  },
];

/* ── Avatar initials fallback ──────────────────────────────────────── */
const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_COLORS = [
  '#0071e3', '#34c759', '#ff9500', '#ff3b30', '#5856d6', '#af52de',
];

export const StoreVisitorsTestimonials: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 sm:mb-18"
        >
          {/* Eyebrow */}
          <p className="text-[14px] font-medium text-[#1A73E8] uppercase tracking-wider mb-2">
            What People Say
          </p>

          {/* Headline */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2 className="text-[28px] sm:text-[36px] font-normal text-[#202124] leading-tight max-w-lg">
              Loved by customers<br className="hidden sm:block" /> near and far.
            </h2>

            {/* Aggregate trust badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 text-[#fbbc04] fill-[#fbbc04]" />
                ))}
              </div>
              <div>
                <p className="text-[16px] font-medium text-[#202124] leading-none">5.0</p>
                <p className="text-[14px] text-[#5f6368] mt-0.5">from 200+ reviews</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Cards grid ─────────────────────────────────────── */}
        <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-6 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {VISITOR_TESTIMONIALS.slice(0, 3).map((item, idx) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="min-w-[85vw] sm:min-w-[350px] md:min-w-0 snap-center bg-white rounded-3xl p-6 sm:p-8 flex flex-col gap-5 sm:gap-6 shadow-sm border border-black/[0.03] hover:shadow-md transition-shadow duration-300"
            >
              {/* Stars */}
              <div className="flex items-center gap-1">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-[#fbbc04] fill-[#fbbc04]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[16px] text-[#202124] leading-relaxed font-normal flex-1">
                "{item.review}"
              </p>

              {/* Author row */}
              <div className="flex items-center gap-4 mt-auto pt-4">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white text-[14px] font-semibold"
                  style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                >
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute text-[13px] font-semibold">{getInitials(item.name)}</span>
                </div>

                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-[#202124] leading-tight truncate">{item.name}</p>
                  <p className="text-[13px] text-[#5f6368] mt-1 truncate">
                    {item.location}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoreVisitorsTestimonials;
