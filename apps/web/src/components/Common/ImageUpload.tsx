import React, { useState, useRef, useCallback, useEffect, useId } from 'react';
import { Upload, X, Link, CheckCircle, Image as ImageIcon, Loader, Camera, Star } from 'lucide-react';
import { motion } from 'framer-motion';

import { StorageService, UploadProgress } from '../../services/storageService';
import { useNotification } from '../../contexts/NotificationContext';
import { normalizeImageUrl, isValidImageUrl } from '../../utils/imageUrlUtils';

type ImageUploadValue = string | string[];
type ImageUploadOnChange = (url: ImageUploadValue | ((prev: ImageUploadValue) => ImageUploadValue)) => void;

interface ImageUploadProps {
  value?: string | string[];
  onChange: ImageUploadOnChange;
  onPathChange?: (path: string) => void;
  onMainImageChange?: (index: number) => void; // Callback when main image changes
  mainImageIndex?: number; // Index of the main/featured image
  folder?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showUrlInput?: boolean;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  maxWidth?: number;
  maxHeight?: number;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  helperText?: string;
  accept?: string;
  useCloudStorage?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onPathChange,
  onMainImageChange,
  mainImageIndex = 0,
  folder = 'categories',
  placeholder = 'Upload an image or enter URL',
  className = '',
  disabled = false,
  showUrlInput = true,
  aspectRatio = 'auto',
  maxWidth = 400,
  maxHeight = 300,
  multiple = false,
  maxFiles = 5,
  label = 'Upload Images',
  helperText = 'Click to upload or drag and drop',
  accept = 'image/*',
  useCloudStorage = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const stringValue = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : '';
  const [urlInput, setUrlInput] = useState(stringValue);
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadId = useId();
  const { showNotification, showSuccess, showError } = useNotification();

  const images = Array.isArray(value) ? value.filter(img => img && img.trim() !== '') : value ? [value] : [];
  
