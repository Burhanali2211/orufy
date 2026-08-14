export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  payment_method_details?: any;
  subtotal: string;
  tax_amount: string;
  shipping_amount: string;
  discount_amount: string;
  total_amount: string;
  shipping_address: any;
  billing_address: any;
  tracking_number: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
}

export type Order = OrderData;

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  ordersToday: number;
  revenueToday: number;
  avgOrderValue: number;
  statusBreakdown: Record<string, number>;
}
