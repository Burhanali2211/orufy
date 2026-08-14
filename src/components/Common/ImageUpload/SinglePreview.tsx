import React from 'react';
import { X, Loader, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { normalizeImageUrl, isValidImageUrl } from '../../../utils/images';

interface SinglePreviewProps {
  url: string;
  disabled: boolean;
  onRemove: () => void;
  isUploading: boolean;
  uploadProgress: { percentage: number; loaded: number; total: number } | null;
  aspectRatioClass: string;
  maxWidth?: number;
  maxHeight?: number;
}

export const SinglePreview: React.FC<SinglePreviewProps> = ({
  url,
  disabled,
  onRemove,
  isUploading,
  uploadProgress,
  aspectRatioClass,
  maxWidth,
  maxHeight
}) => {
  const normalizedValue = normalizeImageUrl(url);
  const isValid = isValidImageUrl(normalizedValue);
  
  if (!isValid) return null;

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${aspectRatioClass} bg-gray-50`}>
      <img
        src={normalizedValue}
        alt="Preview"
        className="w-full h-full object-cover"
        style={{ maxWidth, maxHeight }}
        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.jpg'; }}
      />
      {!disabled && !isUploading && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg"
        >
          <div className="text-center text-white p-4">
            <Loader className="h-8 w-8 hidden mx-auto mb-2" />
            <p className="text-sm font-medium">Processing...</p>
            {uploadProgress && (
              <div className="mt-3 w-32 mx-auto">
                <div className="bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-white h-full transition-all duration-300" style={{ width: `${uploadProgress.percentage}%` }} />
                </div>
                <p className="text-[10px] mt-1.5 opacity-80">{uploadProgress.percentage}%</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
