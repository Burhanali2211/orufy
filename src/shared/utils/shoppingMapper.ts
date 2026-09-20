import { CartItem, Order, Address } from '../types';
import { transformProduct } from '../lib/dataTransform';

interface DbCartItem {
  id: string;
  products?: unknown;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string | Date;
  updated_at?: string | Date;
}

export const mapDbCartItemToAppCartItem = (dbItem: DbCartItem | Record<string, unknown>): CartItem => {
  const item = dbItem as DbCartItem;
  return {
    id: item.id,
    product: transformProduct(item.products),
    productId: item.product_id,
    variantId: item.variant_id,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    totalPrice: item.total_price,
    createdAt: new Date(item.created_at),
    updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
  };
};

interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot?: unknown;
  created_at: string | Date;
  products?: unknown;
}

interface DbOrder {
  id: string;
  order_number?: string;
  user_id: string;
  order_items?: DbOrderItem[];
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  payment_id?: string;
  currency?: string;
  shipping_address?: unknown;
  billing_address?: unknown;
  notes?: string;
  tracking_number?: string;
  shipped_at?: string | Date;
  delivered_at?: string | Date;
  created_at: string | Date;
  updated_at?: string | Date;
}

export const mapDbOrderToAppOrder = (dbOrder: DbOrder | Record<string, unknown>): Order => {
  const order = dbOrder as DbOrder;
  return {
    id: order.id,
    orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
    userId: order.user_id,
    items: (order.order_items || []).map((item: DbOrderItem) => ({
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
    total: order.total_amount,
    subtotal: order.subtotal,
    taxAmount: order.tax_amount,
    shippingAmount: order.shipping_amount,
    discountAmount: order.discount_amount,
    status: order.status as Order['status'],
    paymentStatus: order.payment_status as Order['paymentStatus'],
    paymentMethod: order.payment_method,
    paymentId: order.payment_id,
    currency: order.currency || 'INR',
    shippingAddress: order.shipping_address as Address,
    billingAddress: order.billing_address as Address,
    notes: order.notes,
    trackingNumber: order.tracking_number,
    shippedAt: order.shipped_at ? new Date(order.shipped_at) : undefined,
    deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
    createdAt: new Date(order.created_at),
    updatedAt: order.updated_at ? new Date(order.updated_at) : undefined,
  };
};

interface DbAddress {
  id: string;
  user_id: string;
  full_name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  type: string;
  created_at: string | Date;
  updated_at?: string | Date;
}

export const mapDbAddressToAppAddress = (dbAddress: DbAddress | Record<string, unknown>): Address => {
  const addr = dbAddress as DbAddress;
  return {
    id: addr.id,
    userId: addr.user_id,
    fullName: addr.full_name,
    streetAddress: addr.street_address,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postal_code,
    country: addr.country,
    phone: addr.phone,
    isDefault: addr.is_default,
    type: addr.type as 'billing' | 'shipping',
    createdAt: new Date(addr.created_at),
    updatedAt: addr.updated_at ? new Date(addr.updated_at) : undefined,
  };
};
