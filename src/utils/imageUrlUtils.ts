/**
 * Image URL Utilities
 * 
 * Provides functions to normalize, validate, and format image URLs
 * to ensure consistent image display across the application.
 */

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

