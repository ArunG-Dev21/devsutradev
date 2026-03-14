import { useEffect, useState } from 'react';
import {
  init,
  toggle,
  fadeIn,
  isPlaying,
  getPreference,
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

    const handleDevotionEnter = () => {
      setTimeout(() => {
        init();
        fadeIn(2500);
      }, 600);
    };

    window.addEventListener('devotion-enter', handleDevotionEnter);

    const pref = getPreference();
    if (pref === 'unmuted') {
      init();
      fadeIn(1500);
    }

    setPlaying(isPlaying());

    return () => {
      window.removeEventListener(STATE_EVENT, handleStateChange);
      window.removeEventListener('devotion-enter', handleDevotionEnter);
    };
  }, []);

  /* Scroll visibility logic */
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout;

    const handleScroll = () => {
      setVisible(false);

      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        setVisible(true);
      }, 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleAudioToggle = () => {
    init();
    toggle();
  };

  return (
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
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15 9.5a3.5 3.5 0 010 5" />
            <path d="M17.5 7a6.5 6.5 0 010 10" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
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
        </svg>
      </button>
    </div>
  );
}