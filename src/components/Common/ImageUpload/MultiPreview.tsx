import React from 'react';
import { X, Star } from 'lucide-react';
import { normalizeImageUrl, isValidImageUrl } from '../../../utils/images';

interface MultiPreviewProps {
  images: string[];
  mainImageIndex: number;
  disabled: boolean;
  onMainImageChange?: (index: number) => void;
  onRemove: (index: number) => void;
}

export const MultiPreview: React.FC<MultiPreviewProps> = ({
  images,
  mainImageIndex,
  disabled,
  onMainImageChange,
  onRemove
}) => {
  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img, index) => {
          const normalizedImg = normalizeImageUrl(img);
          const isValidImage = isValidImageUrl(normalizedImg);
          const isMainImage = index === mainImageIndex;
          
          if (!isValidImage) return null;

          return (
            <div 
              key={index} 
              className={`relative rounded-lg overflow-hidden border-2 aspect-square bg-gray-50 cursor-pointer transition-all ${
                isMainImage ? 'border-amber-500 ring-2 ring-amber-200 shadow-lg' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => !disabled && onMainImageChange?.(index)}
            >
              <img
                src={normalizedImg}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.jpg'; }}
              />
              {isMainImage && (
                <div className="absolute top-1 left-1 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-md shadow-md">
                  <Star className="h-3 w-3 fill-current" />
                  <span>Main</span>
                </div>
              )}
              {!isMainImage && !disabled && onMainImageChange && (
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); onMainImageChange(index); }}
                    className="px-3 py-1.5 bg-white text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 shadow-md flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" /> Set Main
                  </button>
                </div>
              )}
              {!disabled && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10 shadow-md"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black bg-opacity-60 text-white text-xs rounded">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <Star className="h-3 w-3 text-amber-500" />
        The image marked as "Main" will be used as the primary product image. Click any image to set it as main.
      </p>
    </div>
  );
};
