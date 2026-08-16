import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { normalizeImageUrl, isValidImageUrl } from '../../utils/imageUrlUtils';

type ImageUploadValue = string | string[];
type ImageUploadOnChange = (url: ImageUploadValue | ((prev: ImageUploadValue) => ImageUploadValue)) => void;

interface ImageUploadProps {
  value?: string | string[];
  onChange: ImageUploadOnChange;
  onPathChange?: (path: string) => void;
  onMainImageChange?: (index: number) => void;
  mainImageIndex?: number;
  folder?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
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
  onMainImageChange,
  mainImageIndex = 0,
  placeholder = 'Upload an image',
  className = '',
  disabled = false,
  multiple = false,
  maxFiles = 5,
  label = 'Upload Images',
  helperText = 'Click to upload',
  accept = 'image/*'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, showSuccess } = useNotification();
  const images = Array.isArray(value) ? value.filter(img => img && img.trim() !== '') : value ? [value] : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (multiple && images.length + files.length > maxFiles) {
      showError('Error', `Maximum ${maxFiles} images allowed.`);
      return;
    }

    try {
      const base64Promises = files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      );

      const base64Images = await Promise.all(base64Promises);
      
      if (multiple) {
        onChange((prev) => {
          const prevImages = Array.isArray(prev) ? prev : prev ? [prev] : [];
          return [...prevImages, ...base64Images];
        });
      } else {
        onChange(base64Images[0]);
      }
      
      showSuccess('Success', 'Images uploaded successfully');
    } catch (err) {
      showError('Error', 'Failed to read image files.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    if (multiple) {
      onChange(images.filter((_, i) => i !== index));
    } else {
      onChange('');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <label className="block text-sm font-bold text-stone-900">{label}</label>}

      {/* Previews */}
      {images.length > 0 && (
        <div className={`grid gap-4 ${multiple ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 w-48'}`}>
          {images.map((img, index) => {
            const isMain = index === mainImageIndex;
            return (
              <div 
                key={index} 
                className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${isMain && multiple ? 'border-stone-900 ring-2 ring-stone-900/20' : 'border-stone-200 hover:border-stone-400'}`}
                onClick={() => multiple && onMainImageChange && onMainImageChange(index)}
              >
                <img src={normalizeImageUrl(img)} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-red-500 rounded-full shadow-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isMain && multiple && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-md">Main</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Button */}
      {(!multiple && images.length === 0) || (multiple && images.length < maxFiles) ? (
        <div 
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${disabled ? 'opacity-50 cursor-not-allowed bg-stone-50 border-stone-200' : 'border-stone-300 hover:border-stone-900 hover:bg-stone-50'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100 mb-3 text-stone-600">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-stone-900">{placeholder}</p>
          {helperText && <p className="text-xs text-stone-500 mt-1 font-medium">{helperText}</p>}
        </div>
      ) : null}
    </div>
  );
};
