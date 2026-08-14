import React from 'react';
import { Shield, Fingerprint, Star } from 'lucide-react';

export const TrustIndicators: React.FC = () => {
  return (
    <div className="pt-4 border-t border-gray-200 mt-5">
      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center">
          <Shield className="h-4 w-4 mr-1 text-green-500" />
          <span>Secure</span>
        </div>
        <div className="flex items-center">
          <Fingerprint className="h-4 w-4 mr-1 text-blue-500" />
          <span>Private</span>
        </div>
        <div className="flex items-center">
          <Star className="h-4 w-4 mr-1 text-purple-500" />
          <span>Trusted</span>
        </div>
      </div>
    </div>
  );
};
