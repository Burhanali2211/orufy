import React from 'react';
import { ArrowLeft, Printer, Calendar } from 'lucide-react';
import { OrderData } from '../types';

interface OrderHeaderProps {
  order: OrderData;
  onClose: () => void;
  renderStatusBadge: (status: string, isPayment?: boolean) => React.ReactNode;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ order, onClose, renderStatusBadge }) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
    <div className="flex items-start gap-3">
      <button
        onClick={onClose}
        className="p-2 hover:bg-gray-100 rounded-xl transition-colors mt-0.5 flex-shrink-0"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5 text-gray-600" />
      </button>
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
          {renderStatusBadge(order.status)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 transition-colors flex-shrink-0"
    >
      <Printer className="h-4 w-4" />
      Print Invoice
    </button>
  </div>
);

