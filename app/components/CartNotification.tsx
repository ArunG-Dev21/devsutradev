import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useAside } from '~/components/Aside';

type CartNotificationContextValue = {
  showNotification: (productTitle?: string) => void;
};

const CartNotificationContext =
  createContext<CartNotificationContextValue | null>(null);

export function CartNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [productTitle, setProductTitle] = useState<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { open: openAside } = useAside();

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const showNotification = useCallback(
    (title?: string) => {
      // Clear any existing timer
      if (timerRef.current) clearTimeout(timerRef.current);
      setProductTitle(title);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, 5000);
    },
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleViewCart = useCallback(() => {
    dismiss();
    openAside('cart');
  }, [dismiss, openAside]);

  return (
    <CartNotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Toast notification */}
      <div
        aria-live="polite"
        className={`fixed top-4 right-4 z-[200] transition-all duration-300 ease-out ${
          visible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white dark:bg-card border border-stone-200 dark:border-border rounded-xl shadow-xl px-5 py-4 flex items-center gap-4 min-w-[280px] max-w-[380px]">
          {/* Check icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 text-green-600 dark:text-green-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-900 dark:text-stone-100 m-0">
              Added to cart
            </p>
            {productTitle && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 m-0 truncate">
                {productTitle}
              </p>
            )}
          </div>

          {/* View Cart button */}
          <button
            type="button"
            onClick={handleViewCart}
            className="flex-shrink-0 text-[10px] font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full bg-stone-900 dark:bg-white text-white dark:text-black border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            View Cart
          </button>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={dismiss}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-transparent border-none cursor-pointer transition-colors"
            aria-label="Dismiss notification"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
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
      'useCartNotification must be used within a CartNotificationProvider',
    );
  }
  return ctx;
}
