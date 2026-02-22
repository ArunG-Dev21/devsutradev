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
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={close}
      />

      {/* Aside Panel */}
      <aside
        className={`absolute top-0 right-0 w-[min(420px,100vw)] h-[100dvh] bg-white text-stone-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${expanded ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-center justify-between h-16 px-6 border-b border-stone-100 shrink-0">
          <h3 className="m-0 text-[0.75rem] font-semibold tracking-[0.15em] uppercase">
            {heading}
          </h3>
          <button
            className="p-2 -mr-2 text-stone-400 hover:text-stone-900 transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center hover:no-underline"
            onClick={close}
            aria-label="Close"
          >
            <span className="text-3xl leading-none font-light">&times;</span>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-white flex flex-col m-0">
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
