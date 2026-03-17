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

export function CartNotificationProvider({ children }: { children: ReactNode }) {

  const [visible, setVisible] = useState(false);
  const [productTitle, setProductTitle] = useState<string | undefined>();
  const [productImage, setProductImage] = useState<{ url: string; altText?: string | null } | undefined>();
  const timerRef = useRef<number | null>(null);
  const { open: openAside } = useAside();

  // Helper to get latest product name from cart DOM if available
  function getFallbackProductTitle() {
    try {
      // Try to find the first cart line item title in the DOM (works for most Hydrogen carts)
      const el = document.querySelector('[data-cart-line-title]');
      if (el && el.textContent) return el.textContent.trim();
    } catch {}
    return undefined;
  }

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const showNotification = useCallback((title?: string, image?: { url: string; altText?: string | null }) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);

    let finalTitle = title;
    if (!finalTitle || finalTitle === 'Product') {
      finalTitle = getFallbackProductTitle() || 'Product';
    }
    setProductTitle(finalTitle);
    setProductImage(image);
    setVisible(true);

    timerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, 5000);
  }, []);

  const handleViewCart = useCallback(() => {
    dismiss();
    openAside("cart");
  }, [dismiss, openAside]);

  /* Escape key dismiss */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dismiss]);

  /* Cleanup timers */
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <CartNotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed top-3 right-2 left-2 sm:left-auto sm:right-6 z-[200]
        transition-all duration-300 ease-out
        ${
          visible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-2 opacity-0 pointer-events-none"
        }`}
        style={{
          filter: visible
            ? "drop-shadow(0 10px 30px rgba(0,0,0,0.15))"
            : undefined,
          maxWidth: "100vw",
        }}
      >
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-3 rounded-full bg-white/95 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200 dark:border-stone-700 shadow-xl w-full max-w-[520px]">

          {/* Success icon or Product Image */}
          {productImage ? (
            <div className="flex-shrink-0 w-8 h-8 rounded-md overflow-hidden bg-stone-100 dark:bg-stone-800">
              <img src={productImage.url} alt={productImage.altText || productTitle || 'Product'} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4 text-green-600"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Text */}
          <div
            onClick={handleViewCart}
            className="flex flex-col min-w-0 flex-1 cursor-pointer justify-center"
          >
            <span className="font-semibold text-stone-900 dark:text-white text-sm leading-tight">
              Added to cart
            </span>
            {productTitle && (
              <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5 max-w-[200px] sm:max-w-xs">
                {productTitle}
              </span>
            )}
          </div>

          {/* View cart */}
          <button
            type="button"
            onClick={handleViewCart}
            className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-stone-900 dark:bg-white text-white dark:text-black hover:scale-105 transition"
          >
            View
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={dismiss}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            aria-label="Dismiss notification"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

        </div>
      </div>
    </CartNotificationContext.Provider>
  );
}

export function useCartNotification() {
  const ctx = useContext(CartNotificationContext);

  if (!ctx) {
    throw new Error(
      "useCartNotification must be used within a CartNotificationProvider"
    );
  }

  return ctx;
}