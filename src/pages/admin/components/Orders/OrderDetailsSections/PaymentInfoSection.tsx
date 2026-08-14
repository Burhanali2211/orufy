import React from 'react';
import { CreditCard } from 'lucide-react';
import { OrderData } from '../types';
import { SectionCard, InfoRow, fmt } from './OrderDetailsComponents';
import { getPaymentMethodConfig } from '@/utils/orderStatusUtils';

interface PaymentInfoSectionProps {
  order: OrderData;
  renderStatusBadge: (status: string, isPayment?: boolean) => React.ReactNode;
}

export const PaymentInfoSection: React.FC<PaymentInfoSectionProps> = ({ order, renderStatusBadge }) => (
  <SectionCard
    icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
    iconBg="bg-emerald-50"
    title="Payment"
  >
    <div className="space-y-3">
      <div>
        <p className="text-xs text-gray-500 mb-1">Status</p>
        {renderStatusBadge(order.payment_status, true)}
      </div>
      <InfoRow
        label="Method"
        value={getPaymentMethodConfig(order.payment_method).label}
      />
      {order.payment_status === 'paid' && (
        <InfoRow label="Amount Paid" value={<span className="text-emerald-600 font-semibold">{fmt(order.total_amount)}</span>} />
      )}
      {order.razorpay_payment_id && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Razorpay Payment ID</p>
          <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200 block break-all">
            {order.razorpay_payment_id}
          </code>
        </div>
      )}
      {order.razorpay_order_id && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Razorpay Order ID</p>
          <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200 block break-all">
            {order.razorpay_order_id}
          </code>
        </div>
      )}
      {order.payment_method_details && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-1.5 text-sm">
          {order.payment_method_details.method && (
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900 capitalize">{order.payment_method_details.method}</span>
            </div>
          )}
          {order.payment_method_details.card?.last4 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Card</span>
              <span className="font-medium text-gray-900">
                ****{order.payment_method_details.card.last4} ({order.payment_method_details.card.network || 'Card'})
              </span>
            </div>
          )}
          {order.payment_method_details.vpa && (
            <div className="flex justify-between">
              <span className="text-gray-500">UPI ID</span>
              <span className="font-medium text-gray-900">{order.payment_method_details.vpa}</span>
            </div>
          )}
          {order.payment_method_details.bank && (
            <div className="flex justify-between">
              <span className="text-gray-500">Bank</span>
              <span className="font-medium text-gray-900">{order.payment_method_details.bank}</span>
            </div>
          )}
          {order.payment_method_details.wallet && (
            <div className="flex justify-between">
              <span className="text-gray-500">Wallet</span>
              <span className="font-medium text-gray-900">{order.payment_method_details.wallet}</span>
            </div>
          )}
        </div>
      )}
    </div>
  </SectionCard>
);

