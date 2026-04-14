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

const MAX_VISIBLE = 1;
const AUTO_DISMISS_MS = 4500;
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
    }, 500);
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
            }, 500);
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

      {/* ───── Centered Notification ───── */}
      {notifications.length > 0 && (
        <div
          aria-live="polite"
          className="fixed inset-0 z-[110000] flex items-center justify-center pointer-events-none"
        >
          <div className="flex flex-col items-center gap-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`pointer-events-auto relative overflow-hidden rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] ${
                  notif.exiting ? 'cart-notif-exit' : 'cart-notif-enter'
                }`}
                style={{
                  width: 'min(420px, calc(100vw - 2rem))',
                  background: '#0d0d0d',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Content */}
                <div className="px-5 pt-5 pb-4 flex items-start gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-[84px] h-[84px] rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                    {notif.image ? (
                      <img
                        src={notif.image.url}
                        alt={notif.image.altText || notif.title}
                        width={84}
                        height={84}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth={1.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Text column */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {/* "Added to Cart" label with check */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                        Added to Cart
                      </span>
                    </div>

                    {/* Product title */}
                    <p className="line-clamp-2 mb-3.5" style={{ color: '#fff', fontWeight: 500, fontSize: 15, lineHeight: 1.35 }}>
                      {notif.title}
                    </p>

                    {/* View bag CTA */}
                    <button
                      type="button"
                      onClick={() => handleViewCart(notif.id)}
                      className="inline-flex items-center gap-2 cursor-pointer active:scale-95 group"
                      style={{
                        padding: '7px 16px',
                        borderRadius: '99px',
                        background: '#fff',
                        color: '#000',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        transition: 'background 0.2s',
                        border: 'none',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e5e5e5'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                      aria-label="View cart"
                    >
                      View Bag
                      <svg className="group-hover:translate-x-0.5 transition-transform" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => dismiss(notif.id)}
                    className="flex-shrink-0 flex items-center justify-center cursor-pointer transition-all"
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                    aria-label="Dismiss"
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="h-[2px] mx-5 mb-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full origin-left rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.55)',
                      animation: `notifProgress ${AUTO_DISMISS_MS}ms linear forwards`,
                      animationDelay: notif.exiting ? '99999s' : '0ms',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
