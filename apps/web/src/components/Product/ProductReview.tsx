import React, { useState } from 'react';
import { Star, ThumbsUp, Shield } from 'lucide-react';
import { Review } from '../../types';

interface ProductReviewProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
}

export const ProductReview: React.FC<ProductReviewProps> = ({ review, onHelpful }) => {
  const [isHelpful, setIsHelpful] = useState(false);

  const handleHelpful = () => {
    if (onHelpful) {
      onHelpful(review.id);
      setIsHelpful(true);
    }
  };

  // Use new field names with fallback to legacy fields
  const reviewDate = review.createdAt || new Date(review.created_at || '');
  const reviewerName = review.profiles?.full_name || 'Anonymous';
  const reviewerAvatar = review.profiles?.avatar_url;

  return (
    <div className="py-6 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start space-x-4">
        <img
          src={reviewerAvatar || `https://api.dicebear.com/8.x/initials/svg?seed=${reviewerName}`}
          alt={reviewerName}
          className="h-12 w-12 rounded-full object-cover bg-gray-200"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">{reviewerName}</h4>
                {review.isVerifiedPurchase && (
                  <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    <Shield className="h-3 w-3" />
                    Verified Purchase
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {reviewDate instanceof Date ? reviewDate.toLocaleDateString() : new Date(reviewDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Review Title */}
          {review.title && (
            <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
          )}

          {/* Review Comment */}
          {review.comment && (
            <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
          )}

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 mb-3">
              {review.images.slice(0, 3).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Review image ${index + 1}`}
                  className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                />
              ))}
              {review.images.length > 3 && (
                <div className="h-16 w-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{review.images.length - 3}</span>
                </div>
              )}
            </div>
          )}

          {/* Helpful Button */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleHelpful}
              disabled={isHelpful}
              className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full transition-colors ${
                isHelpful
                  ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${isHelpful ? 'fill-current' : ''}`} />
              <span>
                {isHelpful ? 'Helpful!' : 'Helpful'}
                {review.helpfulCount && review.helpfulCount > 0 && ` (${review.helpfulCount})`}
              </span>
            </button>

            {!review.isApproved && (
              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                Pending Approval
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
