import { CartItem, Order, Address } from '../types';
import { transformProduct } from '../lib/dataTransform';

export const mapDbCartItemToAppCartItem = (dbItem: any): CartItem => ({
  id: dbItem.id,
  product: transformProduct(dbItem.products),
  productId: dbItem.product_id,
  variantId: dbItem.variant_id,
  quantity: dbItem.quantity,
  unitPrice: dbItem.unit_price,
  totalPrice: dbItem.total_price,
  createdAt: new Date(dbItem.created_at),
  updatedAt: dbItem.updated_at ? new Date(dbItem.updated_at) : undefined,
});

export const mapDbOrderToAppOrder = (dbOrder: any): Order => ({
  id: dbOrder.id,
  orderNumber: dbOrder.order_number || dbOrder.id.slice(0, 8).toUpperCase(),
  userId: dbOrder.user_id,
  items: (dbOrder.order_items || []).map((item: any) => ({
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    variantId: item.variant_id,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    totalPrice: item.total_price,
    productSnapshot: item.product_snapshot,
    createdAt: new Date(item.created_at),
    product: item.products ? transformProduct(item.products) : undefined
  })),
  total: dbOrder.total_amount,
  subtotal: dbOrder.subtotal,
  taxAmount: dbOrder.tax_amount,
  shippingAmount: dbOrder.shipping_amount,
  discountAmount: dbOrder.discount_amount,
  status: dbOrder.status,
  paymentStatus: dbOrder.payment_status,
  paymentMethod: dbOrder.payment_method,
  paymentId: dbOrder.payment_id,
  currency: dbOrder.currency || 'INR',
  shippingAddress: dbOrder.shipping_address,
  billingAddress: dbOrder.billing_address,
  notes: dbOrder.notes,
  trackingNumber: dbOrder.tracking_number,
  shippedAt: dbOrder.shipped_at ? new Date(dbOrder.shipped_at) : undefined,
  deliveredAt: dbOrder.delivered_at ? new Date(dbOrder.delivered_at) : undefined,
  createdAt: new Date(dbOrder.created_at),
  updatedAt: dbOrder.updated_at ? new Date(dbOrder.updated_at) : undefined,
});

export const mapDbAddressToAppAddress = (dbAddress: any): Address => ({
  id: dbAddress.id,
  userId: dbAddress.user_id,
  fullName: dbAddress.full_name,
  streetAddress: dbAddress.street_address,
  city: dbAddress.city,
  state: dbAddress.state,
  postalCode: dbAddress.postal_code,
  country: dbAddress.country,
  phone: dbAddress.phone,
  isDefault: dbAddress.is_default,
  type: dbAddress.type,
  createdAt: new Date(dbAddress.created_at),
  updatedAt: dbAddress.updated_at ? new Date(dbAddress.updated_at) : undefined,
});
