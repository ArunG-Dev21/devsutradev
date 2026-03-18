import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useAside } from "~/components/Aside";

type CartNotificationContextValue = {
  showNotification: (productTitle?: string, productImage?: { url: string; altText?: string | null }) => void;
};

const CartNotificationContext =
  createContext<CartNotificationContextValue | undefined>(undefined);
const fallbackCartNotificationContext: CartNotificationContextValue = {
  showNotification: () => {},
};
let hasWarnedMissingCartNotificationProvider = false;

type NotificationItem = {
  id: string;
  title: string;
  image?: { url: string; altText?: string | null };
  exiting?: boolean;
};

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 4000;
const STAGGER_MS = 300;

export function CartNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const queueRef = useRef<NotificationItem[]>([]);
  const processingRef = useRef(false);
  const { open: openAside } = useAside();

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, exiting: true } : n))
    );
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 400);
  }, []);

  /* Process queued notifications one at a time with stagger */
  const processQueue = useCallback(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    const flush = () => {
      const next = queueRef.current.shift();
      if (!next) {
        processingRef.current = false;
        return;
      }

      setNotifications((prev) => {
        // If already at max, mark the oldest for exit first
        if (prev.filter((n) => !n.exiting).length >= MAX_VISIBLE) {
          const oldest = prev.find((n) => !n.exiting);
          if (oldest) {
            setTimeout(() => {
              setNotifications((p) => p.filter((n) => n.id !== oldest.id));
            }, 400);
            return [...prev.map((n) => n.id === oldest.id ? { ...n, exiting: true } : n), next];
          }
        }
        return [...prev, next];
      });

      // Auto-dismiss this notification
      setTimeout(() => dismiss(next.id), AUTO_DISMISS_MS);
      // Process next in queue after stagger
      setTimeout(flush, STAGGER_MS);
    };

    flush();
  }, [dismiss]);

  const showNotification = useCallback(
    (title?: string, image?: { url: string; altText?: string | null }) => {
      const finalTitle = title && title !== "Product" ? title : "Product";
      const id = Math.random().toString(36).substring(2, 9);
      queueRef.current.push({ id, title: finalTitle, image });
      processQueue();
    },
    [processQueue]
  );

  const handleViewCart = useCallback(
    (id: string) => {
      dismiss(id);
      openAside("cart");
    },
    [dismiss, openAside]
  );

  /* Escape key dismiss all */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        queueRef.current = [];
        setNotifications([]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <CartNotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* ───── Notification Stack ───── */}
      <div
        aria-live="polite"
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none"
        style={{ width: 'min(340px, calc(100vw - 1.5rem))' }}
      >
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)] w-full ${
              notif.exiting ? 'cart-notif-exit' : 'cart-notif-enter'
            }`}
          >
            {/* Content */}
            <div className="flex items-center gap-3.5 p-2">
              {/* Product Image */}
              <div className="flex-shrink-0 w-[60px] h-[60px] sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-800/80">
                {notif.image ? (
                  <img
                    src={notif.image.url}
                    alt={notif.image.altText || notif.title}
                    width={64}
                    height={64}
                    sizes="(min-width: 640px) 64px, 60px"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300 dark:text-neutral-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Text — product name first, badge below */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] sm:text-base font-bold text-neutral-900 dark:text-white leading-snug truncate">
                  {notif.title}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Added to cart
                </span>
              </div>

              {/* Arrow button */}
              <button
                type="button"
                onClick={() => handleViewCart(notif.id)}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-neutral-900 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label="View cart"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-[3px] w-full bg-emerald-100 dark:bg-emerald-500/10">
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-400 origin-left rounded-full"
                style={{
                  animation: `notifProgress ${AUTO_DISMISS_MS}ms linear forwards`,
                  animationDelay: notif.exiting ? '99999s' : '0ms',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes cartNotifEnter {
          0% { opacity: 0; transform: translateY(-16px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cartNotifExit {
          0% { opacity: 1; transform: translateX(0); max-height: 120px; margin-bottom: 10px; }
          100% { opacity: 0; transform: translateX(100%); max-height: 0; margin-bottom: 0; padding: 0; border-width: 0; overflow: hidden; }
        }
        .cart-notif-enter {
          animation: cartNotifEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .cart-notif-exit {
          animation: cartNotifExit 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        @keyframes notifProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </CartNotificationContext.Provider>
  );
}

export function useCartNotification() {
  const ctx = useContext(CartNotificationContext);

  if (!ctx) {
    if (import.meta.env.DEV && !hasWarnedMissingCartNotificationProvider) {
      hasWarnedMissingCartNotificationProvider = true;
      console.warn(
        'useCartNotification was rendered without a CartNotificationProvider; notifications will be skipped for this render.'
      );
    }
    return fallbackCartNotificationContext;
  }

  return ctx;
}
