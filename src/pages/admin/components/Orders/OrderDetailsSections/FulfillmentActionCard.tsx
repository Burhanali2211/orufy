import React, { useState } from 'react';
import { Package, Truck, CheckCircle2, XCircle, ArrowRight, MapPin } from 'lucide-react';
import { OrderData } from '../types';
import { useNotification } from '@/contexts/NotificationContext';

interface FulfillmentActionCardProps {
  order: OrderData;
  onOrderUpdated: () => void;
}

export const FulfillmentActionCard: React.FC<FulfillmentActionCardProps> = ({
  order,
  onOrderUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [carrier, setCarrier] = useState(order.carrier || 'Delhivery');
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const { showSuccess, showError } = useNotification();

  const fulfillmentStatus = order.fulfillment_status || (order.status === 'delivered' ? 'DELIVERED' : order.status === 'shipped' ? 'SHIPPED' : order.status === 'processing' ? 'PACKED' : 'UNFULFILLED');

  const steps = [
    { key: 'RECEIVED', label: 'Order Received', done: true },
    { key: 'PAID', label: 'Payment Confirmed', done: order.payment_status === 'PAYMENT_CAPTURED' || order.payment_status === 'ORDER_PAID' || order.payment_status === 'completed' || order.payment_method === 'cod' },
    { key: 'PACKED', label: 'Packed', done: fulfillmentStatus === 'PACKED' || fulfillmentStatus === 'SHIPPED' || fulfillmentStatus === 'DELIVERED' },
    { key: 'SHIPPED', label: 'Shipped', done: fulfillmentStatus === 'SHIPPED' || fulfillmentStatus === 'DELIVERED' },
    { key: 'DELIVERED', label: 'Delivered', done: fulfillmentStatus === 'DELIVERED' },
  ];

  const handlePack = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/merchant/orders/${order.id}/pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to pack order');
      showSuccess('Order Packed', 'Order marked as packed and ready for dispatch');
      onOrderUpdated();
    } catch (err: any) {
      showError('Action Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrier.trim() || !trackingNumber.trim()) {
      showError('Required', 'Please provide carrier and tracking number');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/merchant/orders/${order.id}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier: carrier.trim(), trackingNumber: trackingNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to ship order');
      showSuccess('Order Dispatched', `Marked as shipped via ${carrier}`);
      setShowShipModal(false);
      onOrderUpdated();
    } catch (err: any) {
      showError('Action Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/merchant/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deliver order');
      showSuccess('Order Completed', 'Order marked as delivered to customer');
      onOrderUpdated();
    } catch (err: any) {
      showError('Action Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 space-y-6">
      {/* Title & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Fulfillment Progression</h3>
            <p className="text-xs text-stone-500">Live order state & dispatch pipeline</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
          fulfillmentStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
          fulfillmentStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
          fulfillmentStatus === 'PACKED' ? 'bg-purple-100 text-purple-800' :
          'bg-stone-100 text-stone-700'
        }`}>
          {fulfillmentStatus}
        </span>
      </div>

      {/* Goal Gradient Fulfillment Timeline */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
        {steps.map((step, idx) => (
          <div key={step.key} className="relative flex items-center gap-3">
            <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-white ${
              step.done ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'
            }`}>
              {step.done ? '✓' : idx + 1}
            </div>
            <span className={`text-xs font-medium ${step.done ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tracking Info if Shipped */}
      {(order.tracking_number || trackingNumber) && (
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span>Carrier: <strong className="text-stone-800">{order.carrier || carrier || 'Standard Delivery'}</strong></span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-stone-400" /> In Transit</span>
          </div>
          <div className="font-mono text-stone-900 font-semibold">
            AWB: {order.tracking_number || trackingNumber}
          </div>
        </div>
      )}

      {/* Primary Goal Action Affordance (No dropdown confusion) */}
      <div className="pt-2">
        {fulfillmentStatus === 'UNFULFILLED' && (
          <button
            onClick={handlePack}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <></> : <Package className="w-4 h-4" />}
            <span>Mark as Packed →</span>
          </button>
        )}

        {fulfillmentStatus === 'PACKED' && (
          <button
            onClick={() => setShowShipModal(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Truck className="w-4 h-4" />
            <span>Add Tracking & Mark as Shipped →</span>
          </button>
        )}

        {fulfillmentStatus === 'SHIPPED' && (
          <button
            onClick={handleDeliver}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <></> : <CheckCircle2 className="w-4 h-4" />}
            <span>Mark as Delivered ✓</span>
          </button>
        )}

        {fulfillmentStatus === 'DELIVERED' && (
          <div className="py-2.5 px-3 bg-emerald-50 text-emerald-800 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Fulfillment Completed</span>
          </div>
        )}
      </div>

      {/* Shipment Modal */}
      {showShipModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleShip} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Dispatch & Tracking Details</span>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Carrier Name</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-stone-50 font-medium"
                >
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">BlueDart</option>
                  <option value="DTDC">DTDC</option>
                  <option value="India Post">India Post</option>
                  <option value="Ekart">Ekart</option>
                  <option value="Shadowfax">Shadowfax</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Tracking Number / AWB *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DLHV984729103"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowShipModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading && <></>}
                Confirm & Ship →
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
