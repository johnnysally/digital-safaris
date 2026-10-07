import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  toasts: Toast[];
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4000;

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-success/30 bg-success/10 text-success",
  error: "border-danger/30 bg-danger/10 text-danger",
  info: "border-info/30 bg-info/10 text-info",
  warning: "border-warning/30 bg-warning/10 text-warning",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: Toast = {
        id,
        variant,
        message,
        description,
        duration: DEFAULT_DURATION,
      };
      setToasts((prev) => [...prev, toast]);
      timers.current[id] = window.setTimeout(
        () => dismiss(id),
        DEFAULT_DURATION
      );
    },
    [dismiss]
  );

  const success = useCallback(
    (m: string, d?: string) => push("success", m, d),
    [push]
  );
  const error = useCallback(
    (m: string, d?: string) => push("error", m, d),
    [push]
  );
  const info = useCallback((m: string, d?: string) => push("info", m, d), [push]);
  const warning = useCallback(
    (m: string, d?: string) => push("warning", m, d),
    [push]
  );

  const clear = useCallback(() => {
    Object.values(timers.current).forEach((t) => window.clearTimeout(t));
    timers.current = {};
    setToasts([]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, success, error, info, warning, dismiss, clear }),
    [toasts, success, error, info, warning, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-lg border p-3 shadow-sm ${VARIANT_STYLES[t.variant]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.message}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-xs opacity-70 hover:opacity-100"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export default ToastContext;