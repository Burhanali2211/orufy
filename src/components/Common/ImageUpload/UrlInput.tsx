import React from 'react';
import { Link, CheckCircle, X } from 'lucide-react';

interface UrlInputProps {
  urlInput: string;
  setUrlInput: (val: string) => void;
  showUrlField: boolean;
  setShowUrlField: (val: boolean) => void;
  disabled: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const UrlInput: React.FC<UrlInputProps> = ({
  urlInput, setUrlInput, showUrlField, setShowUrlField, disabled, onSubmit, onCancel
}) => {
  if (disabled) return null;

  return (
    <div className="pt-2">
      {!showUrlField ? (
        <button
          onClick={() => setShowUrlField(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
        >
          <Link className="h-3.5 w-3.5" />
          <span>Add via URL instead</span>
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
          />
          <button onClick={onSubmit} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
            <CheckCircle className="h-4 w-4" />
          </button>
          <button onClick={onCancel} className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
