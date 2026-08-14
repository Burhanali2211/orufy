import React from 'react';
import { MapPin } from 'lucide-react';
import { ShippingInfo } from '../types';
import { Field, inputClass } from './Field';

interface ShippingFormProps {
  formData: ShippingInfo;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const ShippingForm: React.FC<ShippingFormProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
          <MapPin className="h-4 w-4 text-stone-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Shipping Information</h2>
          <p className="text-xs text-gray-500">Where should we deliver your order?</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" required>
            <input
              type="text" name="firstName" value={formData.firstName}
              onChange={onChange} className={inputClass}
              placeholder="Rahul"
            />
          </Field>
          <Field label="Last Name" required>
            <input
              type="text" name="lastName" value={formData.lastName}
              onChange={onChange} className={inputClass}
              placeholder="Sharma"
            />
          </Field>
        </div>

        <Field label="Email Address" required>
          <input
            type="email" name="email" value={formData.email}
            onChange={onChange} className={inputClass}
            placeholder="rahul@example.com"
          />
        </Field>

        <Field label="Phone Number" required>
          <input
            type="tel" name="phone" value={formData.phone}
            onChange={onChange} className={inputClass}
            placeholder="+91 98765 43210"
          />
        </Field>

        <Field label="Street Address" required>
          <input
            type="text" name="address" value={formData.address}
            onChange={onChange} className={inputClass}
            placeholder="House no., Street, Area"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City" required>
            <input
              type="text" name="city" value={formData.city}
              onChange={onChange} className={inputClass}
              placeholder="Mumbai"
            />
          </Field>
          <Field label="State" required>
            <input
              type="text" name="state" value={formData.state}
              onChange={onChange} className={inputClass}
              placeholder="Maharashtra"
            />
          </Field>
        </div>

        <Field label="PIN Code" required>
          <input
            type="text" name="zipCode" value={formData.zipCode}
            onChange={onChange} className={inputClass}
            placeholder="400001"
          />
        </Field>

        <p className="text-xs text-gray-400">
          Fields marked <span className="text-red-500 font-medium">*</span> are required
        </p>
      </div>
    </div>
  );
};
