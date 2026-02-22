import { useEffect, useState } from 'react';
import {
    init,
    toggle,
    fadeIn,
    isPlaying,
    getPreference,
    STATE_EVENT,
} from '~/lib/audioController';

/**
 * Persistent audio toggle button (fixed bottom-left).
 * Syncs with the event-driven audioController — no internal <audio> element.
 */
export function AudioToggle() {
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Sync state whenever the audio controller dispatches a change
        const handleStateChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setPlaying(detail?.playing ?? false);
        };

        window.addEventListener(STATE_EVENT, handleStateChange);

        // After overlay dismissal, start the audio fade-in
        const handleDevotionEnter = () => {
            // Small delay so the overlay exit animation feels natural
            setTimeout(() => {
                init();
                fadeIn(2500);
            }, 600);
        };

        window.addEventListener('devotion-enter', handleDevotionEnter);

        // If user already dismissed the overlay (e.g. navigated away and back),
        // restore audio based on saved preference
        const pref = getPreference();
        if (pref === 'unmuted') {
            init();
            fadeIn(1500);
        }

        // Sync initial state
        setPlaying(isPlaying());

        return () => {
            window.removeEventListener(STATE_EVENT, handleStateChange);
            window.removeEventListener('devotion-enter', handleDevotionEnter);
        };
    }, []);

    const handleToggle = () => {
        init(); // Ensure audio element exists
        toggle();
    };

    return (
        <button
  onClick={handleToggle}
className="
  fixed top-6 left-6 z-[100]
  w-12 h-12
  rounded-full
  flex items-center justify-center
  bg-black
  border border-white/20
  shadow-lg
  transition-all duration-300
  hover:scale-110
  hover:bg-black/90
  active:scale-95
  cursor-pointer
"
  aria-label={playing ? 'Mute audio' : 'Play audio'}
>
  {playing ? (
    // Speaker On SVG
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15 9.5a3.5 3.5 0 010 5" />
      <path d="M17.5 7a6.5 6.5 0 010 10" />
    </svg>
  ) : (
    // Speaker Muted SVG
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )}
</button>
    );
}
