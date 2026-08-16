import React from 'react';
import { ArrowLeft, X } from 'lucide-react';

interface AuthHeaderProps {
  mode: string;
  step: number;
  onBack: () => void;
  onClose: () => void;
  showBack: boolean;
  title: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  mode,
  step,
  onBack,
  onClose,
  showBack,
  title
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
      <div className="flex items-center justify-between">
        {showBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}

        <div className="flex-1 text-center">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
