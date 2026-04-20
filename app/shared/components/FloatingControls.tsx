import { useEffect, useState } from 'react';
import {
  init,
  toggle,
  isPlaying,
  STATE_EVENT,
} from '~/lib/audioController';
import { useTheme } from '~/context/theme';

export function FloatingControls() {
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  const { toggle: toggleTheme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStateChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPlaying(detail?.playing ?? false);
    };

    window.addEventListener(STATE_EVENT, handleStateChange);
    setPlaying(isPlaying());

    return () => {
      window.removeEventListener(STATE_EVENT, handleStateChange);
    };
  }, []);

  /* Scroll visibility logic — collapse while scrolling, restore on idle.
     Use a ref to track the actual visible state so we only flip React state
     on the transitions (1 render to hide, 1 render to show), instead of
     calling setVisible on every wheel tick. */
  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    let visibleRef = true;

    const hide = () => {
      if (visibleRef) {
        visibleRef = false;
        setVisible(false);
      }
    };
    const show = () => {
      if (!visibleRef) {
        visibleRef = true;
        setVisible(true);
      }
    };

    const handleScroll = () => {
      hide();
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(show, 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  const handleAudioToggle = () => {
    init();
    toggle();
  };

  return (
    <>
      <a
        href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20help%20with%20Devasutra"
        target="_blank"
        rel="noopener noreferrer"
        className="
          fixed right-4 md:right-6
          bottom-[calc(4.375rem_+_env(safe-area-inset-bottom)_+_14px)] md:bottom-6
          z-[70]
          w-12 h-12 md:w-13 md:h-13
          rounded-full
          flex items-center justify-center
          bg-[#25D366] text-white
          border border-white/30 shadow-[0_12px_30px_rgba(37,211,102,0.35)]
          transition-transform duration-200
          hover:scale-105 active:scale-95
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background
        "
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>

      <div
        className={`
          fixed top-1/2 right-4 md:right-6 -translate-y-1/2
          z-40
          flex flex-col items-center gap-2.5
          transition-all duration-300 ease-out
          ${visible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}
        `}
      >
        {/* Audio Button */}
        <button
          onClick={handleAudioToggle}
          className="
            w-9 h-9
            rounded-full
            flex items-center justify-center
            bg-card/90 backdrop-blur-md text-foreground
            border border-border shadow-md
            transition-all duration-300
            hover:scale-110 hover:bg-foreground hover:text-background
            active:scale-95
            cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground
          "
          aria-label={playing ? 'Mute audio' : 'Play audio'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
              <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="
            w-9 h-9
            rounded-full
            flex items-center justify-center
            bg-card/90 backdrop-blur-md text-foreground
            border border-border shadow-md
            transition-all duration-300
            hover:scale-110 hover:bg-foreground hover:text-background
            active:scale-95
            cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground
          "
          aria-label="Toggle dark mode"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="block w-4 h-4 dark:hidden">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
          </svg>

          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="hidden w-4 h-4 dark:block">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M4.93 19.07l1.41-1.41" />
            <path d="M17.66 6.34l1.41-1.41" />
          </svg>
        </button>
      </div>

    </>
  );
}
