import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationInput {
  type: NotificationType;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  dedupeKey?: string;
  durationMs?: number;
}

interface NotificationItem extends NotificationInput {
  id: string;
  createdAt: number;
}

interface NotificationContextValue {
  notify: (input: NotificationInput) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return ctx;
}

const MAX_VISIBLE_TOASTS = 3;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const recentKeysRef = useRef<Map<string, number>>(new Map());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }
    timersRef.current.clear();
    setItems([]);
  }, []);

  const notify = useCallback(
    (input: NotificationInput) => {
      const now = Date.now();
      if (input.dedupeKey) {
        const lastSeen = recentKeysRef.current.get(input.dedupeKey);
        if (lastSeen && now - lastSeen < 4000) {
          return;
        }
        recentKeysRef.current.set(input.dedupeKey, now);
      }

      const id = `toast_${now}_${Math.random().toString(36).slice(2, 7)}`;
      const durationMs =
        input.durationMs ?? (input.type === 'error' ? 7500 : 5500);

      const newItem: NotificationItem = {
        ...input,
        id,
        createdAt: now,
      };

      setItems((prev) => {
        const next = [newItem, ...prev];
        if (next.length > MAX_VISIBLE_TOASTS) {
          const removed = next.slice(MAX_VISIBLE_TOASTS);
          for (const rem of removed) {
            const t = timersRef.current.get(rem.id);
            if (t) {
              clearTimeout(t);
              timersRef.current.delete(rem.id);
            }
          }
          return next.slice(0, MAX_VISIBLE_TOASTS);
        }
        return next;
      });

      if (durationMs > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, durationMs);
        timersRef.current.set(id, timer);
      }
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, dismiss, clearAll }}>
      {children}

      <div
        aria-live="polite"
        aria-label="Powiadomienia aplikacji"
        className="pointer-events-none fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const isError = item.type === 'error';
            const isSuccess = item.type === 'success';
            const Icon = isError
              ? AlertTriangle
              : isSuccess
                ? CheckCircle2
                : Info;

            const containerColors = isError
              ? 'border-rose-200 dark:border-rose-900/70 bg-white dark:bg-slate-900'
              : isSuccess
                ? 'border-emerald-200 dark:border-emerald-900/70 bg-white dark:bg-slate-900'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';

            const iconColor = isError
              ? 'text-rose-600 dark:text-rose-400'
              : isSuccess
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-sky-600 dark:text-sky-400';

            return (
              <motion.div
                key={item.id}
                role={isError ? 'alert' : 'status'}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className={`pointer-events-auto rounded-2xl border p-3.5 shadow-lg ${containerColors}`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </div>
                    {item.message && (
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                        {item.message}
                      </p>
                    )}
                    {item.actionLabel && item.onAction && (
                      <button
                        type="button"
                        onClick={() => {
                          item.onAction?.();
                          dismiss(item.id);
                        }}
                        className="mt-2 min-h-[32px] text-xs font-semibold text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:opacity-80"
                      >
                        {item.actionLabel}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(item.id)}
                    aria-label="Zamknij powiadomienie"
                    className="min-h-[36px] min-w-[36px] -mr-1 -mt-1 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
