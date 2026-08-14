import React, {
  createContext, useContext, useState, ReactNode,
  useCallback, useEffect, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

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
      const isMobile = window.innerWidth < 768;
      const max = isMobile ? 1 : 4; // Max 1 toast on mobile to prevent clutter
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

/* ─── Stack Container ─── */
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
      aria-live="polite"
      className={`fixed z-[99999] flex flex-col gap-2.5 pointer-events-none transition-all ${
        isMobile
          ? 'top-4 left-0 right-0 items-center px-3'
          : 'top-5 right-5 w-80 items-end'
      }`}
    >
      {notifications.map(n => (
        <Toast key={n.id} notification={n} onRemove={onRemove} isMobile={isMobile} />
      ))}
    </div>
  );
};

/* ─── Type Styling Config ─── */
const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    barColor: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    badgeBg: 'bg-red-50 text-red-600 border border-red-100',
    barColor: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    badgeBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    barColor: 'bg-amber-500',
  },
  info: {
    icon: Info,
    badgeBg: 'bg-blue-50 text-blue-600 border border-blue-100',
    barColor: 'bg-blue-500',
  },
};

/* ─── Individual Toast ─── */
const Toast: React.FC<{ notification: Notification; onRemove: (id: string) => void; isMobile: boolean }> = ({
  notification, onRemove, isMobile,
}) => {
  const { id, type, title, message } = notification;
  const { icon: Icon, badgeBg, barColor } = TYPE_CONFIG[type];

  const touchStartY = useRef<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(id), 200);
  }, [id, onRemove]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(delta) > 15) dismiss();
    touchStartY.current = null;
  };

  /* ── Ultra-Minimal Single-Line Pill Toast for Mobile ── */
  if (isMobile) {
    return (
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={dismiss}
        style={{
          animation: leaving ? 'toastOutUp 0.2s ease-in forwards' : 'toastDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        className="pointer-events-auto bg-stone-900/95 text-white border border-stone-800 rounded-full shadow-lg px-4 py-2.5 flex items-center gap-2 max-w-[92vw] mx-auto cursor-pointer select-none backdrop-blur-md active:scale-95 transition-all"
      >
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${
          type === 'success' ? 'text-emerald-400' :
          type === 'error' ? 'text-red-400' :
          type === 'warning' ? 'text-amber-400' : 'text-stone-300'
        }`} />
        
        <span className="text-xs font-medium text-stone-100 truncate max-w-[70vw]">
          {title}{message ? ` · ${message}` : ''}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          className="p-0.5 text-stone-400 hover:text-white rounded-full transition-colors flex-shrink-0 ml-auto cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  /* ── Desktop Toast ── */
  return (
    <div
      onClick={dismiss}
      style={{
        animation: leaving ? 'toastOutRight 0.22s ease-in forwards' : 'toastRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      className="pointer-events-auto w-full bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-2xl shadow-xl shadow-zinc-900/5 p-3.5 flex items-start gap-3 relative overflow-hidden cursor-pointer select-none group transition-all"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />

      {/* Icon Badge */}
      <div className={`p-2 rounded-xl flex-shrink-0 ${badgeBg}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0 pr-4">
        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug tracking-tight">
          {title}
        </h4>
        {message && (
          <p className="text-xs text-zinc-500 font-medium leading-snug mt-0.5 break-words">
            {message}
          </p>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        aria-label="Close notification"
        className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors flex-shrink-0 -mr-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default NotificationProvider;
