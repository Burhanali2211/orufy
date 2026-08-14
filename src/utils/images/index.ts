/**
 * Unified Image Utilities Module
 *
 * Consolidated from:
 * - imageUrlUtils.ts (URL validation/normalization)
 * - imageUtils.ts (React fallback generation)
 * - productImageUtils.ts (Product image handling)
 */

import React from 'react';

// ==================== URL VALIDATION & NORMALIZATION ====================

/**
 * Normalizes an image URL to ensure it's properly formatted and accessible
 *
 * @param url - The image URL to normalize (can be base64, http/https, relative path, or invalid)
 * @param fallback - Optional fallback URL if the provided URL is invalid
 * @returns A valid, normalized image URL or the fallback
 */
export function normalizeImageUrl(url: string | null | undefined, fallback?: string): string {
  // Handle null/undefined/empty
  if (!url || typeof url !== 'string') {
    return fallback || '';
  }

  const trimmed = url.trim();

  // Handle empty string or invalid values
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN') {
    return fallback || '';
  }

  // Reject old Express backend upload paths - use fallback instead
  if (trimmed.includes('/uploads/')) {
    return fallback || '';
  }

  // Reject localhost URLs in production
  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
    return fallback || '';
  }

  // Base64 data URLs - return as-is (already valid)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Blob URLs - return as-is (temporary but valid)
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Full HTTP/HTTPS URLs - return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Relative paths starting with / - ensure they're properly formatted
  if (trimmed.startsWith('/')) {
    // Remove any hardcoded src/assets paths that won't work in production
    if (trimmed.includes('/src/assets/')) {
      // Try to convert to public path
      const publicPath = trimmed.replace('/src/assets/images/', '/').replace('/src/assets/', '/');
      return publicPath;
    }
    return trimmed;
  }

  // Invalid relative paths (without leading /) - try to fix
  // If it looks like a file path, make it relative to public
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    // Might be a filename - try as public path
    return `/${trimmed}`;
  }

  // If we get here, the URL is likely invalid
  return fallback || '';
}

/**
 * Validates if a URL is a valid image URL
 *
 * @param url - The URL to validate
 * @returns true if the URL appears to be a valid image URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();

  // Check for invalid values
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN') {
    return false;
  }

  // Reject old Express backend upload paths that don't exist in static deployment
  if (trimmed.includes('/uploads/')) {
    return false;
  }

  // Reject localhost URLs in production
  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
    return false;
  }

  // Valid formats
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  );
}

/**
 * Gets a safe image URL with fallback handling
 *
 * @param url - The primary image URL
 * @param fallbacks - Array of fallback URLs to try
 * @returns The first valid URL found, or empty string
 */
export function getSafeImageUrl(
  url: string | null | undefined,
  ...fallbacks: (string | null | undefined)[]
): string {
  // Try primary URL first
  const normalized = normalizeImageUrl(url);
  if (normalized && isValidImageUrl(normalized)) {
    return normalized;
  }

  // Try fallbacks
  for (const fallback of fallbacks) {
    const normalizedFallback = normalizeImageUrl(fallback);
    if (normalizedFallback && isValidImageUrl(normalizedFallback)) {
      return normalizedFallback;
    }
  }

  return '';
}

/**
 * Normalizes an array of image URLs, filtering out invalid ones
 *
 * @param urls - Array of image URLs
 * @returns Array of normalized, valid image URLs
 */
export function normalizeImageUrls(urls: (string | null | undefined)[]): string[] {
  return urls
    .map(url => normalizeImageUrl(url))
    .filter(url => url !== '' && isValidImageUrl(url));
}

/**
 * Gets the first valid image from an array
 *
 * @param urls - Array of image URLs
 * @param fallback - Optional fallback URL
 * @returns The first valid image URL or fallback
 */
export function getFirstValidImage(
  urls: (string | null | undefined)[],
  fallback?: string
): string {
  const normalized = normalizeImageUrls(urls);
  if (normalized.length > 0) {
    return normalized[0];
  }
  return fallback || '';
}

// ==================== FALLBACK IMAGE GENERATION ====================

interface ImageFallbackProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Generates a product fallback image with a letter based on the product name
 *
 * @param name - Product name to derive the letter from
 * @param size - Size of the fallback image (small: 100x100, medium: 200x200, large: 400x400)
 * @returns Base64-encoded SVG data URL for the fallback image
 */
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
export const GENERIC_FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKIC';

/**
 * Gets product image source with fallback generation
 *
 * @param product - Product object with name and images array
 * @param size - Size of fallback image if needed
 * @returns Valid image URL or generated fallback
 */
export const getProductImageSrcFromUtils = (product: { name: string; images?: string[] }, size: 'small' | 'medium' | 'large' = 'medium') => {
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

// ==================== PRODUCT IMAGE HANDLING ====================

/**
 * Utility function to get safe product image source with fallback
 */
export const getProductImageSrc = (product: { name?: string; images?: string[] }, fallbackLetter?: string) => {
  // Try to get the first valid image
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const imageUrl = product.images[0];
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      return imageUrl;
    }
  }

  // Generate fallback image with first letter of product name
  const name = product.name || 'Product';
  const firstLetter = (fallbackLetter || name.charAt(0) || 'P').toUpperCase();

  // Color palette for consistent styling
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

  // Use ASCII value to determine color consistently
  const colorIndex = firstLetter.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];

  // Generate SVG
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color.bg}"/>
    <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif"
          font-size="120" font-weight="600"
          fill="${color.text}" text-anchor="middle"
          dominant-baseline="central">${firstLetter}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Error handler for image loading failures
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, fallbackSrc: string) => {
  const img = e.target as HTMLImageElement;
  if (img.src !== fallbackSrc) {
    img.src = fallbackSrc;
  }
};

// Default exports for backward compatibility
export default {
  normalizeImageUrl,
  isValidImageUrl,
  getSafeImageUrl,
  normalizeImageUrls,
  getFirstValidImage,
  generateProductFallbackImage,
  getProductImageSrc,
  handleImageError,
  GENERIC_FALLBACK_IMAGE,
};
