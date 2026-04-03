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

/**
 * Persistent audio toggle button (fixed bottom-left).
 * Syncs with the event-driven audioController — no internal <audio> element.
 */
export function AudioToggle() {
    const [playing, setPlaying] = useState(false);
    const [showConsent, setShowConsent] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Sync state whenever the audio controller dispatches a change
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

        // Sync initial state
        setPlaying(isPlaying());

        return () => {
            window.removeEventListener(STATE_EVENT, handleStateChange);
            window.removeEventListener(AUTOPLAY_FAILED_EVENT, handleAutoplayFailed);
        };
    }, []);

    const handleToggle = () => {
        init(); // Ensure audio element exists
        toggle();
    };

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

    return (
        <>
            <button
                onClick={handleToggle}
                className="fixed top-6 left-6 z-[100] w-12 h-12 rounded-full flex items-center justify-center bg-black border border-white/20 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-black/90 active:scale-95 cursor-pointer"
                aria-label={playing ? 'Mute audio' : 'Play audio'}
            >
                {playing ? (
                    // Music Note On SVG
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
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                    </svg>
                ) : (
                    // Music Note Muted SVG
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
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                        <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="1.8" />
                    </svg>
                )}
            </button>

            {/* Consent Popup */}
            {showConsent && (
                <div className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-[100] bg-white dark:bg-stone-900 border border-border shadow-2xl rounded-2xl p-5 max-w-xs animate-in slide-in-from-bottom-5 fade-in duration-500">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-700 dark:text-stone-300">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">Ambient Experience</h4>
                            <p className="text-xs text-stone-500 dark:text-stone-400">Would you like to play background music while you browse?</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleConsent(true)} className="flex-1 px-4 py-2 bg-black text-white dark:bg-white dark:text-black text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors">
                            Play Music
                        </button>
                        <button onClick={() => handleConsent(false)} className="flex-1 px-4 py-2 bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-transparent hover:border-border text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors">
                            Stay Quiet
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
