export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number; // paise
}

export interface DashboardOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number; // paise
  status: OrderStatus;
  shippingAddress: string;
  createdAt: string;
}

export interface DashboardProduct {
  id: string;
  name: string;
  description?: string;
  price: number; // paise
  comparePrice?: number; // paise
  stock: number;
  category?: string;
  sku?: string;
  isActive: boolean;
  images: string[];
  createdAt: string;
}

export interface AnalyticsSummary {
  summary: {
    totalOrders: number;
    totalRevenue: number; // paise
    totalProducts: number;
    lowStockCount: number;
  };
  recentOrders: DashboardOrder[];
}
