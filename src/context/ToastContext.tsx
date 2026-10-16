import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const toast: Toast = { id, type, title, message, duration };
    setToasts(prev => [toast, ...prev].slice(0, 5));
    if (duration > 0) {
      const timer = setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, timer);
    }
  }, [dismissToast]);

  const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast('error', title, message, 6000), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast('warning', title, message, 5000), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ─── Toast Container UI ──────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, { bar: string; icon: string; border: string; bg: string }> = {
  success: { bar: 'bg-emerald-500', icon: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/20' },
  error:   { bar: 'bg-rose-500',    icon: 'text-rose-400',    border: 'border-rose-500/40',    bg: 'bg-rose-950/20'    },
  warning: { bar: 'bg-amber-500',   icon: 'text-amber-400',   border: 'border-amber-500/40',   bg: 'bg-amber-950/20'   },
  info:    { bar: 'bg-cyan-500',    icon: 'text-cyan-400',    border: 'border-cyan-500/40',    bg: 'bg-cyan-950/20'    }
};

const ToastIconMap: Record<ToastType, React.FC<{ className?: string }>> = {
  success: ({ className }) => <CheckCircle2 className={className} />,
  error:   ({ className }) => <XCircle className={className} />,
  warning: ({ className }) => <AlertTriangle className={className} />,
  info:    ({ className }) => <Info className={className} />
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none"
    >
      {toasts.map(toast => {
        const styles = TOAST_STYLES[toast.type];
        const Icon = ToastIconMap[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            style={{ animation: 'slideInFromRight 0.3s cubic-bezier(0.16,1,0.3,1) forwards' }}
            className={`pointer-events-auto relative flex items-start gap-3 rounded-2xl p-4
              border ${styles.border} ${styles.bg}
              backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.bar}`} />
            <div className={`mt-0.5 shrink-0 ${styles.icon}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-slate-500 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
