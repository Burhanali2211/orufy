import {
  Clock,
  CheckCircle,
  Zap,
  Truck,
  Package,
  XCircle,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Wallet
} from 'lucide-react';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface StatusConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: number;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    description: 'Awaiting confirmation',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Clock,
    priority: 1
  },
  confirmed: {
    label: 'Confirmed',
    description: 'Order confirmed by customer',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: CheckCircle,
    priority: 2
  },
  processing: {
    label: 'Processing',
    description: 'Being prepared for shipment',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Zap,
    priority: 3
  },
  shipped: {
    label: 'Shipped',
    description: 'On the way to customer',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: Truck,
    priority: 4
  },
  delivered: {
    label: 'Delivered',
    description: 'Successfully delivered',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: Package,
    priority: 5
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Order was cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    priority: 0
  },
  refunded: {
    label: 'Refunded',
    description: 'Payment refunded to customer',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: RefreshCw,
    priority: 0
  }
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    description: 'Awaiting payment',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: AlertCircle,
    priority: 1
  },
  paid: {
    label: 'Paid',
    description: 'Payment received',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
    priority: 2
  },
  failed: {
    label: 'Failed',
    description: 'Payment failed',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    priority: 0
  },
  refunded: {
    label: 'Refunded',
    description: 'Payment refunded',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: RefreshCw,
    priority: 0
  }
};

export const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  'razorpay': { label: 'Razorpay', icon: CreditCard },
  'stripe': { label: 'Stripe', icon: CreditCard },
  'paypal': { label: 'PayPal', icon: CreditCard },
  'cod': { label: 'Cash on Delivery', icon: Wallet },
  'cash': { label: 'Cash on Delivery', icon: Wallet },
  'bank_transfer': { label: 'Bank Transfer', icon: CreditCard },
  'upi': { label: 'UPI', icon: CreditCard }
};

export const getOrderStatusConfig = (status: string): StatusConfig => {
  return ORDER_STATUS_CONFIG[status as OrderStatus] || ORDER_STATUS_CONFIG.pending;
};

export const getPaymentStatusConfig = (status: string): StatusConfig => {
  return PAYMENT_STATUS_CONFIG[status as PaymentStatus] || PAYMENT_STATUS_CONFIG.pending;
};

export const getPaymentMethodConfig = (method: string) => {
  const normalizedMethod = method?.toLowerCase() || 'cod';
  
  for (const [key, config] of Object.entries(PAYMENT_METHOD_CONFIG)) {
    if (normalizedMethod.includes(key)) {
      return config;
    }
  }
  
  return PAYMENT_METHOD_CONFIG.cod;
};

export const getStatusBadgeClasses = (status: string, isPayment: boolean = false): string => {
  const config = isPayment ? getPaymentStatusConfig(status) : getOrderStatusConfig(status);
  return `${config.bgColor} ${config.color}`;
};

// Light-theme badge classes for admin dashboard
const ORDER_STATUS_LIGHT: Record<string, string> = {
  delivered:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  shipped:    'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  pending:    'bg-orange-50 text-orange-700 border-orange-200',
  cancelled:  'bg-red-50 text-red-700 border-red-200',
  refunded:   'bg-gray-100 text-gray-600 border-gray-200',
};

const PAYMENT_STATUS_LIGHT: Record<string, string> = {
  paid:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:  'bg-orange-50 text-orange-700 border-orange-200',
  failed:   'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const getAdminStatusClasses = (status: string, isPayment = false): string => {
  const map = isPayment ? PAYMENT_STATUS_LIGHT : ORDER_STATUS_LIGHT;
  return map[status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
};

export const formatOrderNumber = (id: string, orderNumber?: string): string => {
  if (orderNumber) return orderNumber;
  // Fallback: create a readable order number from UUID
  return `ORD-${id.substring(0, 8).toUpperCase()}`;
};

export const getStatusProgressPercentage = (status: OrderStatus): number => {
  const config = ORDER_STATUS_CONFIG[status];
  return (config.priority / 5) * 100;
};

export const getNextPossibleStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: ['refunded'],
    refunded: []
  };
  
  return transitions[currentStatus] || [];
};

