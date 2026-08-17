import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationPayload {
  type?: NotificationType;
  title?: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: NotificationPayload | string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const showNotification = useCallback((notification: NotificationPayload | string) => {
    if (typeof notification === 'string') {
      toast(notification);
      return;
    }
    const { type = 'info', title = '', message = '', duration = 3000 } = notification;
    const desc = message || undefined;
    
    switch (type) {
      case 'success':
        toast.success(title || message, { description: title && message ? message : undefined, duration });
        break;
      case 'error':
        toast.error(title || message, { description: title && message ? message : undefined, duration });
        break;
      case 'warning':
        toast.warning(title || message, { description: title && message ? message : undefined, duration });
        break;
      default:
        toast.info(title || message, { description: title && message ? message : undefined, duration });
        break;
    }
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    toast.success(title, { description: message });
  }, []);

  const showError = useCallback((title: string, message?: string) => {
    toast.error(title, { description: message });
  }, []);

  const showWarning = useCallback((title: string, message?: string) => {
    toast.warning(title, { description: message });
  }, []);

  const showInfo = useCallback((title: string, message?: string) => {
    toast.info(title, { description: message });
  }, []);

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useNotification();
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
