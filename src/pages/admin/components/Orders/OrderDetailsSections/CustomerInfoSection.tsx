import React from 'react';
import { User, MapPin } from 'lucide-react';
import { OrderData } from '../types';
import { SectionCard, InfoRow } from './OrderDetailsComponents';

interface CustomerInfoSectionProps {
  order: OrderData;
}

export const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({ order }) => {
  const addr = order.shipping_address;
  const addrLine = [
    addr?.streetAddress || addr?.street_address || addr?.street,
    addr?.city && addr?.state ? `${addr.city}, ${addr.state}` : addr?.city || addr?.state,
    addr?.postalCode || addr?.postal_code || addr?.zipCode,
    addr?.country,
  ].filter(Boolean).join('\n');

  return (
    <SectionCard
      icon={<User className="w-4 h-4 text-blue-600" />}
      iconBg="bg-blue-50"
      title="Customer"
    >
      <div className="space-y-3">
        <InfoRow label="Name" value={order.customer_name} />
        <InfoRow label="Email" value={<span className="break-all">{order.customer_email || '—'}</span>} />
        {order.customer_phone && <InfoRow label="Phone" value={order.customer_phone} />}
        {addrLine && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <p className="text-xs text-gray-500">Shipping Address</p>
            </div>
            <p className="text-sm text-gray-900 whitespace-pre-line pl-5">{addrLine}</p>
          </div>
        )}
        {order.notes && (
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Order Notes</p>
            <p className="text-sm text-gray-700 italic">"{order.notes}"</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

