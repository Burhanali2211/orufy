import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { WifiOff, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isSlowConnection: false,
  connectionType: '4g',
  degradationLevel: 'none',
  shouldLoadImages: true,
  shouldLoadAnimations: true,
  shouldUseOptimizedQueries: false,
  retryFailedRequests: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

interface NetworkStatusProviderProps {
  children: ReactNode;
  showStatusBar?: boolean;
}

export const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({
  children,
  showStatusBar = true
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retryFailedRequests = useCallback(() => {
    // Standard trigger for React Query or network retries
  }, []);

  const value: NetworkContextType = {
    isOnline,
    isSlowConnection: false,
    connectionType: '4g',
    degradationLevel: 'none',
    shouldLoadImages: true,
    shouldLoadAnimations: true,
    shouldUseOptimizedQueries: false,
    retryFailedRequests,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
      {showStatusBar && (
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-lg"
            >
              <WifiOff className="w-4 h-4" /> You are currently offline. Check your internet connection.
            </motion.div>
          )}
          {showRestored && isOnline && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle className="w-4 h-4" /> Internet connection restored.
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </NetworkContext.Provider>
  );
};

export default NetworkStatusProvider;
