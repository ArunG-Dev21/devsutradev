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

      {/* Organic Audio Consent */}
      {showConsent && (
        <div
          id="audio-consent-modal"
          className="fixed bottom-20 sm:bottom-12 left-1/2 -translate-x-1/2 z-[999] w-auto pointer-events-auto"
        >
          <div
            className="relative overflow-hidden flex items-center gap-3.5 py-3 px-3.5 animate-in slide-in-from-bottom-3 fade-in duration-500"
            style={{
              borderRadius: '22px',
              background: 'linear-gradient(135deg, rgba(255,253,248,0.97) 0%, rgba(250,246,238,0.97) 100%)',
              border: '1px solid rgba(180,150,100,0.18)',
              boxShadow: '0 8px 32px -4px rgba(90,60,20,0.13), 0 2px 8px -2px rgba(120,80,30,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            {/* Warm inner shimmer */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 20% 50%, rgba(200,150,60,0.06) 0%, transparent 65%)',
                borderRadius: 'inherit',
              }}
            />

            {/* Icon with pulse */}
            <div className="relative shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #f5ede0, #ede3d4)',
                  border: '1px solid rgba(160,120,70,0.18)',
                  boxShadow: '0 2px 6px rgba(120,80,30,0.12)',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#7a5c30' }}>
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              {/* Subtle pulse ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: '1.5px solid rgba(160,120,70,0.25)',
                  animation: 'audioPulse 2.4s ease-in-out infinite',
                }}
              />
            </div>

            {/* Label */}
            <span
              className="text-[11px] whitespace-nowrap select-none"
              style={{
                color: '#5c4020',
                fontWeight: 500,
                letterSpacing: '0.01em',
              }}
            >
              Audio Experience?
            </span>

            {/* Divider */}
            <div style={{ width: '1px', height: '20px', background: 'rgba(160,120,70,0.2)', borderRadius: '1px', flexShrink: 0 }} />

            {/* Buttons */}
            <div className="flex gap-2 relative z-[1]">
              <button
                onClick={() => handleConsent(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                style={{
                  background: 'linear-gradient(145deg, #2d2010, #1a1208)',
                  color: '#e8d5b0',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 2px 8px rgba(40,25,5,0.35)',
                }}
                aria-label="Enable audio"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(145deg, #3d2d18, #241a0c)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(145deg, #2d2010, #1a1208)'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                onClick={() => handleConsent(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                style={{
                  background: 'rgba(160,130,90,0.1)',
                  color: '#8a7055',
                  border: '1px solid rgba(160,120,70,0.18)',
                }}
                aria-label="Skip audio"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(160,130,90,0.18)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(160,130,90,0.1)'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <style>{`
            @keyframes audioPulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.35); opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}