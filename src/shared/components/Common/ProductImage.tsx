import React, { useState } from 'react';
import { normalizeImageUrl, isValidImageUrl } from '../../utils/imageUrlUtils';

interface ProductImageProps {
  product: {
    name: string;
    images?: string[];
    id?: string;
  };
  className?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  priority?: 'normal' | 'critical' | 'low';
  onError?: () => void;
  onLoad?: () => void;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  product,
  className = '',
  alt,
  size = 'medium',
  priority = 'normal',
  onError,
  onLoad
}) => {
  const [imageError, setImageError] = useState(false);

  const getImageUrl = (): string | null => {
    if (product.images && product.images.length > 0) {
      const normalized = product.images
        .map((img) => normalizeImageUrl(img))
        .filter((img) => img !== '' && isValidImageUrl(img));

      if (normalized.length > 0) {
        return normalized[0];
      }
    }
    return null;
  };

  const generateFallbackImage = (name: string) => {
    const firstLetter = (name || 'P').charAt(0).toUpperCase();
    const colors = [
      { bg: '#f5f5f4', text: '#1c1917' },
      { bg: '#f4f4f5', text: '#27272a' },
      { bg: '#f0fdf4', text: '#064e3b' },
      { bg: '#f8fafc', text: '#0f172a' },
    ];
    const index = Math.abs(firstLetter.charCodeAt(0)) % colors.length;
    const color = colors[index];

    const sizeConfig = {
      small: { width: 100, height: 100, fontSize: 36 },
      medium: { width: 200, height: 200, fontSize: 64 },
      large: { width: 400, height: 400, fontSize: 120 }
    };
    const config = sizeConfig[size] || sizeConfig.medium;

    const svg = `
      <svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color.bg}"/>
        <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" 
              font-size="${config.fontSize}" font-weight="700" 
              fill="${color.text}" text-anchor="middle" 
              dominant-baseline="central">${firstLetter}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const imageUrl = getImageUrl();
  const finalSrc = !imageUrl || imageError ? generateFallbackImage(product.name) : imageUrl;

  return (
    <img
      src={finalSrc}
      alt={alt || product.name}
      className={className}
      onError={() => {
        if (!imageError) {
          setImageError(true);
          onError?.();
        }
      }}
      onLoad={() => onLoad?.()}
      loading={priority === 'critical' ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
};

export default ProductImage;