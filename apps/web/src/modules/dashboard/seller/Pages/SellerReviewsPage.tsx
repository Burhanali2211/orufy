import React, { useState, useEffect } from 'react';
import { 
  Star, MessageSquare, ThumbsUp, ThumbsDown, Reply, 
  Search, Filter, TrendingUp, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';

interface Review {
  id: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  replied: boolean;
  reply?: string;
  productId?: string;
}

export const SellerReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // First get seller's products
      const productsResponse = await apiClient.get<{ success: boolean; data: { products: any[] } }>('/seller/products?limit=1000');

      if (productsResponse.success && productsResponse.data?.products) {
        const productIds = productsResponse.data.products.map((p: any) => p.id);
        
        if (productIds.length === 0) {
          setReviews([]);
          return;
        }

        // Fetch reviews for all seller's products
        const allReviews: Review[] = [];
        for (const productId of productIds) {
          try {
            const productResponse = await apiClient.get<{ success: boolean; data: any }>(`/products/${productId}`);
            if (productResponse.success && productResponse.data?.reviews) {
              const productReviews = productResponse.data.reviews.map((review: any) => ({
                id: review.id,
                productName: productResponse.data.name,
                customerName: review.profiles?.full_name || 'Customer',
                rating: review.rating,
                comment: review.comment || review.title || '',
                date: review.createdAt,
                helpful: review.helpful_count || 0,
                replied: false, 
                productId: productId
              }));
              allReviews.push(...productReviews);
            }
          } catch (error) {
            // Skip products with no reviews
            continue;
          }
        }
        
        setReviews(allReviews);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    average: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0,
    total: reviews.length,
    pending: reviews.filter(r => !r.replied).length,
    positive: reviews.filter(r => r.rating >= 4).length
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { stars, count, percentage };
  });

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    
    try {
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, replied: true, reply: replyText }
          : review
      ));
      setReplyingTo(null);
      setReplyText('');
      showSuccess('Reply submitted successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to submit reply');
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' || 
      review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  if (loading) {
    return (
      <SellerDashboardLayout title="Reviews" subtitle="Manage customer feedback">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout title="Reviews" subtitle="Manage customer feedback">
      <div className="space-y-8 pb-12">
        <div className="flex justify-end">
          <button
            onClick={fetchReviews}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-bold">Refresh Feed</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center shadow-sm">
                <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Average</p>
                <p className="text-2xl font-black text-slate-900">{stats.average.toFixed(1)}<span className="text-slate-400 text-lg">/5</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm">
                <MessageSquare className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total</p>
                <p className="text-2xl font-black text-slate-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center shadow-sm">
                <AlertCircle className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-sm">
                <ThumbsUp className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Positive</p>
                <p className="text-2xl font-black text-slate-900">{stats.positive}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Rating Distribution */}
          <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
            <h3 className="text-xl font-bold text-slate-900 mb-8">Rating Distribution</h3>
            <div className="space-y-5">
              {ratingDistribution.map((item) => (
                <div key={item.stars} className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 w-16">
                    <span className="text-slate-900 font-bold">{item.stars}</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-slate-500 text-xs font-bold w-12 text-right">{item.percentage}%</span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Most customers give your store a <span className="text-slate-900 font-bold">4.5 star rating</span>. Keep up the great work!
              </p>
            </div>
          </div>

          {/* Reviews List and Filter */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
                  />
                </div>
                <div className="relative">
                  <select
                    value={ratingFilter === 'all' ? 'all' : ratingFilter.toString()}
                    onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="w-full md:w-48 appearance-none pl-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="all">All Ratings</option>
                    {[5, 4, 3, 2, 1].map(num => (
                      <option key={num} value={num}>{num} Stars</option>
                    ))}
                  </select>
                  <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-6">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all group">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl border border-slate-200">
                          {review.customerName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-slate-900 font-bold text-lg leading-none mb-2">{review.customerName}</h4>
                          <p className="text-blue-600 font-bold text-xs uppercase tracking-wider">{review.productName}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {renderStars(review.rating, 'lg')}
                        <span className="text-slate-400 text-xs font-bold uppercase">{formatDate(review.date)}</span>
                      </div>
                    </div>

                    <p className="text-slate-700 font-medium text-lg leading-relaxed mb-6 italic">
                      "{review.comment}"
                    </p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
                          <ThumbsUp className="w-5 h-5" />
                          <span className="text-sm font-bold">{review.helpful} Helpful</span>
                        </div>
                        {review.replied ? (
                          <span className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-black rounded-full uppercase tracking-widest shadow-sm">
                            <RefreshCw className="w-3 h-3" />
                            Replied
                          </span>
                        ) : (
                          <span className="px-4 py-1.5 bg-orange-50 text-orange-600 text-xs font-black rounded-full uppercase tracking-widest shadow-sm">
                            Needs Attention
                          </span>
                        )}
                      </div>
                      
                      {!review.replied && replyingTo !== review.id && (
                        <button
                          onClick={() => setReplyingTo(review.id)}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                          <Reply className="w-4 h-4" />
                          Send Reply
                        </button>
                      )}
                    </div>

                    {review.replied && review.reply && (
                      <div className="mt-8 bg-slate-50 rounded-[2rem] p-6 border border-slate-100 relative">
                        <div className="absolute -top-3 left-8 px-4 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                          Your Response
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">{review.reply}</p>
                      </div>
                    )}

                    {replyingTo === review.id && (
                      <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your response to this customer..."
                          rows={4}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium resize-none"
                        />
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                            className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                          >
                            Discard
                          </button>
                          <button
                            onClick={() => handleReply(review.id)}
                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                          >
                            Post Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-xl shadow-slate-200/40 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                    <MessageSquare className="w-12 h-12 text-slate-200" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">No reviews found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto font-medium">
                    Try adjusting your filters or search terms to find specific customer feedback.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerReviewsPage;


