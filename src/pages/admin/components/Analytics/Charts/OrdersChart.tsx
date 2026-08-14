import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart } from 'lucide-react';

interface OrdersChartProps {
  chartData: any[];
}

export const OrdersChart: React.FC<OrdersChartProps> = ({ chartData }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Orders per Day</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="orders" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center">
            <ShoppingCart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No order data for this period</p>
          </div>
        </div>
      )}
    </div>
  );
};

