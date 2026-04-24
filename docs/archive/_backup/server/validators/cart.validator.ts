import { z } from 'zod';

/**
 * Validation schemas for cart endpoints
 */

// UUID schema
const uuidSchema = z.string().uuid('Invalid UUID format');

// Add to cart schema
export const addToCartSchema = z.object({
  productId: uuidSchema,
  variantId: uuidSchema.optional(),
  quantity: z.number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(100, 'Quantity must not exceed 100')
});

// Update cart item schema
export const updateCartItemSchema = z.object({
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative')
    .max(100, 'Quantity must not exceed 100')
});

// Cart item ID param schema
export const cartItemIdSchema = z.object({
  id: uuidSchema
});

// Type exports
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemIdParam = z.infer<typeof cartItemIdSchema>;

