import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
  dismiss: () => void;
};
const fallbackAsideContext: AsideContextValue = {
  type: 'closed',
  open: () => {},
  close: () => {},
  dismiss: () => {},
};
let hasWarnedMissingAsideProvider = false;

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const { type: activeType, dismiss } = useAside();
  const expanded = type === activeType;

  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            dismiss();
          }
        },
        { signal: abortController.signal },
      );
    }
    return () => abortController.abort();
  }, [dismiss, expanded]);

  const isLeft = type === 'mobile';
  const positionClasses = isLeft ? 'left-0' : 'right-0';
  const hiddenClasses = isLeft ? '-translate-x-full' : 'translate-x-full';
  
  // Make the width < 100vw on mobile so the backdrop is comfortably clickable
  const widthClass = isLeft ? 'w-full' : 'w-full sm:w-[400px]';

  return (
    <div
      aria-modal
      className={`overlay fixed inset-0 z-100 transition-opacity duration-400 ease-in-out ${expanded ? 'expanded opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'}`}
      role="dialog"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity border-0 p-0 cursor-pointer"
        onClick={dismiss}
        aria-label="Close dialog"
      />

      {/* Aside Panel */}
      <aside
        className={`absolute top-0 ${positionClasses} ${widthClass} h-dvh bg-card text-card-foreground shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${expanded ? 'translate-x-0' : hiddenClasses}`}
      >
        <header className="flex items-center justify-between h-14 px-5 border-b border-border/40 shrink-0">
          <h3 className="m-0 text-lg font-medium tracking-[0.2em] uppercase text-black">
            {heading}
          </h3>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full text-black border cursor-pointer hover:bg-muted transition-colors"
            onClick={dismiss}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-card flex flex-col m-0">
          {children}
        </main>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({ children }: { children: ReactNode }) {
  const [type, setType] = useState<AsideType>('closed');
  const mobileHistoryEntryActiveRef = useRef(false);

  const open = useCallback((mode: AsideType) => {
    if (
      mode === 'mobile' &&
      typeof window !== 'undefined' &&
      !mobileHistoryEntryActiveRef.current
    ) {
      const currentState =
        window.history.state && typeof window.history.state === 'object'
          ? window.history.state
          : {};

      window.history.pushState(
        {...currentState, __asideMobileMenu: true},
        '',
      );
      mobileHistoryEntryActiveRef.current = true;
    }

    setType(mode);
  }, []);

  const close = useCallback(() => {
    if (type === 'mobile') {
      mobileHistoryEntryActiveRef.current = false;
    }
    setType('closed');
  }, [type]);

  const dismiss = useCallback(() => {
    if (
      type === 'mobile' &&
      typeof window !== 'undefined' &&
      mobileHistoryEntryActiveRef.current
    ) {
      window.history.back();
      return;
    }

    setType('closed');
  }, [type]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      if (!mobileHistoryEntryActiveRef.current) return;

      mobileHistoryEntryActiveRef.current = false;
      setType((currentType) =>
        currentType === 'mobile' ? 'closed' : currentType,
      );
    };

    window.addEventListener('popstate', handlePopState);
    
    // Swipe Gestures
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return; // ignore multi-touch
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Only respond if horizontal movement is dominant enough (0.8 threshold for natural thumb arcs) and > 30px
      if (Math.abs(diffX) > Math.abs(diffY) * 0.8 && Math.abs(diffX) > 30) {
        if (diffX > 0) {
          // Swiped Right
          if (type === 'cart') {
            dismiss(); // Slide cart out to the right
          } else if (type === 'closed' && startX < 60) {
            open('mobile'); // Edge swipe right from left edge = open menu
          }
        } else {
          // Swiped Left
          if (type === 'mobile') {
            dismiss(); // Slide menu out to the left
          }
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [type, open, dismiss]);

  return (
    <AsideContext.Provider
      value={{
        type,
        open,
        close,
        dismiss,
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    if (import.meta.env.DEV && !hasWarnedMissingAsideProvider) {
      hasWarnedMissingAsideProvider = true;
      console.warn(
        'useAside was rendered without an Aside.Provider; aside interactions will be skipped for this render.',
      );
    }
    return fallbackAsideContext;
  }
  return aside;
}
