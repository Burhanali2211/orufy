import React from 'react';
import { Package } from 'lucide-react';
import { OrderData } from '../types';
import { SectionCard, fmt } from './OrderDetailsComponents';

interface OrderItemsSectionProps {
  order: OrderData;
}

export const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({ order }) => (
  <SectionCard
    icon={<Package className="w-4 h-4 text-amber-600" />}
    iconBg="bg-amber-100"
    title="Order Items"
    subtitle={`${order.items.length} ${order.items.length === 1 ? 'item' : 'items'}`}
  >
    <div className="divide-y divide-gray-50 -mx-5 -mb-5">
      {order.items.map((item) => (
        <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
            <img
              src={item.product_image || '/placeholder.png'}
              alt={item.product_name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{item.product_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {fmt(item.unit_price)} × {item.quantity}
            </p>
          </div>
          <p className="font-semibold text-sm text-amber-600 flex-shrink-0">{fmt(item.total_price)}</p>
        </div>
      ))}
      
      <div className="px-5 py-4 bg-gray-50 space-y-2 border-t border-gray-100">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium text-gray-900">{fmt(order.subtotal)}</span>
        </div>
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount</span>
            <span className="font-medium text-emerald-600">−{fmt(order.discount_amount)}</span>
          </div>
        )}
        {Number(order.tax_amount) > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span>
            <span className="font-medium text-gray-900">{fmt(order.tax_amount)}</span>
          </div>
        )}
        {Number(order.shipping_amount) > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span className="font-medium text-gray-900">{fmt(order.shipping_amount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total</span>
          <span className="text-amber-600">{fmt(order.total_amount)}</span>
        </div>
      </div>
    </div>
  </SectionCard>
);

