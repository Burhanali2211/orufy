import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, Database, Clock } from 'lucide-react';

interface ErrorFallbackProps {
  error?: string | null;
  onRetry?: () => void;
  type?: 'network' | 'database' | 'timeout' | 'general';
  showRetry?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  type = 'general',
  showRetry = true,
  className = '',
  size = 'medium'
}) => {
  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff className="h-8 w-8 text-red-500" />;
      case 'database':
        return <Database className="h-8 w-8 text-red-500" />;
      case 'timeout':
        return <Clock className="h-8 w-8 text-orange-500" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (type) {
      case 'network':
        return 'Connection Problem';
      case 'database':
        return 'Database Error';
      case 'timeout':
        return 'Request Timed Out';
      default:
        return 'Something Went Wrong';
    }
  };

  const getErrorMessage = () => {
    if (error) return error;
    
    switch (type) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'database':
        return 'Unable to connect to the database. Please try again later.';
      case 'timeout':
        return 'The request took too long to complete. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-4 text-sm';
      case 'large':
        return 'p-8 text-lg';
      default:
        return 'p-6 text-base';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-red-200 ${getSizeClasses()} ${className}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {getErrorIcon()}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2">
          {getErrorTitle()}
        </h3>
        
        <p className="text-gray-600 mb-4">
          {getErrorMessage()}
        </p>
        
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

interface ProductGridErrorProps {
  error?: string | null;
  onRetry?: () => void;
  showSkeleton?: boolean;
}

export const ProductGridError: React.FC<ProductGridErrorProps> = ({
  error,
  onRetry,
  showSkeleton = false
}) => {
  if (showSkeleton) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="col-span-full">
      <ErrorFallback
        error={error || null}
        onRetry={onRetry}
        type="database"
        size="large"
        className="max-w-md mx-auto"
      />
    </div>
  );
};

interface NetworkStatusProps {
  isOnline: boolean;
  onRetry?: () => void;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ isOnline, onRetry }) => {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-3 z-50 animate-fade-in-down">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <WifiOff className="h-5 w-5 mr-2" />
          <span>You're offline. Some features may not work properly.</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;