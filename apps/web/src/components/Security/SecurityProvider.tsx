import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface SecurityContextType {
  isSecureConnection: boolean;
  hasValidSession: boolean;
  rateLimitStatus: {
    userCreation: boolean;
    emailSending: boolean;
  };
  checkPermission: (action: string, resource?: string) => boolean;
  logSecurityEvent: (event: SecurityEvent) => void;
  validateCSRF: (token: string) => boolean;
}

interface SecurityEvent {
  type: 'permission_denied' | 'rate_limit_exceeded' | 'invalid_input' | 'suspicious_activity';
  action: string;
  resource?: string;
  details?: any;
  timestamp: Date;
}

interface SecurityProviderProps {
  children: ReactNode;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [securityState, setSecurityState] = useState({
    isSecureConnection: false,
    hasValidSession: false,
    rateLimitStatus: {
      userCreation: true,
      emailSending: true
    }
  });

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Initialize security checks
  useEffect(() => {
    checkSecureConnection();
    validateSession();
    generateCSRFToken();

    // Set up periodic security checks
    const securityInterval = setInterval(() => {
      validateSession();
      cleanupOldEvents();
    }, 60000); // Check every minute

    return () => clearInterval(securityInterval);
  }, []);

  // Check if connection is secure (HTTPS)
  const checkSecureConnection = () => {
    const isSecure = window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    setSecurityState(prev => ({ ...prev, isSecureConnection: isSecure }));

    if (!isSecure && import.meta.env.MODE === 'production') {
      showNotification({
        type: 'warning',
        title: 'Insecure Connection',
        message: 'Please use HTTPS for secure data transmission.'
      });
    }
  };

  // Validate user session
  const validateSession = () => {
    const hasValidSession = !!user && !!user.id;
    setSecurityState(prev => ({ ...prev, hasValidSession }));
  };

  // Generate CSRF token
  const generateCSRFToken = () => {
    const token = btoa(Math.random().toString()).substr(10, 32);
    setCsrfToken(token);

    // Store in session storage for validation
    sessionStorage.setItem('csrf_token', token);
  };

  // Validate CSRF token
  const validateCSRF = (token: string): boolean => {
    const storedToken = sessionStorage.getItem('csrf_token');
    return token === storedToken && token === csrfToken;
  };

  // Permission checking based on user role
  const checkPermission = (action: string, resource?: string): boolean => {
    if (!user) {
      logSecurityEvent({
        type: 'permission_denied',
        action,
        resource,
        details: { reason: 'No authenticated user' },
        timestamp: new Date()
      });
      return false;
    }

    const userRole = user.role;

    // Define permission matrix
    const permissions: { [key: string]: { [key: string]: string[] } } = {
      user_management: {
        create: ['admin'],
        read: ['admin', 'seller'],
        update: ['admin'],
        delete: ['admin'],
        bulk_operations: ['admin']
      },
      email_operations: {
        send_welcome: ['admin'],
        send_confirmation: ['admin'],
        resend_confirmation: ['admin']
      },
      system_settings: {
        read: ['admin'],
        update: ['admin']
      }
    };

    const resourcePermissions = permissions[resource || 'user_management'];
    if (!resourcePermissions) {
      return false;
    }

    const allowedRoles = resourcePermissions[action];
    if (!allowedRoles) {
      return false;
    }

    const hasPermission = allowedRoles.includes(userRole);

    if (!hasPermission) {
      logSecurityEvent({
        type: 'permission_denied',
        action,
        resource,
        details: { userRole, requiredRoles: allowedRoles },
        timestamp: new Date()
      });
    }

    return hasPermission;
  };

  // Log security events
  const logSecurityEvent = (event: SecurityEvent) => {
    setSecurityEvents(prev => [...prev, event]);

    // Show user notification for critical events
    if (event.type === 'permission_denied' || event.type === 'suspicious_activity') {
      showNotification({
        type: 'error',
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.'
      });
    }
  };

  // Clean up old security events (keep last 100)
  const cleanupOldEvents = () => {
    setSecurityEvents(prev => prev.slice(-100));
  };

  // Rate limiting checks
  const checkRateLimit = (operation: 'userCreation' | 'emailSending'): boolean => {
    const now = Date.now();
    const key = `${operation}_${user?.id}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      localStorage.setItem(key, JSON.stringify({ count: 1, resetTime: now + 60000 }));
      return true;
    }

    const data = JSON.parse(stored);

    // Reset if time window has passed
    if (now > data.resetTime) {
      localStorage.setItem(key, JSON.stringify({ count: 1, resetTime: now + 60000 }));
      return true;
    }

    // Check limits
    const limits = {
      userCreation: 5, // 5 users per minute
      emailSending: 3  // 3 emails per minute
    };

    if (data.count >= limits[operation]) {
      logSecurityEvent({
        type: 'rate_limit_exceeded',
        action: operation,
        details: { count: data.count, limit: limits[operation] },
        timestamp: new Date()
      });

      setSecurityState(prev => ({
        ...prev,
        rateLimitStatus: {
          ...prev.rateLimitStatus,
          [operation]: false
        }
      }));

      return false;
    }

    // Increment counter
    localStorage.setItem(key, JSON.stringify({
      count: data.count + 1,
      resetTime: data.resetTime
    }));

    return true;
  };

  // Input sanitization
  const sanitizeInput = (input: string): string => {
    if (!input) return '';

    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  };

  // Detect suspicious patterns
  const detectSuspiciousActivity = (input: string): boolean => {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
      /alert\(/i,
      /confirm\(/i,
      /prompt\(/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        logSecurityEvent({
          type: 'suspicious_activity',
          action: 'input_validation',
          details: { input: input.substring(0, 100), pattern: pattern.toString() },
          timestamp: new Date()
        });
        return true;
      }
    }

    return false;
  };

  const contextValue: SecurityContextType = {
    isSecureConnection: securityState.isSecureConnection,
    hasValidSession: securityState.hasValidSession,
    rateLimitStatus: securityState.rateLimitStatus,
    checkPermission,
    logSecurityEvent,
    validateCSRF
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

// Security HOC for protecting components
export const withSecurity = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string,
  resource?: string
) => {
  return (props: P) => {
    const { checkPermission } = useSecurity();

    if (!checkPermission(requiredPermission, resource)) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this resource.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};
