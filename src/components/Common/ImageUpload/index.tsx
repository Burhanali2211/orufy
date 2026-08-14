import React, { useState, useRef, useCallback, useEffect, useId } from 'react';
import { StorageService } from '../../../services/storageService';
import { ImageCompressionService } from '../../../services/imageCompressionService';
import { useNotification } from '../../../contexts/NotificationContext';
import { MultiPreview } from './MultiPreview';
import { SinglePreview } from './SinglePreview';
import { UploadArea } from './UploadArea';
import { UrlInput } from './UrlInput';
import { ImageUploadProps, UploadProgress } from './types';

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value, onChange, onPathChange, onMainImageChange, mainImageIndex = 0,
  folder = 'categories', placeholder = 'Upload an image or enter URL', 
  className = '', disabled = false, showUrlInput = true,
  aspectRatio = 'auto', maxWidth = 400, maxHeight = 300,
  multiple = false, maxFiles = 5, label = 'Upload Images',
  helperText = 'Click to upload or drag and drop', accept = 'image/*', useCloudStorage = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadId = useId();
  const { showNotification, showSuccess, showError } = useNotification();

  const stringValue = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : '';
  const [urlInput, setUrlInput] = useState(stringValue);
  const images = Array.isArray(value) ? value.filter(img => img && img.trim() !== '') : value ? [value] : [];

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type || !file.type.startsWith('image/')) {
      showError('Upload Error', 'Only image files are allowed');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showError('Upload Error', 'Each image must be less than 50MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);

    try {
      let optimizedFile = file;
      try {
        optimizedFile = await ImageCompressionService.optimizeImage(file);
      } catch (e) {
        console.warn('Compression failed, using original:', e);
      }

      const imageUrl = useCloudStorage 
        ? await StorageService.uploadImage(optimizedFile, folder, setUploadProgress)
        : await new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.onerror = rej;
            r.readAsDataURL(optimizedFile);
          });

      if (imageUrl) {
        if (multiple) {
          onChange((prev) => {
            const prevArr = Array.isArray(prev) ? prev : prev ? [prev] : [];
            const newArr = [...prevArr, imageUrl];
            if (newArr.length === 1 && onMainImageChange) setTimeout(() => onMainImageChange(0), 0);
            return newArr;
          });
        } else {
          onChange(imageUrl);
          setUrlInput(imageUrl);
        }
        showSuccess('Upload Successful', 'Image uploaded successfully');
      }
    } catch (error) {
      showError('Upload Error', error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadProgress(null);
      setIsUploading(false);
    }
  }, [useCloudStorage, folder, multiple, onChange, onMainImageChange, showError, showSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return showError('Invalid File', 'Please drop image files');

    if (multiple) {
      const remaining = maxFiles - images.length;
      if (files.length > remaining) showNotification({ type: 'warning', title: 'Too Many Files', message: `Only ${remaining} more can be uploaded.` });
      files.slice(0, remaining).forEach(handleFileUpload);
    } else {
      handleFileUpload(files[0]);
    }
  }, [disabled, multiple, maxFiles, images.length, handleFileUpload, showError, showNotification]);

  const handleRemoveImage = (index?: number) => {
    if (multiple && index !== undefined) {
      onChange(images.filter((_, i) => i !== index));
    } else {
      onChange(multiple ? [] : '');
      onPathChange?.('');
      setUrlInput('');
    }
  };

  const aspectRatioClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'landscape' ? 'aspect-video' : aspectRatio === 'portrait' ? 'aspect-[3/4]' : '';

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      {multiple && <MultiPreview images={images} mainImageIndex={mainImageIndex} disabled={disabled} onMainImageChange={onMainImageChange} onRemove={handleRemoveImage} />}
      
      <div className="relative">
        {!multiple && stringValue ? (
          <SinglePreview url={stringValue} disabled={disabled} onRemove={() => handleRemoveImage()} isUploading={isUploading} uploadProgress={uploadProgress} aspectRatioClass={aspectRatioClass} maxWidth={maxWidth} maxHeight={maxHeight} />
        ) : (
          <UploadArea 
            isDragging={isDragging} isUploading={isUploading} uploadProgress={uploadProgress} 
            placeholder={placeholder} disabled={disabled} multiple={multiple} accept={accept}
            onFileSelect={(e) => {
              const files = e.target.files;
              if (files?.length) {
                if (multiple) {
                  const rem = maxFiles - images.length;
                  Array.from(files).slice(0, rem).forEach(handleFileUpload);
                } else handleFileUpload(files[0]);
              }
              e.target.value = '';
            }}
            onCameraCapture={() => cameraInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); !disabled && setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            aspectRatioClass={aspectRatioClass} fileInputRef={fileInputRef} cameraInputRef={cameraInputRef} uploadId={uploadId}
          />
        )}
      </div>

      {showUrlInput && !disabled && (
        <UrlInput 
          urlInput={urlInput} setUrlInput={setUrlInput} showUrlField={showUrlField} setShowUrlField={setShowUrlField} 
          disabled={disabled} onCancel={() => { setShowUrlField(false); setUrlInput(stringValue); }}
          onSubmit={() => {
            if (urlInput.trim()) {
              onChange(urlInput.trim());
              setShowUrlField(false);
              showSuccess('URL Updated', 'Image URL has been updated');
            }
          }}
        />
      )}

      {helperText && images.length === 0 && !stringValue && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};
