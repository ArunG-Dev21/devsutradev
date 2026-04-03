import { useEffect, useState } from 'react';
import {
  init,
  toggle,
  fadeIn,
  isPlaying,
  getPreference,
  STATE_EVENT,
  AUTOPLAY_FAILED_EVENT,
} from '~/lib/audioController';
import { useTheme } from '~/context/theme';

export function FloatingControls() {
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  const { toggle: toggleTheme } = useTheme();

  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStateChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPlaying(detail?.playing ?? false);
    };

    const handleAutoplayFailed = () => {
      setShowConsent(true);
    };

    window.addEventListener(STATE_EVENT, handleStateChange);
    window.addEventListener(AUTOPLAY_FAILED_EVENT, handleAutoplayFailed);

    const pref = getPreference();
    if (pref === 'unmuted') {
      init();
      fadeIn(1500);
    } else {
      setShowConsent(true);
    }

    setPlaying(isPlaying());

    return () => {
      window.removeEventListener(STATE_EVENT, handleStateChange);
      window.removeEventListener(AUTOPLAY_FAILED_EVENT, handleAutoplayFailed);
    };
  }, []);

  const handleConsent = (accept: boolean) => {
    setShowConsent(false);
    if (accept) {
      init();
      fadeIn(1500);
      localStorage.setItem('devotion-audio-pref', 'unmuted');
    } else {
      localStorage.setItem('devotion-audio-pref', 'muted');
    }
  };

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
    <>
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
          </svg>
        </button>
      </div>

      {/* Ultra-compact Aesthetic Consent Modal */}
      {showConsent && (
        <div 
          id="audio-consent-modal"
          className="fixed bottom-20 sm:bottom-12 left-1/2 -translate-x-1/2 z-[999] w-auto pointer-events-auto"
        >
          <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md text-stone-900 dark:text-stone-100 rounded-[28px] py-3.5 px-4 flex items-center gap-4 border border-stone-200/50 dark:border-stone-800/50 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-800 dark:text-stone-200">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <span className="text-[11px] font-medium tracking-tight whitespace-nowrap pr-1">Audio Experience?</span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleConsent(true)} 
                className="w-9 h-9 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full flex items-center justify-center hover:bg-stone-800 dark:hover:bg-white transition-all transform active:scale-90 shadow-sm"
                aria-label="Enable"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button 
                onClick={() => handleConsent(false)} 
                className="w-9 h-9 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200/40 dark:border-stone-700/40 rounded-full flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer active:scale-90"
                aria-label="Skip"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}