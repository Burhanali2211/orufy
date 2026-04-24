import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Check } from 'lucide-react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
  successMessage?: string;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  children,
  loading = false,
  error = null,
  success = false,
  successMessage = 'Settings saved successfully',
  className = ''
}) => {
  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          {icon && <div className="text-gray-600">{icon}</div>}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
        </div>
      </div>

      {loading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      )}

      {!loading && (
        <>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {children}
        </>
      )}
    </div>
  );
};

export const SettingsButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}> = ({
  onClick,
  disabled = false,
  loading = false,
  icon,
  children,
  variant = 'primary',
  className = ''
}) => {
  const getButtonClass = () => {
    const baseClass = 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors';
    const disabledClass = disabled || loading ? 'opacity-70 cursor-not-allowed' : '';
    
    switch (variant) {
      case 'primary':
        return `${baseClass} ${disabledClass} bg-indigo-600 text-white hover:bg-indigo-700 ${className}`;
      case 'secondary':
        return `${baseClass} ${disabledClass} bg-gray-100 text-gray-700 hover:bg-gray-200 ${className}`;
      case 'danger':
        return `${baseClass} ${disabledClass} bg-red-600 text-white hover:bg-red-700 ${className}`;
      default:
        return `${baseClass} ${disabledClass} bg-indigo-600 text-white hover:bg-indigo-700 ${className}`;
    }
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={getButtonClass()}
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export const FormField: React.FC<{
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}> = ({ label, htmlFor, required = false, error, children, className = '' }) => {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
