import { z } from 'zod';

/**
 * Validation schemas for order endpoints
 */

// UUID schema
const uuidSchema = z.string().uuid('Invalid UUID format');

// Address schema
const addressSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  addressLine1: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address must not exceed 255 characters'),
  addressLine2: z.string()
    .max(255, 'Address must not exceed 255 characters')
    .optional(),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters'),
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State must not exceed 100 characters'),
  postalCode: z.string()
    .regex(/^\d{5,6}$/, 'Invalid postal code format'),
  country: z.string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must not exceed 100 characters')
    .default('India')
});

// Order item schema
const orderItemSchema = z.object({
  productId: uuidSchema,
  variantId: uuidSchema.optional(),
  quantity: z.number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(100, 'Quantity must not exceed 100'),
  price: z.number()
    .positive('Price must be positive')
    .optional()
});

// Create order schema
export const createOrderSchema = z.object({
  items: z.array(orderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(50, 'Order cannot contain more than 50 items'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['razorpay', 'cod', 'upi'])
    .default('razorpay'),
  notes: z.string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
});

// Update order status schema
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
});

// Order query params schema
export const orderQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .refine(val => val > 0, 'Page must be greater than 0')
    .optional(),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded'])
    .optional()
});

// Order ID param schema
export const orderIdSchema = z.object({
  id: uuidSchema
});

// Type exports
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type OrderIdParam = z.infer<typeof orderIdSchema>;
export type Address = z.infer<typeof addressSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;

