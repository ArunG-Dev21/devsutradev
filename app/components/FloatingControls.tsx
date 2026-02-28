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

/**
 * Floating controls pill — fixed bottom-left, always visible.
 * Contains: Audio toggle + Theme toggle.
 */
export function FloatingControls() {
    const [playing, setPlaying] = useState(false);
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

    const handleAudioToggle = () => {
        init();
        toggle();
    };

    return (
        <div
            className="
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
        flex items-center gap-2
      "
        >
            {/* Audio toggle */}
            <button
                onClick={handleAudioToggle}
                className="
          w-11 h-11
          rounded-full
          flex items-center justify-center
          bg-foreground text-background
          shadow-lg
          transition-all duration-300
          hover:scale-110
          active:scale-95
          cursor-pointer
        "
                aria-label={playing ? 'Mute audio' : 'Play audio'}
            >
                {playing ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4.5 h-4.5"
                    >
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <path d="M15 9.5a3.5 3.5 0 010 5" />
                        <path d="M17.5 7a6.5 6.5 0 010 10" />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4.5 h-4.5"
                    >
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                )}
            </button>

            {/* Theme toggle */}
            <button
                onClick={toggleTheme}
                className="
          w-11 h-11
          rounded-full
          flex items-center justify-center
          bg-foreground text-background
          shadow-lg
          transition-all duration-300
          hover:scale-110
          active:scale-95
          cursor-pointer
        "
                aria-label="Toggle dark mode"
            >
                {/* Moon — shown in light mode */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="block w-4.5 h-4.5 dark:hidden"
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
                </svg>

                {/* Sun — shown in dark mode */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="hidden w-4.5 h-4.5 dark:block"
                >
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
    );
}
