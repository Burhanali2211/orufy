import React from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export const inputClass =
  'w-full px-4 py-3 rounded-xl border-none text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all bg-gray-100 hover:bg-gray-200/50 shadow-none';
