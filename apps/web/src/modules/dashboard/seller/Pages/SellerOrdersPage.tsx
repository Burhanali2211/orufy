import React, { useEffect, useState } from 'react';
import { 
  Package, Clock, Truck, CheckCircle, XCircle, Eye, 
  Search, Calendar, Download, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { SellerDashboardLayout } from '../Layout/SellerDashboardLayout';
import { apiClient } from '@/lib/apiClient';
import { useNotification } from '@/contexts/NotificationContext';

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
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'processing': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'shipped': return <Truck className="w-3.5 h-3.5" />;
      case 'processing': return <Clock className="w-3.5 h-3.5" />;
      case 'cancelled': return <XCircle className="w-3.5 h-3.5" />;
      default: return <Package className="w-3.5 h-3.5" />;
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

  // Order Details View
  if (selectedOrder) {
    return (
      <SellerDashboardLayout title={`Order #${selectedOrder.order_number}`} subtitle="Detailed view and fulfillment">
        <div className="space-y-8">
          <button
            onClick={() => setSelectedOrder(null)}
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all"
          >
            <div className="p-2 bg-white rounded-xl border border-slate-200 group-hover:border-slate-900 transition-all">
              <XCircle className="w-4 h-4 rotate-45" />
            </div>
            Back to Orders
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/40">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900">Order Summary</h3>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-6 p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-blue-200 transition-all">
                      <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                        {item.product_snapshot?.images?.[0] ? (
                          <img src={item.product_snapshot.images[0]} alt={item.product_snapshot.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <Package className="w-8 h-8 text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-bold text-lg truncate">{item.product_snapshot?.name || 'Product'}</p>
                        <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase tracking-widest bg-slate-200/50 px-2 py-0.5 rounded-lg">Qty {item.quantity}</span>
                          <span className="text-slate-300">•</span>
                          <span>₹{Number(item.total_price / item.quantity).toLocaleString('en-IN')} each</span>
                        </p>
                      </div>
                      <p className="text-slate-900 font-black text-lg">₹{Number(item.total_price).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Subtotal</span>
                    <span className="text-slate-900">₹{Number(selectedOrder.subtotal).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Shipping Fee</span>
                    <span className="text-slate-900">₹{Number(selectedOrder.shipping_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black pt-6 border-t border-slate-100">
                    <span className="text-slate-900">Total Amount</span>
                    <span className="text-blue-600">₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Fulfillment Actions */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/40">
                <h3 className="text-xl font-black text-slate-900 mb-6">Update Fulfillment Status</h3>
                <div className="flex flex-wrap gap-3">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status}
                      className={`px-6 py-3 rounded-2xl capitalize text-sm font-black tracking-wide transition-all shadow-sm ${
                        selectedOrder.status === status
                          ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'
                          : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white hover:border-slate-900 hover:text-slate-900'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Info */}
            <div className="space-y-8">
              {/* Customer Info */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/40">
                <h3 className="text-xl font-black text-slate-900 mb-6">Customer</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg border border-blue-100">
                    {selectedOrder.customer_name?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="text-slate-900 font-black">{selectedOrder.customer_name}</p>
                    <p className="text-slate-500 text-xs font-bold">{selectedOrder.customer_email}</p>
                  </div>
                </div>
                <button className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-white hover:border-slate-900 hover:text-slate-900 transition-all">
                  Contact Customer
                </button>
              </div>

              {/* Shipping Details */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/40">
                <h3 className="text-xl font-black text-slate-900 mb-6">Shipping Address</h3>
                {selectedOrder.shipping_address ? (
                  <div className="text-slate-600 font-bold space-y-2">
                    <p className="text-slate-900">{selectedOrder.shipping_address.full_name}</p>
                    <p className="text-sm leading-relaxed">
                      {selectedOrder.shipping_address.street_address}<br />
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}<br />
                      {selectedOrder.shipping_address.postal_code}<br />
                      {selectedOrder.shipping_address.phone}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
                    <p className="text-sm text-slate-400 font-bold italic">No physical address provided</p>
                  </div>
                )}
              </div>

              {/* Order Metadata */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/40">
                <h3 className="text-xl font-black text-slate-900 mb-6">Payment Details</h3>
                <div className="space-y-4 text-sm font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Date</span>
                    <span className="text-slate-900">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Method</span>
                    <span className="text-slate-900 capitalize">{selectedOrder.payment_method || 'Razorpay'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status</span>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      selectedOrder.payment_status === 'paid' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
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
    <SellerDashboardLayout title="Orders" subtitle="Track and fulfill customer orders">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'orange', status: 'pending' },
            { label: 'Processing', value: stats.processing, icon: Package, color: 'amber', status: 'processing' },
            { label: 'Shipped', value: stats.shipped, icon: Truck, color: 'blue', status: 'shipped' },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'emerald', status: 'delivered' },
            { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'rose', status: 'cancelled' }
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => setStatusFilter(statusFilter === stat.status ? '' : stat.status)}
              className={`bg-white rounded-[2rem] p-6 border transition-all text-left shadow-sm hover:shadow-md active:scale-95 group ${
                statusFilter === stat.status
                  ? `ring-4 ring-${stat.color}-500/10 border-${stat.color}-500`
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  stat.color === 'orange' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                  stat.color === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                  stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  'bg-rose-50 text-rose-600 border border-rose-100'
                }`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by Order # or Customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                />
              </div>
              <button
                onClick={fetchOrders}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                Sync Orders
              </button>
            </div>
          </div>

          <div className="min-h-[400px]">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Syncing with Store...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                  <Package className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No Orders Found</h3>
                <p className="text-slate-500 font-bold max-w-sm mx-auto">
                  {statusFilter ? `No orders in "${statusFilter}" status at the moment.` : 'Your store is ready for customers! Orders will appear here as they arrive.'}
                </p>
                {statusFilter && (
                  <button onClick={() => setStatusFilter('')} className="mt-6 text-blue-600 font-black hover:underline">Clear Filters</button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="group p-6 md:p-8 hover:bg-slate-50 transition-all cursor-pointer"
                    onClick={() => fetchOrderDetails(order.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 transition-all shadow-sm">
                          <Package className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-xl font-black text-slate-900 tracking-tight">#{order.order_number}</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </div>
                          <p className="text-slate-500 font-bold mt-1 text-base">
                            {order.customer_name || 'Anonymous Customer'}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>{formatDate(order.created_at)}</span>
                            <span>•</span>
                            <span className="text-slate-900">{order.items_count || 1} Products</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-8">
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-900">
                            ₹{Number(order.total_amount).toLocaleString('en-IN')}
                          </p>
                          <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${order.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {order.payment_status}
                          </p>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-2xl group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-sm">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SellerDashboardLayout>
  );
};


export default SellerOrdersPage;
