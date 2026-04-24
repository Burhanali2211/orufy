import React, { useState, useRef, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSwipeGesture } from '../../hooks/useMobileGestures';
import { SafeImage } from '../Common/MediaErrorHandler';
import { apiClient } from '../../lib/apiClient';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  rating: number;
  product: string;
  verified: boolean;
}

// Use placeholder avatar images from a reliable source
const generateAvatarUrl = (name: string, size: number = 80) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=6366f1&color=ffffff&bold=true`;
};

// Testimonial Card Component
const TestimonialCard: React.FC<{ testimonial: Testimonial, isFeatured?: boolean }> = ({
  testimonial,
  isFeatured = false
}) => {
  return (
    <div className={`bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-3 sm:p-4 border border-gray-100 hover:border-blue-200 touch-manipulation ${isFeatured ? 'sm:p-5 md:p-6' : ''}`}>
      <div className={`flex items-center justify-between mb-2 sm:mb-3 ${isFeatured ? 'sm:mb-4' : ''}`}>
        <div className="flex space-x-0.5 sm:space-x-1">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
          ))}
        </div>
        {testimonial.verified && (
          <div className="flex items-center space-x-1 text-green-600">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></div>
            <span className="text-[10px] font-medium">Verified</span>
          </div>
        )}
      </div>

      <blockquote className={`text-gray-700 leading-relaxed flex-grow ${isFeatured ? 'text-base sm:text-lg md:text-xl font-medium mb-4 sm:mb-6' : 'text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-4'}`}>
        "{testimonial.quote}"
      </blockquote>

      <div className={`border-t border-gray-100 pt-2.5 sm:pt-3 ${isFeatured ? 'sm:pt-4' : ''}`}>
        <div className="flex items-center">
          <SafeImage
            src={testimonial.avatar}
            alt={testimonial.name}
            className={`rounded-full object-cover ${isFeatured ? 'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 border-2 sm:border-4 border-white/20' : 'h-8 w-8 sm:h-10 sm:w-10'}`}
            width={isFeatured ? 56 : 40}
            height={isFeatured ? 56 : 40}
          />
          <div className="ml-2 sm:ml-3 flex-1 min-w-0">
            <p className={`font-bold text-gray-900 truncate ${isFeatured ? 'text-sm sm:text-base md:text-lg' : 'text-xs sm:text-sm'}`}>{testimonial.name}</p>
            <p className={`truncate ${isFeatured ? 'text-xs sm:text-sm text-gray-600' : 'text-[10px] sm:text-xs text-gray-600'}`}>{testimonial.role}</p>
            <p className={`truncate mt-0.5 ${isFeatured ? 'text-[10px] text-gray-500' : 'text-[10px] text-gray-500'}`}>{testimonial.location}</p>
          </div>
        </div>
        <div className={`mt-2 rounded-md sm:rounded-lg px-2 py-1.5 ${isFeatured ? 'sm:px-3 sm:py-2 bg-gray-50' : 'bg-gray-50'}`}>
          <p className={`font-medium truncate ${isFeatured ? 'text-xs sm:text-sm text-gray-600' : 'text-[10px] text-gray-600'}`}>Purchased: {testimonial.product}</p>
        </div>
      </div>
    </div>
  );
};

// Testimonial Carousel Component
const TestimonialCarousel: React.FC<{ testimonials: Testimonial[] }> = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (testimonials.length === 0) return;
    
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev >= testimonials.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [testimonials.length]);

  // Pause auto-play on user interaction
  const pauseAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const goToNext = () => {
    pauseAutoPlay();
    setCurrentIndex(prev => (prev >= testimonials.length - 1 ? 0 : prev + 1));
  };

  const goToPrevious = () => {
    pauseAutoPlay();
    setCurrentIndex(prev => (prev <= 0 ? testimonials.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    pauseAutoPlay();
    setCurrentIndex(index);
  };

  // Swipe gesture support
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
  }, {
    minSwipeDistance: 50,
    preventDefaultTouchmove: false,
  });

  // Calculate item width and translateX for carousel
  const itemWidth = 100; // 100% for 1 item per view
  const translateX = -(currentIndex * itemWidth);

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(${translateX}%)`,
            width: `${testimonials.length * 100}%`
          }}
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full px-1"
            >
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-md z-10 active:bg-white/80 touch-manipulation hidden sm:flex items-center justify-center"
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-md z-10 active:bg-white/80 touch-manipulation hidden sm:flex items-center justify-center"
        aria-label="Next testimonial"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700" />
      </button>

      {/* Mobile Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-md z-10 active:bg-white/80 touch-manipulation sm:hidden flex items-center justify-center"
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="w-3 h-3 text-neutral-700" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-md z-10 active:bg-white/80 touch-manipulation sm:hidden flex items-center justify-center"
        aria-label="Next testimonial"
      >
        <ChevronRight className="w-3 h-3 text-neutral-700" />
      </button>

      {/* Indicators */}
      <div className="flex justify-center mt-4 space-x-1.5">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${index === currentIndex
                ? 'bg-blue-600'
                : 'bg-gray-300 hover:bg-gray-400'
              } touch-manipulation`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export const Testimonials: React.FC = () => {
  const [testimonialsData, setTestimonialsData] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    averageRating: 0,
    satisfactionRate: 0
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      // Fetch featured products with reviews
      const response = await apiClient.get<{ success: boolean; data: { products: any[] } }>('/products?featured=true&limit=20');

      if (response.success && response.data?.products) {
        const allTestimonials: Testimonial[] = [];

        for (const product of response.data.products.slice(0, 10)) {
          try {
            const productDetail = await apiClient.get<{ success: boolean; data: any }>(`/products/${product.id}`);
            if (productDetail.success && productDetail.data?.reviews) {
              const productReviews = productDetail.data.reviews
                .filter((r: any) => r.rating >= 4) // Only positive reviews
                .slice(0, 2) // Max 2 per product
                .map((review: any) => ({
                  quote: review.comment || review.title || '',
                  name: review.profiles?.full_name || 'Customer',
                  role: 'Verified Buyer',
                  location: '',
                  avatar: review.profiles?.avatar_url || generateAvatarUrl(review.profiles?.full_name || 'Customer'),
                  rating: review.rating,
                  product: product.name,
                  verified: review.is_verified_purchase || false
                }));
              allTestimonials.push(...productReviews);
            }
          } catch (error) {
            continue;
          }
        }

        // If we have testimonials, use them; otherwise show empty state
        if (allTestimonials.length > 0) {
          setTestimonialsData(allTestimonials.slice(0, 6)); // Limit to 6
          
          // Calculate stats
          const totalRatings = allTestimonials.reduce((sum, t) => sum + t.rating, 0);
          setStats({
            totalCustomers: allTestimonials.length,
            averageRating: totalRatings / allTestimonials.length,
            satisfactionRate: Math.round((allTestimonials.filter(t => t.rating >= 4).length / allTestimonials.length) * 100)
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
      setTestimonialsData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-400">Loading testimonials...</div>
          </div>
        </div>
      </section>
    );
  }

  if (testimonialsData.length === 0) {
    return null; // Don't show testimonials section if no data
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-1.5 bg-blue-100 text-blue-800 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 mb-3 sm:mb-4"
          >
            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
            <span className="font-medium text-[10px] sm:text-xs">5.0 Average Rating</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight"
          >
            Loved by Thousands
            <span className="block text-blue-600">of Happy Customers</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-3 sm:px-0"
          >
            Join over 1 million satisfied customers who trust us for their shopping needs. Here's what they have to say about their experience.
          </motion.p>
        </div>

        {/* Featured Testimonial */}
        {testimonialsData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mb-6 sm:mb-8 md:mb-10"
          >
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white">
              <Quote className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-200 mb-3 sm:mb-4 md:mb-6" />
              <blockquote className="text-base sm:text-lg md:text-xl font-medium leading-relaxed mb-4 sm:mb-6">
                "{testimonialsData[0]?.quote}"
              </blockquote>
              <div className="flex items-center">
                <SafeImage
                  src={testimonialsData[0]?.avatar || ''}
                  alt={testimonialsData[0]?.name || 'Customer'}
                  className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full border-2 sm:border-4 border-white/20 object-cover"
                  width={56}
                  height={56}
                />
                <div className="ml-2.5 sm:ml-3 md:ml-4">
                  <div className="flex items-center space-x-1.5 mb-0.5 sm:mb-1">
                    <p className="font-bold text-sm sm:text-base md:text-lg">{testimonialsData[0]?.name}</p>
                    {testimonialsData[0]?.verified && (
                      <>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"></div>
                        <span className="text-[10px] sm:text-xs text-blue-200">Verified Buyer</span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-blue-200">{testimonialsData[0]?.role}{testimonialsData[0]?.location ? ` • ${testimonialsData[0]?.location}` : ''}</p>
                  <p className="text-[10px] text-blue-100 mt-1 line-clamp-1">Purchased: {testimonialsData[0]?.product}</p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex space-x-0.5 sm:space-x-1">
                {[...Array(testimonialsData[0]?.rating || 5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Testimonials Carousel */}
        {testimonialsData.length > 1 && (
          <div className="mb-6 sm:mb-8 md:mb-10">
            <TestimonialCarousel testimonials={testimonialsData.slice(1)} />
          </div>
        )}

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6"
        >
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-0.5 sm:mb-1">
              {stats.totalCustomers > 0 ? `${stats.totalCustomers}+` : '0'}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 font-medium">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-0.5 sm:mb-1">
              {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}/5` : '4.9/5'}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 font-medium">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 mb-0.5 sm:mb-1">
              {stats.satisfactionRate > 0 ? `${stats.satisfactionRate}%` : '98%'}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 font-medium">Satisfaction Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mb-0.5 sm:mb-1">24/7</div>
            <div className="text-[10px] sm:text-xs text-gray-600 font-medium">Customer Support</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;