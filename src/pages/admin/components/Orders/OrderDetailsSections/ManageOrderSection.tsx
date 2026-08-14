import React from 'react';
import { Edit, Save, Truck } from 'lucide-react';
import { OrderData } from '../types';
import { SectionCard } from './OrderDetailsComponents';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, getOrderStatusConfig, getPaymentStatusConfig } from '@/utils/orderStatusUtils';

interface ManageOrderSectionProps {
  order: OrderData;
  updating: boolean;
  newStatus: string;
  setNewStatus: (status: string) => void;
  newPaymentStatus: string;
  setNewPaymentStatus: (status: string) => void;
  trackingNumber: string;
  setTrackingNumber: (tracking: string) => void;
  setShowStatusModal: (show: boolean) => void;
  handleUpdatePaymentStatus: () => void;
  handleUpdateTracking: () => void;
}

export const ManageOrderSection: React.FC<ManageOrderSectionProps> = ({
  order,
  updating,
  newStatus,
  setNewStatus,
  newPaymentStatus,
  setNewPaymentStatus,
  trackingNumber,
  setTrackingNumber,
  setShowStatusModal,
  handleUpdatePaymentStatus,
  handleUpdateTracking
}) => (
  <SectionCard
    icon={<Edit className="w-4 h-4 text-purple-600" />}
    iconBg="bg-purple-50"
    title="Manage Order"
  >
    <div className="space-y-5">
      {/* Order Status */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
          Order Status
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Current: <span className="font-medium text-gray-900">{getOrderStatusConfig(order.status).label}</span>
        </p>
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          disabled={updating}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 bg-white disabled:opacity-50"
        >
          {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        {newStatus !== order.status && (
          <button
            onClick={() => setShowStatusModal(true)}
            disabled={updating}
            className="mt-2.5 w-full px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            {updating ? <></> : <Save className="h-4 w-4" />}
            Update Status
          </button>
        )}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
          Payment Status
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Current: <span className="font-medium text-gray-900">{getPaymentStatusConfig(order.payment_status).label}</span>
        </p>
        <select
          value={newPaymentStatus}
          onChange={(e) => setNewPaymentStatus(e.target.value)}
          disabled={updating}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 bg-white disabled:opacity-50"
        >
          {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        {newPaymentStatus !== order.payment_status && (
          <button
            onClick={handleUpdatePaymentStatus}
            disabled={updating}
            className="mt-2.5 w-full px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            {updating ? <></> : <Save className="h-4 w-4" />}
            Update Payment
          </button>
        )}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5" />
          Tracking Number
        </label>
        {order.tracking_number && (
          <p className="text-xs text-gray-500 mb-2">
            Current: <span className="font-medium text-gray-900 font-mono">{order.tracking_number}</span>
          </p>
        )}
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Enter tracking number (optional)"
          disabled={updating}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 placeholder-gray-400 disabled:opacity-50"
        />
        {trackingNumber.trim() !== (order.tracking_number || '').trim() && (
          <button
            onClick={handleUpdateTracking}
            disabled={updating}
            className="mt-2.5 w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            {updating ? <></> : <Save className="h-4 w-4" />}
            {trackingNumber.trim() ? 'Save Tracking' : 'Clear Tracking'}
          </button>
        )}
      </div>
    </div>
  </SectionCard>
);

