import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastOptions {
  /** Body text of the toast. */
  message: string;
  variant?: ToastVariant;
  /**
   * Auto-dismiss timing in milliseconds. Default:
   *  - info / success: 5000ms
   *  - warning / danger: null (sticky — user must dismiss manually since
   *    errors deserve acknowledgement, not silent dismissal)
   * Pass a number to override, or null to force sticky.
   */
  durationMs?: number | null;
  /** Optional bold heading rendered above the message. */
  title?: string;
}

interface ToastEntry {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number | null;
  title?: string;
}

export interface ToastApi {
  /**
   * Add a toast. Returns its id so callers can dismiss it manually.
   * Accepts either a ToastOptions object or a bare string (treated as an
   * info toast with the default duration).
   */
  push: (opts: ToastOptions | string) => string;
  /** Manually dismiss a toast. */
  dismiss: (id: string) => void;
  /** Dismiss all toasts. */
  clear: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Hook to access the toast API. Throws if used outside <ToastProvider>.
 *
 * Usage:
 * ```
 *   const toast = useToast();
 *   toast.push('Enlace copiado al portapapeles');
 *   toast.push({ variant: 'danger', message: 'Error al guardar' });
 * ```
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

const DEFAULT_MS_FOR_INFO_SUCCESS = 5000;
const DEFAULT_MS_FOR_WARNING_DANGER = null;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((all) => all.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((opts: ToastOptions | string): string => {
    const normalized: ToastOptions = typeof opts === 'string' ? { message: opts } : opts;
    const variant = normalized.variant ?? 'info';
    const durationMs =
      normalized.durationMs ??
      (variant === 'warning' || variant === 'danger'
        ? DEFAULT_MS_FOR_WARNING_DANGER
        : DEFAULT_MS_FOR_INFO_SUCCESS);
    const id = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((all) => [...all, { id, message: normalized.message, variant, durationMs, title: normalized.title }]);
    if (durationMs != null) {
      const handle = setTimeout(() => dismiss(id), durationMs);
      timers.current.set(id, handle);
    }
    return id;
  }, [dismiss]);

  const clear = useCallback(() => {
    setToasts([]);
    timers.current.forEach((handle) => clearTimeout(handle));
    timers.current.clear();
  }, []);

  const api = useMemo<ToastApi>(() => ({ push, dismiss, clear }), [push, dismiss, clear]);

  useEffect(() => () => {
    timers.current.forEach((handle) => clearTimeout(handle));
    timers.current.clear();
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastEntry[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return createPortal(
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>,
    document.body,
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastEntry; onDismiss: () => void }) {
  const role = toast.variant === 'danger' || toast.variant === 'warning' ? 'alert' : 'status';
  return (
    <div className={`toast toast--${toast.variant}`} role={role}>
      <div className="toast__content">
        {toast.title && <p className="toast__title">{toast.title}</p>}
        <p className="toast__message">{toast.message}</p>
      </div>
      <button
        type="button"
        className="toast__dismiss"
        aria-label="Cerrar notificación"
        onClick={onDismiss}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
