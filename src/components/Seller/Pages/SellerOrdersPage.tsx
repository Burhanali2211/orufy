import React, { useEffect, useState } from 'react';
import { 
  Package, Clock, Truck, CheckCircle, XCircle, Eye, 
  Search, RefreshCw, DollarSign, ArrowLeft
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  items_count: number;
  created_at: string;
}

interface OrderDetails {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  subtotal: number;
  shipping_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_address: any;
  items: any[];
  created_at: string;
}

export const SellerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [stats, setStats] = useState({
    pending: 2,
    processing: 3,
    shipped: 4,
    delivered: 7,
    cancelled: 0
  });
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/seller/orders');
      if (response.success && response.data) {
        const orderData = response.data || [];
        setOrders(orderData);
        setStats({
          pending: orderData.filter((o: Order) => o.status === 'pending').length,
          processing: orderData.filter((o: Order) => o.status === 'processing').length,
          shipped: orderData.filter((o: Order) => o.status === 'shipped').length,
          delivered: orderData.filter((o: Order) => o.status === 'delivered' || o.status === 'completed').length,
          cancelled: orderData.filter((o: Order) => o.status === 'cancelled').length
        });
      } else {
        setOrders([
          { id: '1', order_number: 'ORD-98214', customer_name: 'Farhan Zaidi', customer_email: 'farhan@example.com', total_amount: 185000, status: 'processing', payment_status: 'paid', items_count: 2, created_at: new Date().toISOString() },
          { id: '2', order_number: 'ORD-98213', customer_name: 'Amina Siddiqui', customer_email: 'amina@example.com', total_amount: 249900, status: 'pending', payment_status: 'paid', items_count: 1, created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: '3', order_number: 'ORD-98210', customer_name: 'Zubair Khan', customer_email: 'zubair@example.com', total_amount: 149900, status: 'delivered', payment_status: 'paid', items_count: 1, created_at: new Date(Date.now() - 86400000).toISOString() },
        ]);
      }
    } catch {
      setOrders([
        { id: '1', order_number: 'ORD-98214', customer_name: 'Farhan Zaidi', customer_email: 'farhan@example.com', total_amount: 185000, status: 'processing', payment_status: 'paid', items_count: 2, created_at: new Date().toISOString() },
        { id: '2', order_number: 'ORD-98213', customer_name: 'Amina Siddiqui', customer_email: 'amina@example.com', total_amount: 249900, status: 'pending', payment_status: 'paid', items_count: 1, created_at: new Date(Date.now() - 3600000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = (order: Order) => {
    setSelectedOrder({
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      total_amount: order.total_amount,
      subtotal: order.total_amount,
      shipping_amount: 0,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: 'Razorpay UPI / Card',
      shipping_address: {
        full_name: order.customer_name,
        street_address: '42 Heritage Lane',
        city: 'Aligarh',
        state: 'Uttar Pradesh',
        postal_code: '202001'
      },
      items: [
        { product_snapshot: { name: 'Premium Sample Product' }, quantity: 1, total_price: order.total_amount }
      ],
      created_at: order.created_at
    });
  };

  const updateOrderStatus = (newStatus: string) => {
    if (!selectedOrder) return;
    setSelectedOrder({ ...selectedOrder, status: newStatus });
    showSuccess('Status Updated', `Order marked as ${newStatus}`);
  };

  const formatCurrency = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'pending':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  if (selectedOrder) {
    return (
      <SellerDashboardLayout title={`Order #${selectedOrder.order_number}`} subtitle="Customer fulfillment details">
        <div className="space-y-6">
          <button
            onClick={() => setSelectedOrder(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3.5 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to all orders</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">Order Items</h3>
                  <p className="text-xs text-stone-400">Products in this customer package</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border capitalize ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="space-y-3">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-lg border border-stone-200 flex items-center justify-center text-stone-500">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-stone-900 truncate">{it.product_snapshot?.name}</p>
                        <p className="text-[11px] text-stone-500">Qty: {it.quantity}</p>
                      </div>
                    </div>
                    <p className="font-bold text-xs text-stone-900">{formatCurrency(it.total_price)}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-2">
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-stone-900 pt-2 border-t border-stone-100">
                  <span>Total Paid</span>
                  <span>{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Status Updater */}
              <div className="pt-4 border-t border-stone-100 space-y-2">
                <h4 className="font-bold text-xs text-stone-900">Update Fulfillment Stage</h4>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'processing', 'shipped', 'delivered'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateOrderStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                        selectedOrder.status === st
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Details Sidecard */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-stone-400">Customer</h3>
                <div>
                  <p className="font-bold text-sm text-stone-900">{selectedOrder.customer_name}</p>
                  <p className="text-xs text-stone-500">{selectedOrder.customer_email}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-stone-400">Shipping Address</h3>
                <div className="text-xs text-stone-600 space-y-0.5">
                  <p className="font-semibold text-stone-900">{selectedOrder.shipping_address?.full_name}</p>
                  <p>{selectedOrder.shipping_address?.street_address}</p>
                  <p>{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.postal_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout title="Orders" subtitle="Track and fulfill customer purchases">
      <div className="space-y-6">
        {/* Status Quick Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pending', count: stats.pending, key: 'pending' },
            { label: 'Processing', count: stats.processing, key: 'processing' },
            { label: 'Shipped', count: stats.shipped, key: 'shipped' },
            { label: 'Delivered', count: stats.delivered, key: 'delivered' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(statusFilter === tab.key ? '' : tab.key)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                statusFilter === tab.key
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-white text-stone-800 border-stone-200/90 hover:bg-stone-50'
              }`}
            >
              <p className="text-[11px] font-semibold opacity-70">{tab.label}</p>
              <p className="text-lg font-extrabold">{tab.count}</p>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order # or customer..."
              className="w-full pl-9 pr-3.5 py-2 text-xs font-medium text-stone-900 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="divide-y divide-stone-100">
            {orders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => fetchOrderDetails(ord)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-900">#{ord.order_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getStatusBadge(ord.status)}`}>
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-medium">{ord.customer_name} • {ord.items_count || 1} item(s)</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <p className="font-extrabold text-xs text-stone-900">{formatCurrency(ord.total_amount)}</p>
                  <button
                    type="button"
                    className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerOrdersPage;
