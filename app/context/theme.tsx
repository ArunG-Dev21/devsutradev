import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';
const SYSTEM_MEDIA_QUERY = '(prefers-color-scheme: dark)';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isHydrated: boolean;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  return preference === 'system' ? systemTheme : preference;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(SYSTEM_MEDIA_QUERY).matches ? 'dark' : 'light';
}

function applyResolvedThemeToDocument(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

function readStoredPreference(storageKey: string): ThemePreference | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return null;
    return isThemePreference(value) ? value : null;
  } catch {
    return null;
  }
}

function persistPreference(storageKey: string, preference: ThemePreference) {
  try {
    window.localStorage.setItem(storageKey, preference);
  } catch {
    // Ignore storage write failures (private mode, blocked storage, etc.)
  }
}

export function getThemeInitScript(storageKey = THEME_STORAGE_KEY) {
  const key = JSON.stringify(storageKey);

  // Keeps logic in sync with ThemeProvider:
  // - If localStorage has "light"|"dark"|"system", use it.
  // - Otherwise default to "system".
  // - "system" resolves via prefers-color-scheme.
  // - Apply via <html class="dark"> class strategy + color-scheme.
  return `(() => {
  try {
    const storageKey = ${key};
    const root = document.documentElement;
    const stored = localStorage.getItem(storageKey);
    const pref = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    const system = window.matchMedia && window.matchMedia(${JSON.stringify(
      SYSTEM_MEDIA_QUERY,
    )}).matches ? 'dark' : 'light';
    const resolved = pref === 'system' ? system : pref;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  } catch (e) {}
})();`;
}

export function ThemeScript({ nonce }: { nonce?: string }) {
  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: getThemeInitScript() }}
    />
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const resolvedTheme = useMemo(
    () => resolveTheme(preference, systemTheme),
    [preference, systemTheme],
  );

  useEffect(() => {
    setIsHydrated(true);
    if (typeof window === 'undefined') return;

    const stored = readStoredPreference(THEME_STORAGE_KEY);
    if (stored) setPreference(stored);

    const media = window.matchMedia?.(SYSTEM_MEDIA_QUERY);
    const updateFromMedia = () => setSystemTheme(media?.matches ? 'dark' : 'light');
    updateFromMedia();

    setIsInitialized(true);

    if (!media) return;

    const onChange = () => updateFromMedia();
    if (media.addEventListener) {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }

    // Safari < 14
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (!isInitialized || typeof document === 'undefined') return;
    applyResolvedThemeToDocument(resolvedTheme);
    persistPreference(THEME_STORAGE_KEY, preference);
  }, [isInitialized, preference, resolvedTheme]);

  const toggle = useCallback(() => {
    if (typeof document !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setPreference(isDark ? 'light' : 'dark');
      return;
    }

    setPreference((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value: ThemeContextValue = useMemo(
    () => ({
      preference,
      resolvedTheme,
      isHydrated,
      setPreference,
      toggle,
    }),
    [isHydrated, preference, resolvedTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
