/**
 * Data Transformation Utilities
 * Converts snake_case keys from backend API responses to camelCase for frontend
 */

/**
 * Convert a snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert a camelCase string to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively transform all keys in an object from snake_case to camelCase
 */
export function transformKeysToCamel<T>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeysToCamel(item)) as T;
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const transformed: Record<string, unknown> = {};
    const record = obj as Record<string, unknown>;
    
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        const camelKey = snakeToCamel(key);
        transformed[camelKey] = transformKeysToCamel(record[key]);
      }
    }
    
    return transformed as T;
  }

  return obj;
}

/**
 * Recursively transform all keys in an object from camelCase to snake_case
 */
export function transformKeysToSnake<T>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeysToSnake(item)) as T;
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const transformed: Record<string, unknown> = {};
    const record = obj as Record<string, unknown>;
    
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        const snakeKey = camelToSnake(key);
        transformed[snakeKey] = transformKeysToSnake(record[key]);
      }
    }
    
    return transformed as T;
  }

  return obj;
}

/**
 * Transform a product from API response format to frontend format
 * Handles special cases like 'is_featured' -> 'featured'
 */
export function transformProduct(product: unknown): Record<string, unknown> | null | undefined {
  if (!product) return product as null | undefined;
  
  const transformed = transformKeysToCamel<Record<string, unknown>>(product);
  
  // Handle special field mappings
  if ('isFeatured' in transformed) {
    transformed.featured = transformed.isFeatured;
    delete transformed.isFeatured;
  }
  
  // Ensure images is an array
  if (transformed.images && typeof transformed.images === 'string') {
    try {
      transformed.images = JSON.parse(transformed.images);
    } catch {
      transformed.images = [transformed.images];
    }
  }
  
  if (!transformed.images) {
    transformed.images = [];
  }
  
  // Ensure tags is an array
  if (transformed.tags && typeof transformed.tags === 'string') {
    try {
      transformed.tags = JSON.parse(transformed.tags);
    } catch {
      transformed.tags = [transformed.tags];
    }
  }
  
  if (!transformed.tags) {
    transformed.tags = [];
  }
  
  // Ensure reviews is an array
  if (!transformed.reviews) {
    transformed.reviews = [];
  }
  
  // Default values for required fields
  if (typeof transformed.rating !== 'number') {
    transformed.rating = Number(transformed.rating) || 0;
  }
  
  if (typeof transformed.reviewCount !== 'number') {
    transformed.reviewCount = Number(transformed.reviewCount) || 0;
  }
  
  if (typeof transformed.stock !== 'number') {
    transformed.stock = Number(transformed.stock) || 0;
  }
  
  if (typeof transformed.price !== 'number') {
    transformed.price = Number(transformed.price) || 0;
  }
  
  if (transformed.originalPrice) {
    transformed.originalPrice = Number(transformed.originalPrice);
  }
  
  // Ensure sellerName has a default value
  if (!transformed.sellerName) {
    transformed.sellerName = '';
  }
  
  return transformed;
}

/**
 * Transform an array of products
 */
export function transformProducts(products: unknown[]): (Record<string, unknown> | null | undefined)[] {
  if (!Array.isArray(products)) return [];
  return products.map(transformProduct);
}

/**
 * Transform a category from API response format to frontend format
 */
export function transformCategory(category: unknown): Record<string, unknown> | null | undefined {
  if (!category) return category as null | undefined;
  
  const transformed = transformKeysToCamel<Record<string, unknown>>(category);
  const rawCat = category as Record<string, unknown>;
  
  // Handle imageUrl field - backend sends image_url which becomes imageUrl
  // But we also want to keep image_url for backward compatibility
  if (transformed.imageUrl) {
    // Already transformed correctly
  } else if (rawCat.image_url) {
    transformed.imageUrl = rawCat.image_url;
  }
  
  // Ensure productCount is a number
  if (typeof transformed.productCount !== 'number') {
    transformed.productCount = Number(transformed.productCount) || 0;
  }
  
  return transformed;
}

/**
 * Transform an array of categories
 */
export function transformCategories(categories: unknown[]): (Record<string, unknown> | null | undefined)[] {
  if (!Array.isArray(categories)) return [];
  return categories.map(transformCategory);
}

/**
 * Transform a paginated API response
 */
export function transformPaginatedResponse<T>(
  response: Record<string, unknown> | unknown,
  itemTransformer: (item: unknown) => T
): { data: T[]; pagination: Record<string, unknown> | unknown } {
  const resp = response as Record<string, unknown>;
  return {
    data: Array.isArray(resp?.data) 
      ? resp.data.map(itemTransformer) 
      : [],
    pagination: resp?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  };
}

