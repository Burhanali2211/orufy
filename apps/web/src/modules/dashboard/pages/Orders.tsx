import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { useDashboardAuth } from '../hooks/useDashboardAuth';
import { formatRupees } from '../utils';
import type { DashboardOrder, OrderStatus } from '../types';

interface OrdersResponse {
  orders: DashboardOrder[];
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Order detail modal ───────────────────────────────────────────────────────

interface OrderModalProps {
  order: DashboardOrder;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>;
}

function OrderModal({ order, onClose, onStatusChange }: OrderModalProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [updating, setUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as OrderStatus;
    setUpdating(true);
    try {
      await onStatusChange(order.id, next);
      setCurrentStatus(next);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            Order #{order.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 text-sm">
          {/* Date */}
          <p className="text-gray-500">
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>

          {/* Customer */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Customer
            </p>
            <p className="text-gray-900">{order.customerName}</p>
            <p className="text-gray-500">{order.customerEmail}</p>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
              Items
            </p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-700">
                    {item.name}{' '}
                    <span className="text-gray-400">× {item.quantity}</span>
                  </span>
                  <span className="text-gray-700">
                    {formatRupees(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-medium">
              <span>Total</span>
              <span>{formatRupees(order.totalAmount)}</span>
            </div>
          </div>

          {/* Shipping address */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Shipping address
            </p>
            <p className="text-gray-700 whitespace-pre-line">
              {order.shippingAddress}
            </p>
          </div>

          {/* Status update */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              Update status
            </label>
            <select
              value={currentStatus}
              onChange={handleChange}
              disabled={updating}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 text-right">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const OrdersPage: React.FC = () => {
  const { user } = useDashboardAuth();
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState('');
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(
    null
  );

  const fetchOrders = useCallback((status: string) => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    apiClient
      .get<OrdersResponse>(`/api/dashboard/orders${qs}`)
      .then((res) => {
        setOrders(res.orders);
        setError(null);
      })
      .catch(() => setError('Could not load orders.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrders(activeStatus);
  }, [user, navigate, activeStatus, fetchOrders]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await apiClient.patch(`/api/dashboard/orders/${orderId}/status`, {
      status,
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Orders</h1>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              activeStatus === tab.value
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="py-6 text-center text-gray-500">{error}</p>}

      {!error && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    'Order #',
                    'Customer',
                    'Items',
                    'Total',
                    'Status',
                    'Date',
                    'Action',
                  ].map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 py-2 text-xs text-gray-500 font-medium whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="bg-gray-100 animate-pulse rounded h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">
                        #{order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {order.items.length} item
                        {order.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatRupees(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default OrdersPage;
