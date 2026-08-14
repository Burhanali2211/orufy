import React from 'react';
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  getPaymentMethodConfig,
  getAdminStatusClasses,
} from '@/utils/orderStatusUtils';

export const fmt = (amount: number | string) => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${(n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export const renderStatusBadge = (status: string, isPayment = false) => {
  const config = isPayment ? getPaymentStatusConfig(status) : getOrderStatusConfig(status);
  const Icon = config.icon;
  const cls = getAdminStatusClasses(status, isPayment);
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{config.label}</span>
    </div>
  );
};

export const renderPaymentMethod = (method: string) => {
  const config = getPaymentMethodConfig(method);
  const Icon = config.icon;
  return (
    <div className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
      <span className="text-xs text-gray-700">{config.label}</span>
    </div>
  );
};

