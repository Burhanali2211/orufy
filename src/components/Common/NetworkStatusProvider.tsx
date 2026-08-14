import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, Wifi, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useNetworkStatus, useGracefulDegradation } from '../../utils/networkResilience';

interface NetworkContextType {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  degradationLevel: 'none' | 'partial' | 'full';
  shouldLoadImages: boolean;
  shouldLoadAnimations: boolean;
  shouldUseOptimizedQueries: boolean;
  retryFailedRequests: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkStatusProvider');
  }
  return context;
};

interface NetworkStatusProviderProps {
  children: ReactNode;
  showStatusBar?: boolean;
  enableGracefulDegradation?: boolean;
}

export const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({
  children,
  showStatusBar = true,
  enableGracefulDegradation = true
}) => {
  const networkStatus = useNetworkStatus();
  const gracefulDegradation = useGracefulDegradation();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'offline' | 'slow' | 'restored'>('offline');

  useEffect(() => {
    // Show notification when going offline
    if (!networkStatus.isOnline) {
      setNotificationType('offline');
      setShowNotification(true);
    }
    // Show notification for slow connection
    else if (networkStatus.isSlowConnection) {
      setNotificationType('slow');
      setShowNotification(true);
    }
    // Show restoration notification briefly
    else if (showNotification && notificationType === 'offline') {
      setNotificationType('restored');
      setTimeout(() => setShowNotification(false), 3000);
    }
    // Hide slow connection notification when connection improves
    else if (notificationType === 'slow') {
      setShowNotification(false);
    }
  }, [networkStatus.isOnline, networkStatus.isSlowConnection]);

  const retryFailedRequests = async () => {
    try {
      // Retry failed error reports
      const failedReports = JSON.parse(localStorage.getItem('failedErrorReports') || '[]');
      if (failedReports.length > 0) {
        // This would integrate with the error reporting service
        localStorage.removeItem('failedErrorReports');
      }

      // Retry other failed requests (could integrate with offline queue)
    } catch (error) {
      console.error('Failed to retry requests:', error);
    }
  };

  const contextValue: NetworkContextType = {
    isOnline: networkStatus.isOnline,
    isSlowConnection: networkStatus.isSlowConnection,
    connectionType: networkStatus.connectionType,
    degradationLevel: enableGracefulDegradation ? gracefulDegradation.degradationLevel : 'none',
    shouldLoadImages: enableGracefulDegradation ? gracefulDegradation.shouldLoadImages : true,
    shouldLoadAnimations: enableGracefulDegradation ? gracefulDegradation.shouldLoadAnimations : true,
    shouldUseOptimizedQueries: enableGracefulDegradation ? gracefulDegradation.shouldUseOptimizedQueries : false,
    retryFailedRequests
  };

  const getNotificationConfig = () => {
    switch (notificationType) {
      case 'offline':
        return {
          icon: <WifiOff className="h-5 w-5" />,
          title: 'You\'re offline',
          message: 'Some features may not work properly. We\'ll retry when you\'re back online.',
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        };
      case 'slow':
        return {
          icon: <Clock className="h-5 w-5" />,
          title: 'Slow connection detected',
          message: 'We\'ve optimized the interface for better performance.',
          bgColor: 'bg-orange-500',
          textColor: 'text-white'
        };
      case 'restored':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          title: 'Connection restored',
          message: 'All features are now available.',
          bgColor: 'bg-green-500',
          textColor: 'text-white'
        };
      default:
        return null;
    }
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}

      {showStatusBar && (
        <>
          {showNotification && (
            <NetworkStatusBar
              config={getNotificationConfig()}
              onRetry={retryFailedRequests}
              onDismiss={() => setShowNotification(false)}
              showRetry={notificationType === 'offline'}
            />
          )}
        </>
      )}
    </NetworkContext.Provider>
  );
};

interface NetworkStatusBarProps {
  config: {
    icon: React.ReactNode;
    title: string;
    message: string;
    bgColor: string;
    textColor: string;
  } | null;
  onRetry: () => void;
  onDismiss: () => void;
  showRetry: boolean;
}

const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({
  config,
  onRetry,
  onDismiss,
  showRetry
}) => {
  if (!config) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`fixed top-0 left-0 right-0 ${config.bgColor} ${config.textColor} p-3 z-50 shadow-lg`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {config.icon}
          <div>
            <div className="font-medium text-sm">{config.title}</div>
            <div className="text-xs opacity-90">{config.message}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showRetry && (
            <button
              onClick={onRetry}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm transition-colors"
            >
              Retry
            </button>
          )}
          <button
            onClick={onDismiss}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-1 rounded transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Connection quality indicator component
export const ConnectionQualityIndicator: React.FC<{
  className?: string;
  showLabel?: boolean;
}> = ({ className = '', showLabel = false }) => {
  const { isOnline, isSlowConnection, connectionType } = useNetwork();

  const getIndicatorConfig = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        color: 'text-red-500',
        label: 'Offline'
      };
    }

    if (isSlowConnection) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-orange-500',
        label: 'Slow'
      };
    }

    return {
      icon: <Wifi className="h-4 w-4" />,
      color: 'text-green-500',
      label: 'Online'
    };
  };

  const config = getIndicatorConfig();

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className={config.color}>{config.icon}</span>
      {showLabel && (
        <span className={`text-xs ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

// Hook for components that need to adapt to network conditions
export const useNetworkAdaptation = () => {
  const network = useNetwork();

  const getImageProps = (src: string, alt: string) => {
    if (!network.shouldLoadImages) {
      return {
        src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==',
        alt: `${alt} (Image loading disabled)`,
        loading: 'lazy' as const
      };
    }

    return {
      src,
      alt,
      loading: 'lazy' as const
    };
  };

  const getAnimationProps = () => {
    if (!network.shouldLoadAnimations) {
      return {
        initial: false,
        animate: false,
        transition: { duration: 0 }
      };
    }

    return {};
  };

  const getQueryConfig = () => {
    if (network.shouldUseOptimizedQueries) {
      return {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true
      };
    }

    return {
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false, // Disabled to prevent auto-refresh on tab switch
      refetchOnReconnect: true
    };
  };

  return {
    ...network,
    getImageProps,
    getAnimationProps,
    getQueryConfig
  };
};
