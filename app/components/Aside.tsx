import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

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
  const { type: activeType, close } = useAside();
  const expanded = type === activeType;

  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            close();
          }
        },
        { signal: abortController.signal },
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal
      className={`overlay fixed inset-0 z-[100] transition-opacity duration-400 ease-in-out ${expanded ? 'expanded opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'}`}
      role="dialog"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity border-0 p-0"
        onClick={close}
        aria-label="Close dialog"
      />

      {/* Aside Panel */}
      <aside
        className={`absolute top-0 right-0 w-[min(400px,100vw)] h-[100dvh] bg-card text-card-foreground shadow-2xl flex flex-col transition-transform duration-300 ease-out ${expanded ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-center justify-between h-14 px-5 border-b border-border/40 shrink-0">
          <h3 className="m-0 text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            {heading}
          </h3>
          <button
            className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 bg-transparent border-none cursor-pointer"
            onClick={close}
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

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
