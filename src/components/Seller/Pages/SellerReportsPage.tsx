import React from 'react';
import { FileText } from 'lucide-react';

export const SellerReportsPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Reports</h2>
        <p className="text-gray-600">Reports feature coming soon.</p>
      </div>
    </div>
  );
};

export default SellerReportsPage;
