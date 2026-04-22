import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useAside } from "~/shared/components/Aside";

type CartNotificationContextValue = {
  showNotification: (productTitle?: string, productImage?: { url: string; altText?: string | null }) => void;
};

const CartNotificationContext =
  createContext<CartNotificationContextValue | null>(null);

type NotificationItem = {
  id: string;
  title: string;
  image?: { url: string; altText?: string | null };
  exiting: boolean;
};

const AUTO_DISMISS_MS = 4500;
const EXIT_DURATION_MS = 320;
const MAX_VISIBLE = 5;

export function CartNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const { open } = useAside();

  const clearTimerForId = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    clearTimerForId(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, [clearTimerForId]);

  const startExit = useCallback((id: string) => {
    clearTimerForId(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, exiting: true } : n))
    );
    const exitTimer = setTimeout(() => removeNotification(id), EXIT_DURATION_MS);
    timersRef.current.set(`exit-${id}`, exitTimer);
  }, [clearTimerForId, removeNotification]);

  const dismiss = useCallback((id: string) => {
    startExit(id);
  }, [startExit]);

  const showNotification = useCallback(
    (title?: string, image?: { url: string; altText?: string | null }) => {
      if (image?.url && typeof window !== 'undefined') {
        const preload = new window.Image();
        preload.src = image.url;
      }

      const id = Math.random().toString(36).slice(2, 9);
      const item: NotificationItem = {
        id,
        title: title || 'Product',
        image,
        exiting: false,
      };

      setNotifications((prev) => {
        // If we've hit the max visible, remove the oldest (bottom)
        const next = [...prev, item];
        if (next.length > MAX_VISIBLE) {
          const removed = next.shift();
          if (removed) clearTimerForId(removed.id);
        }
        return next;
      });

      // Schedule auto-dismiss
      const timer = setTimeout(() => startExit(id), AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [startExit, clearTimerForId]
  );

  const handleViewCart = useCallback((id: string) => {
    dismiss(id);
    open('cart');
  }, [dismiss, open]);

  // Escape key dismisses all
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifications((prev) => prev.map((n) => ({ ...n, exiting: true })));
        setTimeout(() => setNotifications([]), EXIT_DURATION_MS);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  return (
    <CartNotificationContext.Provider value={{ showNotification }}>
      {children}

      {notifications.length > 0 && (
        <div
          aria-live="polite"
          className="fixed top-4 right-3 sm:right-4 z-110000 flex flex-col-reverse items-end gap-3 pointer-events-none"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
        >
          {notifications.map((notif, index) => (
            <div
              key={notif.id}
              className={`pointer-events-auto w-[min(380px,calc(100vw-1.5rem))] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)] bg-white/98 dark:bg-card border border-stone-200/80 dark:border-border ${
                notif.exiting ? 'cart-notif-exit' : 'cart-notif-enter'
              }`}
              style={{
                transformOrigin: 'top right',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2.5 border-b border-stone-100 dark:border-border/70">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-green-500 shrink-0">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-[12px] font-medium tracking-widest text-black dark:text-white">
                    Added to Bag
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(notif.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full cursor-pointer transition-colors bg-stone-100 dark:bg-muted hover:bg-stone-200 dark:hover:bg-muted/80 text-stone-400 dark:text-muted-foreground hover:text-stone-700 dark:hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="flex items-center gap-3.5 px-3 py-3">
                <div className="shrink-0 w-[68px] h-[68px] rounded-lg overflow-hidden bg-stone-50 dark:bg-muted border border-stone-100 dark:border-border">
                  {notif.image ? (
                    <img
                      src={notif.image.url}
                      alt={notif.image.altText || notif.title}
                      width={68}
                      height={68}
                      loading="eager"
                      decoding="sync"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src="/icons/add-bag.png" alt="" className="w-6 h-6 opacity-20 dark:invert" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold leading-snug line-clamp-2 text-stone-900 dark:text-white mb-2.5">
                    {notif.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleViewCart(notif.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[9px] font-bold tracking-[0.16em] uppercase cursor-pointer transition-all duration-150 active:scale-95 bg-stone-900 text-white hover:bg-stone-700 dark:bg-foreground dark:text-background dark:hover:opacity-90"
                  >
                    View Bag
                    <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-[2px] bg-stone-100 dark:bg-border">
                <div
                  key={notif.id}
                  className="h-full origin-left bg-stone-700 dark:bg-white/40"
                  style={{
                    animation: `notifProgress ${AUTO_DISMISS_MS}ms linear forwards`,
                    animationDelay: notif.exiting ? '99999s' : '0ms',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </CartNotificationContext.Provider>
  );
}

export function useCartNotification() {
  const ctx = useContext(CartNotificationContext);
  if (!ctx) {
    // Return a silent fallback so components outside the provider don't crash
    return { showNotification: () => {} } as CartNotificationContextValue;
  }
  return ctx;
}
