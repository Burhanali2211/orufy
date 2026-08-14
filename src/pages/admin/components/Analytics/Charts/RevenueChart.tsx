import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface RevenueChartProps {
  chartData: any[];
  formatYAxis: (value: number) => string;
  CustomTooltip: React.FC<any>;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ chartData, formatYAxis, CustomTooltip }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No revenue data for this period</p>
          </div>
        </div>
      )}
    </div>
  );
};

