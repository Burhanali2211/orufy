import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Truck, CheckCircle2, Clock, XCircle,
  Search, ShoppingBag, AlertCircle, RefreshCw,
  ExternalLink, ChevronRight, X, Printer, MapPin,
  Phone, Mail, Copy, Check, Sparkles
} from 'lucide-react';
import { CustomerDashboardLayout } from './CustomerDashboardLayout';
import { useCustomerOrders } from '@/shared/hooks/customer/useCustomerOrders';
import { generateInvoicePrintWindow } from '@/shared/utils/invoiceGenerator';
import { normalizeImageUrl } from '@/shared/utils/imageUrlUtils';

const fmt = (n: number | string) => {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const FILTERS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const OrdersPage: React.FC = () => {
  const { data: orders, isLoading: loading, error, refetch: fetchOrders } = useCustomerOrders();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const orderList: any[] = orders || [];

  const filteredOrders = orderList.filter((o: any) => {
    const status = (o.status || '').toLowerCase();
    const matchStatus = activeFilter === 'all' || status === activeFilter;
    const orderNum = (o.order_number || o.orderNumber || o.id || '').toLowerCase();
    const matchSearch =
      searchQuery === '' ||
      orderNum.includes(searchQuery.toLowerCase()) ||
      (o.items && o.items.some((item: any) => (item.product?.name || item.name || '').toLowerCase().includes(searchQuery.toLowerCase())));
    return matchStatus && matchSearch;
  });

  const filterCount = (id: string) => {
    if (id === 'all') return orderList.length;
    return orderList.filter((o: any) => (o.status || '').toLowerCase() === id).length;
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'shipped':
        return 'bg-stone-900 text-white border-stone-900';
      case 'processing':
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const copyTrackingNumber = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getLifecycleSteps = (order: any) => {
    const status = (order.status || '').toLowerCase();
    const fulfillment = (order.fulfillment_status || order.fulfillmentStatus || '').toLowerCase();
    const isCod = (order.payment_method || '').toLowerCase().includes('cod');
    const isPaid = order.payment_status === 'PAYMENT_CAPTURED' || order.payment_status === 'ORDER_PAID' || (!isCod && status !== 'cancelled');

    return [
      {
        title: 'Order Confirmed',
        description: 'Order received and verified in system',
        date: new Date(order.created_at || order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        completed: true,
        current: status === 'pending'
      },
      {
        title: isCod ? 'Payment on Delivery' : 'Payment Verified',
        description: isCod ? 'Cash/UPI due upon delivery arrival' : 'Payment captured securely via gateway',
        completed: isPaid || status === 'delivered',
        current: isCod && status !== 'delivered'
      },
      {
        title: 'Processing & Packaging',
        description: 'Quality inspected and securely packaged in fulfillment warehouse',
        completed: status === 'processing' || status === 'shipped' || status === 'delivered' || fulfillment === 'packed',
        current: status === 'processing'
      },
      {
        title: 'Shipped & In Transit',
        description: order.carrier ? `Dispatched via ${order.carrier}` : 'Queued with express carrier partner',
        completed: status === 'shipped' || status === 'delivered',
        current: status === 'shipped'
      },
      {
        title: 'Delivered',
        description: status === 'delivered' ? 'Package successfully handed over' : 'Estimated delivery within 2-4 business days',
        completed: status === 'delivered',
        current: status === 'delivered'
      }
    ];
  };

  if (loading) {
    return (
      <CustomerDashboardLayout title="My Orders" subtitle="Track orders and view receipts">
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-stone-200 rounded-2xl" />
          ))}
        </div>
      </CustomerDashboardLayout>
    );
  }

  if (error) {
    return (
      <CustomerDashboardLayout title="My Orders" subtitle="Track orders and view receipts">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-bold text-stone-800">Failed to load orders</p>
          <button
            onClick={() => fetchOrders()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout title="My Orders" subtitle="Track orders and view receipts">
      <div className="space-y-5">
        {/* ── Search & Status Filters ── */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by order number or item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map((f) => {
              const count = filterCount(f.id);
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    active ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Orders List ── */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order: any) => {
              const orderDate = new Date(order.created_at || order.createdAt).toLocaleDateString('en-IN', {
                dateStyle: 'medium',
              });
              const orderNum = order.order_number || order.orderNumber || `#${order.id.slice(0, 8)}`;
              const items = order.items || [];

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden hover:border-stone-400 transition-all cursor-pointer group"
                >
                  {/* Order Card Header */}
                  <div className="p-4 sm:p-5 bg-stone-50/80 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                        #
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-stone-900 group-hover:text-stone-700 transition-colors">
                            {orderNum}
                          </h3>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">Placed on {orderDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-stone-500">Order Total</p>
                        <p className="text-sm sm:text-base font-bold text-stone-900">
                          {fmt(order.total_amount || order.totalAmount)}
                        </p>
                      </div>
                      <span className="p-2 rounded-xl bg-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-colors text-stone-600">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="divide-y divide-stone-100">
                      {items.map((item: any, idx: number) => {
                        const rawImg = item.product?.images?.[0] || item.product?.image || item.image_url || item.image;
                        const imgUrl = normalizeImageUrl(rawImg);
                        return (
                          <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200 flex items-center justify-center">
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={item.product?.name || item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';
                                    }}
                                  />
                                ) : (
                                  <Package className="w-5 h-5 text-stone-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-stone-900 truncate">
                                  {item.product?.name || item.name || 'Catalog Item'}
                                </p>
                                <p className="text-[11px] text-stone-500 mt-0.5">
                                  Qty: {item.quantity} &bull; {fmt(item.price || item.unit_price)} each
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-stone-900 flex-shrink-0">
                              {fmt((parseFloat(item.price || item.unit_price || '0') * (item.quantity || 1)))}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tracking info if present */}
                    {order.tracking_number && (
                      <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-stone-700" />
                          <span className="text-stone-600">Tracking: <strong className="text-stone-900 font-mono">{order.tracking_number}</strong></span>
                        </div>
                        <span className="text-stone-900 font-bold inline-flex items-center gap-1">
                          <span>View Stages</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-900">No matching orders found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search criteria.' : 'When you place orders, you can track their status and download invoices here.'}
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Store Catalog</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── Order Tracking & Details Modal ── */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setSelectedOrder(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10 p-6 space-y-6 border border-stone-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                      {selectedOrder.order_number || selectedOrder.orderNumber || `#${selectedOrder.id.slice(0, 8)}`}
                    </h2>
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Placed on {new Date(selectedOrder.created_at || selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live Order Lifecycle Progression */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-stone-700" />
                  <span>Current Processing Stage</span>
                </h3>

                <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-4">
                  {getLifecycleSteps(selectedOrder).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        step.completed
                          ? 'bg-stone-900 text-white'
                          : step.current
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-200 text-stone-400'
                      }`}>
                        {step.completed ? <Check className="w-4 h-4 text-white" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${step.completed ? 'text-stone-900' : 'text-stone-600'}`}>
                            {step.title}
                          </p>
                          {step.date && <span className="text-[10px] text-stone-500">{step.date}</span>}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carrier & Tracking AWB Card (If present) */}
              {selectedOrder.tracking_number && (
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">Carrier: {selectedOrder.carrier || 'Express Delivery'}</p>
                      <p className="font-mono text-stone-600 font-bold flex items-center gap-1.5 mt-0.5">
                        AWB: {selectedOrder.tracking_number}
                        <button
                          onClick={() => copyTrackingNumber(selectedOrder.tracking_number)}
                          className="p-0.5 hover:bg-stone-200 rounded text-stone-700 cursor-pointer"
                        >
                          {copiedTracking ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </p>
                    </div>
                  </div>
                  {selectedOrder.tracking_url && (
                    <a
                      href={selectedOrder.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg font-bold text-xs hover:bg-stone-800 transition-colors self-start sm:self-auto"
                    >
                      <span>Track on Courier Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Items Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">Ordered Products</h3>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                  {(selectedOrder.items || []).map((item: any, idx: number) => {
                    const rawImg = item.product?.images?.[0] || item.product?.image || item.image_url || item.image;
                    const imgUrl = normalizeImageUrl(rawImg);
                    return (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-stone-50/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200 flex items-center justify-center">
                            {imgUrl ? (
                              <img src={imgUrl} alt={item.product?.name || item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-stone-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 truncate">{item.product?.name || item.name || 'Product'}</p>
                            <p className="text-[11px] text-stone-500">Qty: {item.quantity} &bull; {fmt(item.price || item.unit_price)}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-stone-900">
                          {fmt((parseFloat(item.price || item.unit_price || '0') * (item.quantity || 1)))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address & Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Delivery Destination
                  </span>
                  <p className="font-bold text-stone-900">{selectedOrder.shipping_address?.name || 'Customer'}</p>
                  <p className="text-stone-600">{selectedOrder.shipping_address?.address_line1 || selectedOrder.shipping_address?.street || ''}</p>
                  <p className="text-stone-600">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.postal_code || selectedOrder.shipping_address?.pincode}</p>
                  {selectedOrder.shipping_address?.phone && <p className="pt-1 text-stone-500">Phone: {selectedOrder.shipping_address.phone}</p>}
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Cost Summary
                  </span>
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span>{fmt(selectedOrder.subtotal || selectedOrder.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Shipping</span>
                    <span className="text-emerald-700 font-bold">
                      {(selectedOrder.shipping_amount || selectedOrder.shippingFee || 0) === 0 ? 'FREE' : fmt(selectedOrder.shipping_amount || selectedOrder.shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total Amount</span>
                    <span>{fmt(selectedOrder.total_amount || selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    generateInvoicePrintWindow({
                      orderNumber: selectedOrder.order_number || selectedOrder.id,
                      orderDate: selectedOrder.created_at || selectedOrder.createdAt,
                      customerName: selectedOrder.shipping_address?.name || 'Customer',
                      customerEmail: selectedOrder.shipping_address?.email,
                      customerPhone: selectedOrder.shipping_address?.phone,
                      shippingAddress: selectedOrder.shipping_address,
                      items: (selectedOrder.items || []).map((i: any) => ({
                        name: i.product?.name || i.name || 'Item',
                        quantity: i.quantity || 1,
                        unitPrice: i.price || i.unit_price || 0,
                        totalPrice: (i.price || i.unit_price || 0) * (i.quantity || 1)
                      })),
                      subtotal: selectedOrder.subtotal || selectedOrder.total_amount,
                      tax: selectedOrder.tax_amount || 0,
                      shipping: selectedOrder.shipping_amount || 0,
                      discount: selectedOrder.discount_amount || 0,
                      total: selectedOrder.total_amount,
                      paymentMethod: selectedOrder.payment_method || 'Online Payment',
                      storeName: 'Store'
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download Invoice PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
};

export default OrdersPage;
