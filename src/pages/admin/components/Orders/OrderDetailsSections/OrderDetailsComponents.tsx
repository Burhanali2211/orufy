import React from 'react';

export const SectionCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ icon, iconBg, title, subtitle, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <div className="text-sm font-medium text-gray-900">{value}</div>
  </div>
);

export const fmt = (amount: number | string) => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${(n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

