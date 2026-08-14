import React, { useState } from 'react';
import { Star, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string, title?: string, images?: string[]) => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const { showNotification } = useNotification();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (images.length < 3) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setImages(prev => [...prev, event.target?.result as string]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showNotification({ type: 'error', title: 'Rating required', message: 'Please select a star rating.' });
      return;
    }
    if (comment.trim() === '') {
      showNotification({ type: 'error', title: 'Comment required', message: 'Please write a comment about the product.' });
      return;
    }
    onSubmit(rating, comment, title, images);

    // Reset form
    setRating(0);
    setTitle('');
    setComment('');
    setImages([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
              <motion.button
                key={starValue}
                type="button"
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(starValue)}
                whileHover={{ scale: 1.2, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className="p-1"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    starValue <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Review Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Review Title (Optional)
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
          placeholder="Summarize your review in a few words"
          maxLength={100}
        />
      </div>

      {/* Review Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review *
        </label>
        <textarea
          id="comment"
          rows={5}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Share your thoughts about the product..."
          required
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos (Optional)
        </label>
        <div className="space-y-3">
          {/* Upload Button */}
          {images.length < 3 && (
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
              <div className="text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload photos</p>
                <p className="text-xs text-gray-500">Up to 3 images, max 5MB each</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}

          {/* Preview Images */}
          {images.length > 0 && (
            <div className="flex gap-3">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Submit Review
        </motion.button>
      </div>
    </form>
  );
};
