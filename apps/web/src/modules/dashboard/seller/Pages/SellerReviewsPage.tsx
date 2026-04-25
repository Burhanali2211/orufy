import React, { useState, useEffect } from 'react';
import { 
  Star, MessageSquare, ThumbsUp, ThumbsDown, Reply, 
  Search, Filter, TrendingUp, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

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
                replied: false, // TODO: Add seller reply functionality
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
      // TODO: Implement seller reply API endpoint
      // For now, just update locally
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
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout title="Reviews" subtitle="Manage customer feedback">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={fetchReviews}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Average Rating</p>
                <p className="text-2xl font-bold text-white">{stats.average}/5</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Total Reviews</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Pending Reply</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Positive Reviews</p>
                <p className="text-2xl font-bold text-white">{stats.positive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {ratingDistribution.map((item) => (
              <div key={item.stars} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-24">
                  <span className="text-white font-medium">{item.stars}</span>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-white/60 text-sm w-16 text-right">{item.count} ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <select
              value={ratingFilter === 'all' ? 'all' : ratingFilter.toString()}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-cyan-400 font-medium">{review.productName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-white/40 text-sm">{formatDate(review.date)}</span>
                  </div>
                </div>
                {review.replied ? (
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg">Replied</span>
                ) : (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-lg">Pending</span>
                )}
              </div>

              <p className="text-white mb-3">{review.comment}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-white/50 text-sm">by {review.customerName}</span>
                  <div className="flex items-center gap-1 text-white/50 text-sm">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{review.helpful} helpful</span>
                  </div>
                </div>
                {!review.replied && (
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors text-sm"
                  >
                    <Reply className="w-4 h-4" />
                    Reply
                  </button>
                )}
              </div>

              {review.replied && review.reply && (
                <div className="mt-4 pl-4 border-l-2 border-cyan-500/30">
                  <p className="text-white/70 text-sm">{review.reply}</p>
                  <p className="text-cyan-400 text-xs mt-1">— Seller Response</p>
                </div>
              )}

              {replyingTo === review.id && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReply(review.id)}
                      className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
                    >
                      Submit Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerReviewsPage;

