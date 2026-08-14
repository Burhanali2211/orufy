// UUID validation and cleanup utilities

/**
 * Validates if a string is a valid UUID v4 format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Generates a valid UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Converts invalid UUIDs to valid ones
 */
export const convertLegacyUUID = (id: string): string => {
  if (isValidUUID(id)) {
    return id;
  }

  // If it's not a valid UUID, generate a new one
  return generateUUID();
};

/**
 * Validates and fixes user ID in localStorage
 */
export const validateAndFixStoredUser = (): void => {
  try {
    const storedUser = localStorage.getItem('direct_login_current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.id && !isValidUUID(user.id)) {
        const fixedId = convertLegacyUUID(user.id);
        user.id = fixedId;
        localStorage.setItem('direct_login_current_user', JSON.stringify(user));
      }
    }
  } catch (error) {
    console.error('Error validating stored user:', error);
    // Clear invalid data
    localStorage.removeItem('direct_login_current_user');
  }
};

/**
 * Validates and fixes seller ID for product creation
 */
export const validateSellerId = (sellerId: string | undefined): string => {
  if (!sellerId) {
    throw new Error('Seller ID is required');
  }

  if (isValidUUID(sellerId)) {
    return sellerId;
  }

  // Convert invalid ID to valid one
  return convertLegacyUUID(sellerId);
};

/**
 * Cleans up all localStorage entries with invalid UUIDs
 */
export const cleanupInvalidUUIDs = (): void => {
  const keysToCheck = [
    'direct_login_current_user',
    'user_preferences',
    'cart_items',
    'wishlist_items'
  ];
  
  keysToCheck.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        let needsUpdate = false;
        
        // Check for user ID fields
        if (parsed.id && !isValidUUID(parsed.id)) {
          parsed.id = convertLegacyUUID(parsed.id);
          needsUpdate = true;
        }
        
        if (parsed.user_id && !isValidUUID(parsed.user_id)) {
          parsed.user_id = convertLegacyUUID(parsed.user_id);
          needsUpdate = true;
        }
        
        if (parsed.seller_id && !isValidUUID(parsed.seller_id)) {
          parsed.seller_id = convertLegacyUUID(parsed.seller_id);
          needsUpdate = true;
        }
        
        // Check arrays of objects
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.id && !isValidUUID(item.id)) {
              item.id = convertLegacyUUID(item.id);
              needsUpdate = true;
            }
            if (item.user_id && !isValidUUID(item.user_id)) {
              item.user_id = convertLegacyUUID(item.user_id);
              needsUpdate = true;
            }
            if (item.seller_id && !isValidUUID(item.seller_id)) {
              item.seller_id = convertLegacyUUID(item.seller_id);
              needsUpdate = true;
            }
          });
        }
        
        if (needsUpdate) {
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error(`Error cleaning up localStorage key ${key}:`, error);
      localStorage.removeItem(key);
    }
  });
};

// Auto-cleanup on module load
if (typeof window !== 'undefined') {
  cleanupInvalidUUIDs();
}
