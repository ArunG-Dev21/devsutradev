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
    }, 400);
  }, []);

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

      setTimeout(() => dismiss(next.id), AUTO_DISMISS_MS);
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

      {/* ── Top-right toast stack ── */}
      {notifications.length > 0 && (
        <div
          aria-live="polite"
          className="fixed top-4 right-4 z-[110000] flex flex-col items-end gap-2.5 pointer-events-none"
        >
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`pointer-events-auto w-[min(360px,calc(100vw-2rem))] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.22)] overflow-hidden ${
                notif.exiting ? "cart-notif-exit" : "cart-notif-enter"
              }`}
              style={{
                background: "#111",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              {/* Body */}
              <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                {/* Image */}
                <div
                  className="shrink-0 w-14 h-14 rounded-xl overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {notif.image ? (
                    <img
                      src={notif.image.url}
                      alt={notif.image.altText || notif.title}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <img
                        src="/icons/add-bag.png"
                        alt=""
                        className="w-6 h-6 opacity-30 invert"
                      />
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  {/* Label */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ background: "#22c55e" }}
                    >
                      <svg
                        width="7"
                        height="7"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      Added to bag
                    </span>
                  </div>

                  {/* Title */}
                  <p
                    className="line-clamp-2 mb-2.5"
                    style={{
                      color: "#fff",
                      fontWeight: 500,
                      fontSize: 13,
                      lineHeight: 1.4,
                    }}
                  >
                    {notif.title}
                  </p>

                  {/* CTA */}
                  <button
                    type="button"
                    onClick={() => handleViewCart(notif.id)}
                    className="inline-flex items-center gap-1.5 cursor-pointer active:scale-95 group/btn"
                    style={{
                      padding: "5px 12px",
                      borderRadius: 99,
                      background: "#fff",
                      color: "#000",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      border: "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#e5e5e5";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#fff";
                    }}
                    aria-label="View cart"
                  >
                    View Bag
                    <svg
                      className="group-hover/btn:translate-x-0.5 transition-transform"
                      width="10"
                      height="10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </button>
                </div>

                {/* Dismiss */}
                <button
                  type="button"
                  onClick={() => dismiss(notif.id)}
                  className="shrink-0 flex items-center justify-center cursor-pointer transition-all mt-0.5"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.4)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.14)";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.color =
                      "rgba(255,255,255,0.4)";
                  }}
                  aria-label="Dismiss"
                >
                  <svg
                    width="10"
                    height="10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              <div
                className="h-[2px] mx-4 mb-3 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full origin-left rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.4)",
                    animation: `notifProgress ${AUTO_DISMISS_MS}ms linear forwards`,
                    animationDelay: notif.exiting ? "99999s" : "0ms",
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
    if (import.meta.env.DEV && !hasWarnedMissingCartNotificationProvider) {
      hasWarnedMissingCartNotificationProvider = true;
      console.warn(
        "useCartNotification was rendered without a CartNotificationProvider; notifications will be skipped for this render."
      );
    }
    return fallbackCartNotificationContext;
  }

  return ctx;
}
