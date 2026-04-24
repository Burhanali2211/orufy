import React from 'react';

interface ImageFallbackProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
}

export const generateProductFallbackImage = (name: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  const firstLetter = name.charAt(0).toUpperCase();
  const colors = [
    { bg: '#E3F2FD', text: '#1976D2' }, // Blue
    { bg: '#F3E5F5', text: '#7B1FA2' }, // Purple
    { bg: '#E8F5E8', text: '#388E3C' }, // Green
    { bg: '#FFF3E0', text: '#F57C00' }, // Orange
    { bg: '#FCE4EC', text: '#C2185B' }, // Pink
    { bg: '#E0F2F1', text: '#00796B' }, // Teal
    { bg: '#FFF8E1', text: '#F9A825' }, // Amber
    { bg: '#EFEBE9', text: '#5D4037' }, // Brown
  ];
  
  // Use first letter to determine color
  const colorIndex = firstLetter.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];
  
  // Size configurations
  const sizeConfig = {
    small: { width: 100, height: 100, fontSize: 32 },
    medium: { width: 200, height: 200, fontSize: 64 },
    large: { width: 400, height: 400, fontSize: 128 }
  };
  
  const config = sizeConfig[size];
  
  const svg = `
    <svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color.bg}"/>
      <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" 
            font-size="${config.fontSize}" font-weight="600" 
            fill="${color.text}" text-anchor="middle" 
            dominant-baseline="central">${firstLetter}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Generic fallback image for when product name is not available
export const GENERIC_FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjY0IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Pz88L3RleHQ+Cjwvc3ZnPg==';

export const getProductImageSrc = (product: { name: string; images?: string[] }, size: 'small' | 'medium' | 'large' = 'medium') => {
  // Check if product has valid images
  if (product.images && product.images.length > 0) {
    const imageUrl = product.images[0];
    if (imageUrl && imageUrl.trim() !== '') {
      return imageUrl;
    }
  }
  
  // Use product name for fallback if available
  if (product.name && product.name.trim() !== '') {
    return generateProductFallbackImage(product.name, size);
  }
  
  // Final fallback
  return GENERIC_FALLBACK_IMAGE;
};

export default { generateProductFallbackImage, getProductImageSrc, GENERIC_FALLBACK_IMAGE };