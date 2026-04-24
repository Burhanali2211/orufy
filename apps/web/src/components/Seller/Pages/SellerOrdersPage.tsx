import React, { useEffect, useState } from 'react';
import { 
  Package, Clock, Truck, CheckCircle, XCircle, Eye, 
  Search, Calendar, Download, ArrowUpRight, RefreshCw
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
  tracking_number?: string;
}

export const SellerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: any[] }>('/seller/orders');
      if (response.success) {
        const orderData = response.data || [];
        setOrders(orderData);
        // Calculate stats
        setStats({
          pending: orderData.filter((o: Order) => o.status === 'pending').length,
          processing: orderData.filter((o: Order) => o.status === 'processing').length,
          shipped: orderData.filter((o: Order) => o.status === 'shipped').length,
          delivered: orderData.filter((o: Order) => o.status === 'delivered').length,
          cancelled: orderData.filter((o: Order) => o.status === 'cancelled').length
        });
      }
    } catch (error: any) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setDetailsLoading(true);
      const response = await apiClient.get<{ success: boolean; data: any }>(`/seller/orders/${orderId}`);
      if (response.success) {
        setSelectedOrder(response.data);
      }
    } catch (error: any) {
      showError('Error', 'Failed to load order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/seller/orders/${orderId}/status`, { status: newStatus });
      showSuccess('Success', 'Order status updated');
      fetchOrders();
      if (selectedOrder) {
        fetchOrderDetails(orderId);
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'processing': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Order Details Modal
  if (selectedOrder) {
    return (
      <SellerDashboardLayout title={`Order #${selectedOrder.order_number}`} subtitle="Order details">
        <div className="space-y-6">
          <button
            onClick={() => setSelectedOrder(null)}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
          >
            ← Back to Orders
          </button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Order Summary</h3>
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="capitalize">{selectedOrder.status}</span>
                  </span>
                </div>
                
                <div className="space-y-4">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                        {item.product_snapshot?.images?.[0] ? (
                          <img src={item.product_snapshot.images[0]} alt={item.product_snapshot.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="w-8 h-8 text-white/30" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.product_snapshot?.name || 'Product'}</p>
                        <p className="text-white/50 text-sm">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-cyan-400 font-semibold">₹{Number(item.total_price).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>₹{Number(selectedOrder.subtotal).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>₹{Number(selectedOrder.shipping_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-white font-semibold text-lg pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span className="text-cyan-400">₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Update Status */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Update Status</h3>
                <div className="flex flex-wrap gap-3">
                  {['pending', 'processing', 'shipped', 'delivered'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status}
                      className={`px-4 py-2 rounded-lg capitalize font-medium transition-all ${
                        selectedOrder.status === status
                          ? 'bg-cyan-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Customer</h3>
                <div className="space-y-3">
                  <p className="text-white font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-white/60 text-sm">{selectedOrder.customer_email}</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Shipping Address</h3>
                {selectedOrder.shipping_address ? (
                  <div className="text-white/70 text-sm space-y-1">
                    <p>{selectedOrder.shipping_address.full_name}</p>
                    <p>{selectedOrder.shipping_address.street_address}</p>
                    <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                    <p>{selectedOrder.shipping_address.postal_code}</p>
                    <p>{selectedOrder.shipping_address.phone}</p>
                  </div>
                ) : (
                  <p className="text-white/50">No shipping address</p>
                )}
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Order Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Order Date</span>
                    <span className="text-white">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Payment Method</span>
                    <span className="text-white capitalize">{selectedOrder.payment_method || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Payment Status</span>
                    <span className={`capitalize ${selectedOrder.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {selectedOrder.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout title="Orders" subtitle="Manage customer orders">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'orange', status: 'pending' },
            { label: 'Processing', value: stats.processing, icon: Package, color: 'amber', status: 'processing' },
            { label: 'Shipped', value: stats.shipped, icon: Truck, color: 'blue', status: 'shipped' },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'emerald', status: 'delivered' },
            { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'red', status: 'cancelled' }
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => setStatusFilter(statusFilter === stat.status ? '' : stat.status)}
              className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-all text-left ${
                statusFilter === stat.status
                  ? `border-${stat.color}-500/50 bg-${stat.color}-500/10`
                  : 'border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.color === 'orange' ? 'bg-orange-500/20' :
                  stat.color === 'amber' ? 'bg-amber-500/20' :
                  stat.color === 'blue' ? 'bg-blue-500/20' :
                  stat.color === 'emerald' ? 'bg-emerald-500/20' :
                  'bg-red-500/20'
                }`}>
                  <stat.icon className={`w-5 h-5 ${
                    stat.color === 'orange' ? 'text-orange-400' :
                    stat.color === 'amber' ? 'text-amber-400' :
                    stat.color === 'blue' ? 'text-blue-400' :
                    stat.color === 'emerald' ? 'text-emerald-400' :
                    'text-red-400'
                  }`} />
                </div>
                <div>
                  <p className="text-white/60 text-sm">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search by order number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Orders Found</h3>
              <p className="text-white/60">
                {statusFilter ? `No ${statusFilter} orders at the moment.` : 'You haven\'t received any orders yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 md:p-5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-white/10">
                        <Package className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">#{order.order_number}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </span>
                        </div>
                        <p className="text-sm text-white/60 mt-1">
                          {order.customer_name || order.customer_email}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-white/50">{order.items_count || 1} items</p>
                      </div>
                      <button 
                        onClick={() => fetchOrderDetails(order.id)}
                        className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SellerDashboardLayout>
  );
};

export default SellerOrdersPage;
