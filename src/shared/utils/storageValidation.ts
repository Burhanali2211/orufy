/**
 * Storage Validation
 * Safe wrapper around localStorage with validation and type safety
 */

interface StorageSchema {
  'auth_session': string;
  'cart_items': string;
  'wishlist_items': string;
  'user_preferences': string;
  'app_version': string;
}

const VALID_KEYS = new Set<keyof StorageSchema>([
  'auth_session',
  'cart_items',
  'wishlist_items',
  'user_preferences',
  'app_version',
]);

const MAX_SIZES: Record<keyof StorageSchema, number> = {
  'auth_session': 2000,      // JWT token
  'cart_items': 5000,        // Cart data
  'wishlist_items': 5000,    // Wishlist data
  'user_preferences': 1000,  // Settings
  'app_version': 100,        // Version string
};

export class SafeStorage {
  static get<K extends keyof StorageSchema>(key: K): StorageSchema[K] | null {
    try {
      if (!VALID_KEYS.has(key)) {
        console.warn(`[STORAGE] Invalid key: ${key}`);
        return null;
      }

      const value = localStorage.getItem(key);
      if (!value) return null;

      // Validate size
      if (value.length > MAX_SIZES[key]) {
        console.warn(`[STORAGE] Value too large for ${key}: ${value.length} > ${MAX_SIZES[key]}`);
        this.remove(key);
        return null;
      }

      // Validate JSON if expected to be JSON
      if (key.includes('items') || key.includes('preferences')) {
        try {
          JSON.parse(value);
        } catch {
          console.warn(`[STORAGE] Invalid JSON in ${key}`);
          this.remove(key);
          return null;
        }
      }

      return value as StorageSchema[K];
    } catch (error) {
      console.error(`[STORAGE] Error reading ${key}:`, error);
      return null;
    }
  }

  static set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): boolean {
    try {
      if (!VALID_KEYS.has(key)) {
        console.warn(`[STORAGE] Invalid key: ${key}`);
        return false;
      }

      // Validate size before setting
      if (value.length > MAX_SIZES[key]) {
        console.warn(`[STORAGE] Value too large for ${key}: ${value.length} > ${MAX_SIZES[key]}`);
        return false;
      }

      // Validate JSON if expected to be JSON
      if (key.includes('items') || key.includes('preferences')) {
        try {
          JSON.parse(value);
        } catch {
          console.warn(`[STORAGE] Invalid JSON in ${key}`);
          return false;
        }
      }

      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`[STORAGE] Error writing ${key}:`, error);
      return false;
    }
  }

  static remove<K extends keyof StorageSchema>(key: K): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[STORAGE] Error removing ${key}:`, error);
    }
  }

  static clear(): void {
    try {
      // Only clear our app's keys
      Array.from(VALID_KEYS).forEach((key) => {
        localStorage.removeItem(key as string);
      });
    } catch (error) {
      console.error('[STORAGE] Error clearing storage:', error);
    }
  }
}