  // Update images when value changes
  useEffect(() => {
    const newImages = Array.isArray(value) ? value.filter(img => img && img.trim() !== '') : value ? [value] : [];
    if (JSON.stringify(newImages) !== JSON.stringify(images)) {
      // Images have changed, component will re-render
    }
  }, [value, images]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file type — allow empty MIME (some Android camera captures) and HEIC/HEIF (iOS)
    const isImage = !file.type || file.type.startsWith('image/');
    if (!isImage) {
      showError('Upload Error', 'Only image files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Upload Error', 'Each image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);

    try {
      if (useCloudStorage) {
        // Use cloud storage
        const imageUrl = await StorageService.uploadImage(
          file,
          folder,
          (progress) => { setUploadProgress(progress); }
        );

        // StorageService.uploadImage returns a string URL directly
        if (imageUrl) {
          if (multiple) {
            // Use functional update to avoid race conditions with concurrent uploads
            onChange((prevValue) => {
              const prevImages = Array.isArray(prevValue) ? prevValue : prevValue ? [prevValue] : [];
              const newImages = [...prevImages, imageUrl];
              // If this is the first image and no main image is set, set it as main
              if (newImages.length === 1 && onMainImageChange) {
                setTimeout(() => onMainImageChange(0), 0);
              }
              return newImages;
            });
          } else {
            onChange(imageUrl);
            setUrlInput(imageUrl);
          }
          showSuccess('Upload Successful', 'Image uploaded successfully');
        } else {
          showError('Upload Failed', 'Failed to get image URL');
        }
      } else {
        // Use base64 encoding
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;
        if (multiple) {
          // Use functional update to avoid race conditions with concurrent uploads
          onChange((prevValue) => {
            const prevImages = Array.isArray(prevValue) ? prevValue : prevValue ? [prevValue] : [];
            const newImages = [...prevImages, base64];
            // If this is the first image and no main image is set, set it as main
            if (newImages.length === 1 && onMainImageChange) {
              setTimeout(() => onMainImageChange(0), 0);
            }
            return newImages;
          });
        } else {
          onChange(base64);
          setUrlInput(base64);
        }
        showSuccess('Upload Successful', 'Image uploaded successfully');
      }
    } catch (error) {
      showError('Upload Error', error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadProgress(null);
      setIsUploading(false);
    }
  }, [useCloudStorage, folder, multiple, onChange, onMainImageChange, showError, showSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (files.length === 0) {
      showNotification({
        type: 'error',
        title: 'Invalid File',
        message: 'Please drop image files'
      });
      return;
    }

    if (multiple) {
      // Upload multiple files
      const remainingSlots = maxFiles - images.length;
      const filesToUpload = files.slice(0, remainingSlots);
      
      if (files.length > remainingSlots) {
        showNotification({
          type: 'warning',
          title: 'Too Many Files',
          message: `Only ${remainingSlots} more image(s) can be uploaded. Uploading first ${remainingSlots} files.`
        });
      }
      
      // Batch upload all files
      setIsUploading(true);
      Promise.all(filesToUpload.map(file => handleFileUpload(file)))
        .catch((error) => {
          // Individual errors are handled in handleFileUpload
          console.error('Batch upload error:', error);
        })
        .finally(() => {
          setIsUploading(false);
        });
    } else {
      // Single file mode - use first file
      handleFileUpload(files[0]);
    }
  }, [disabled, multiple, maxFiles, images.length, handleFileUpload, showNotification]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (multiple) {
      // Upload multiple files in batch
      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - images.length;
      const filesToUpload = fileArray.slice(0, remainingSlots);
      
      if (fileArray.length > remainingSlots) {
        showNotification({
          type: 'warning',
          title: 'Too Many Files',
          message: `Only ${remainingSlots} more image(s) can be uploaded. Uploading first ${remainingSlots} files.`
        });
      }
      
      // Batch upload all files
      setIsUploading(true);
      Promise.all(filesToUpload.map(file => handleFileUpload(file)))
        .catch((error) => {
          // Individual errors are handled in handleFileUpload
          console.error('Batch upload error:', error);
        })
        .finally(() => {
          setIsUploading(false);
        });
    } else {
      // Single file mode
      handleFileUpload(files[0]);
    }
    
    // Reset input so same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  }, [multiple, maxFiles, images.length, handleFileUpload, showNotification]);

  const handleUrlSubmit = () => {
    const url = urlInput.trim();
    if (url) {
      onChange(url);
      setShowUrlField(false);
      showNotification({
        type: 'success',
        title: 'Image URL Updated',
        message: 'Image URL has been updated'
      });
    }
  };

  const handleRemoveImage = (index?: number) => {
    if (multiple && index !== undefined) {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    } else {
      onChange(multiple ? [] : '');
      onPathChange?.('');
      setUrlInput('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraCapture = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  }, []);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case 'landscape': return 'aspect-video';
      case 'portrait': return 'aspect-[3/4]';
      default: return '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Multiple Images Preview */}
      {multiple && images.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, index) => {
              // Normalize and validate image URL
              const normalizedImg = normalizeImageUrl(img);
              const isValidImage = isValidImageUrl(normalizedImg);
              
              const isMainImage = index === mainImageIndex;
              
              return isValidImage ? (
                <div 
                  key={index} 
                  className={`relative rounded-lg overflow-hidden border-2 aspect-square bg-gray-50 cursor-pointer transition-all ${
                    isMainImage 
                      ? 'border-amber-500 ring-2 ring-amber-200 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (!disabled && onMainImageChange) {
                      onMainImageChange(index);
                    }
                  }}
                  title={isMainImage ? 'Main image (click to change)' : 'Click to set as main image'}
                >
                  <img
                    src={normalizedImg}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.jpg';
                    }}
                  />
                  
                  {/* Main Image Badge */}
                  {isMainImage && (
                    <div className="absolute top-1 left-1 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-md shadow-md">
                      <Star className="h-3 w-3 fill-current" />
                      <span>Main</span>
                    </div>
                  )}
                  
                  {/* Set as Main Button (if not main) */}
                  {!isMainImage && !disabled && onMainImageChange && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMainImageChange(index);
                        }}
                        className="px-3 py-1.5 bg-white text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 shadow-md flex items-center gap-1"
                        title="Set as main image"
                      >
                        <Star className="h-3 w-3" />
                        Set Main
                      </button>
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  {!disabled && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(index);
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10 shadow-md"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  
                  {/* Image Number Badge */}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black bg-opacity-60 text-white text-xs rounded">
                    {index + 1}
                  </div>
                </div>
              ) : null;
            })}
          </div>
          
          {/* Helper Text */}
          {images.length > 0 && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500" />
              The image marked as "Main" will be used as the primary product image. Click any image to set it as main.
            </p>
          )}
        </div>
      )}

      {/* Single Image Preview or Upload Area */}
      <div className="relative">
        {!multiple && (() => {
          const normalizedValue = normalizeImageUrl(stringValue);
          const isValid = isValidImageUrl(normalizedValue);
          if (isValid) {
            return (
              <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${getAspectRatioClass()} bg-gray-50`}>
                <img
                  src={normalizedValue}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  style={{ maxWidth, maxHeight }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpg';
                  }}
                />

                {/* Remove button */}
                {!disabled && (
                  <button
                    onClick={() => handleRemoveImage()}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Upload overlay when uploading */}
                <>
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                    >
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        {uploadProgress && (
                          <div className="text-sm">
                            {uploadProgress.percentage}%
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </>
              </div>
            );
          }
          return null;
        })() || (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
              ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${getAspectRatioClass()}
            `}
          >
            {/* Hidden file inputs — kept in DOM so mobile browsers handle them correctly */}
            <input
              ref={fileInputRef}
              id={`${uploadId}-file`}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
              multiple={multiple}
            />
            <input
              ref={cameraInputRef}
              id={`${uploadId}-camera`}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  Array.from(files).forEach(file => handleFileUpload(file));
                }
                e.target.value = '';
              }}
              className="hidden"
              disabled={disabled}
            />

            <div className="flex flex-col items-center justify-center h-full min-h-[120px]">
              {isUploading ? (
                <>
                  <Loader className="h-8 w-8 text-amber-500 animate-spin mb-3" />
                  <p className="text-sm text-gray-600">Uploading...</p>
                  {uploadProgress && (
                    <div className="mt-2 w-full max-w-xs">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{uploadProgress.percentage}%</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-4">{placeholder}</p>

                  {/* Upload buttons — stopPropagation prevents the outer div from re-triggering */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                    <button
                      type="button"
                      disabled={disabled}
                      className="flex flex-col items-center justify-center cursor-pointer text-gray-700 hover:text-amber-600 px-4 py-2"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      <div className="p-2 bg-gray-100 rounded-full mb-1">
                        <Upload className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium">Upload</span>
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      className="flex flex-col items-center justify-center cursor-pointer text-gray-700 hover:text-amber-600 px-4 py-2"
                      onClick={(e) => { e.stopPropagation(); handleCameraCapture(); }}
                    >
                      <div className="p-2 bg-gray-100 rounded-full mb-1">
                        <Camera className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium">Camera</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">PNG, JPG, WebP up to 5MB</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* URL Input Section */}
      {showUrlInput && !disabled && (
        <div className="space-y-2">
          {!showUrlField ? (
            <button
              onClick={() => setShowUrlField(true)}
              className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <Link className="h-4 w-4" />
              <span>Or enter image URL</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <button
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setShowUrlField(false);
                  setUrlInput(stringValue);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Helper Text */}
      {helperText && images.length === 0 && !stringValue && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}

      {/* Upload Status */}
      <>
        {isUploading && uploadProgress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-sm text-gray-600"
          >
            <Upload className="h-4 w-4 animate-pulse" />
            <span>
              Uploading... {uploadProgress.percentage}%
              ({Math.round(uploadProgress.loaded / 1024)}KB / {Math.round(uploadProgress.total / 1024)}KB)
            </span>
          </motion.div>
        )}
      </>
    </div>
  );
};
