import React, {
  createContext, useContext, useState, ReactNode,
  useCallback, useEffect, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

/* ─── Provider ─── */
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const remove = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const show = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `n-${Date.now()}-${Math.random()}`;
    const duration = notification.duration ?? 3000;
    setNotifications(prev => {
      // On mobile keep only 1 toast at a time; desktop max 3
      const isMobile = window.innerWidth < 768;
      const max = isMobile ? 1 : 3;
      const trimmed = prev.length >= max ? prev.slice(prev.length - max + 1) : prev;
      return [...trimmed, { ...notification, id, duration }];
    });
    setTimeout(() => remove(id), duration);
  }, [remove]);

  const showSuccess = useCallback((title: string, message?: string) => show({ type: 'success', title, message }), [show]);
  const showError   = useCallback((title: string, message?: string) => show({ type: 'error',   title, message }), [show]);
  const showWarning = useCallback((title: string, message?: string) => show({ type: 'warning', title, message }), [show]);
  const showInfo    = useCallback((title: string, message?: string) => show({ type: 'info',    title, message }), [show]);

  return (
    <NotificationContext.Provider value={{ showNotification: show, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {createPortal(<ToastStack notifications={notifications} onRemove={remove} />, document.body)}
    </NotificationContext.Provider>
  );
};

/* ─── Stack container ─── */
const ToastStack: React.FC<{ notifications: Notification[]; onRemove: (id: string) => void }> = ({
  notifications, onRemove,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? '80px' : 'auto',
        top: isMobile ? 'auto' : '100px',
        // Mobile: anchor left edge at 50% then pull back half the container width
        left: isMobile ? '50%' : 'auto',
        right: isMobile ? 'auto' : '20px',
        transform: isMobile ? 'translateX(-50%)' : 'none',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        pointerEvents: 'none',
        // Fixed container width on mobile so translateX(-50%) always lands dead-center
        width: isMobile ? 'max-content' : '340px',
        maxWidth: isMobile ? 'calc(100vw - 32px)' : '340px',
      }}
    >
      {notifications.map(n => (
        <Toast key={n.id} notification={n} onRemove={onRemove} isMobile={isMobile} />
      ))}
    </div>
  );
};

/* ─── Type config ─── */
const TYPE_CONFIG = {
  success: { icon: CheckCircle, dot: '#22c55e', label: 'Success' },
  error:   { icon: AlertCircle,  dot: '#ef4444', label: 'Error'   },
  warning: { icon: AlertTriangle,dot: '#f59e0b', label: 'Warning' },
  info:    { icon: Info,         dot: '#3b82f6', label: 'Info'    },
};

/* ─── Individual Toast ─── */
const Toast: React.FC<{ notification: Notification; onRemove: (id: string) => void; isMobile: boolean }> = ({
  notification, onRemove, isMobile,
}) => {
  const { id, type, title, message } = notification;
  const { icon: Icon, dot } = TYPE_CONFIG[type];

  // Touch-to-dismiss: swipe up or tap
  const touchStartY = useRef<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(id), 250);
  }, [id, onRemove]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 20) dismiss(); // swipe down ≥ 20px → dismiss
    touchStartY.current = null;
  };

  if (isMobile) {
    /* ── iOS pill style ── */
    return (
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={dismiss}
        style={{
          pointerEvents: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(28, 28, 30, 0.93)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '9999px',
          padding: message ? '10px 16px 10px 12px' : '9px 16px 9px 12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          animation: leaving ? 'toastOut 0.25s ease-in forwards' : 'toastUp 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards',
          whiteSpace: 'nowrap',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {/* Colored dot */}
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', lineHeight: 1.3 }}>
            {title}
          </span>
          {message && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.3, marginTop: '1px' }}>
              {message}
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── Desktop card style ── */
  return (
    <div
      onClick={dismiss}
      style={{
        pointerEvents: 'auto',
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        backgroundColor: '#1c1c1e',
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        cursor: 'pointer',
        userSelect: 'none',
        animation: leaving ? 'toastOutRight 0.25s ease-in forwards' : 'toastRight 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards',
        borderLeft: `3px solid ${dot}`,
      }}
    >
      <Icon style={{ width: 16, height: 16, color: dot, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', margin: 0, lineHeight: 1.4 }}>{title}</p>
        {message && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', margin: '2px 0 0', lineHeight: 1.4 }}>{message}</p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{ flexShrink: 0, background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        aria-label="Dismiss"
      >
        <X style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.4)' }} />
      </button>

    </div>
  );
};
