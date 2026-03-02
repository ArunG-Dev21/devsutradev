import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { init, unlock } from '~/lib/audioController';

const OVERLAY_BG = '/overlay-bg.jpeg';
const SESSION_KEY = 'devasutra-overlay-shown';

/**
 * Cinematic full-screen intro overlay shown once per session.
 *
 * - Only appears on the homepage (/)
 * - Uses sessionStorage so it's shown at most once per browser session
 * - Mobile: circle clip-path shrink exit
 * - Desktop: 5 vertical columns slide alternately up/down
 * - Audio: unlocks + fades in on enter click
 */
export function LandingOverlay() {
    const [show, setShow] = useState(false);
    const [exiting, setExiting] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Only show on the homepage
        const isHomepage =
            location.pathname === '/' ||
            location.pathname.match(/^\/[a-z]{2}-[a-z]{2}\/?$/i); // e.g. /en-us

        if (!isHomepage) return;

        // Only show once per session
        if (sessionStorage.getItem(SESSION_KEY)) return;

        setShow(true);
    }, [location.pathname]);

    const handleEnter = () => {
        // Unlock audio directly in the click handler (browser trusts this as a user gesture)
        init();
        unlock();

        // Mark as shown so it won't appear again this session
        sessionStorage.setItem(SESSION_KEY, '1');

        setExiting(true);

        // Dispatch custom event — other components (AudioToggle) listen for this
        window.dispatchEvent(new CustomEvent('devotion-enter'));

        // Remove overlay after animations complete
        setTimeout(() => {
            setShow(false);
        }, 1500);
    };

    if (!show) return null;

    return (
        <div
            id="intro-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100dvh',
                minHeight: '100vh',
                zIndex: 9999,
                isolation: 'isolate',
                overflow: 'hidden',
                touchAction: 'none',
                overscrollBehavior: 'none',
                backgroundColor: '#000',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to Devasutra"
        >
            {/* ── Mobile: Single full-screen panel with circular clip-path exit ── */}
            <div
                aria-hidden="true"
                className="absolute inset-0 md:hidden pointer-events-none"
            >
                <div
                    className="absolute inset-0 transition-all duration-1200"
                    style={{
                        backgroundImage: `url('${OVERLAY_BG}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        clipPath: exiting
                            ? 'circle(0% at 50% 85%)'
                            : 'circle(150% at 50% 85%)',
                        transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)',
                        willChange: 'clip-path',
                    }}
                />
            </div>

            {/* ── Desktop: 5 vertical image-sliced columns ── */}
            <div
                aria-hidden="true"
                className="absolute inset-0 hidden md:grid md:grid-cols-5 pointer-events-none"
            >
                {[0, 1, 2, 3, 4].map((index) => (
                    <div
                        key={index}
                        className="relative overflow-hidden transition-transform duration-1200"
                        style={{
                            transform: exiting
                                ? index % 2 === 0
                                    ? 'translateY(-100%)'
                                    : 'translateY(100%)'
                                : 'translateY(0)',
                            transitionDelay: `${index * 60}ms`,
                            transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)',
                            willChange: 'transform',
                        }}
                    >
                        <div
                            className="absolute top-0 left-0"
                            style={{
                                width: '100vw',
                                height: '100dvh',
                                minHeight: '100vh',
                                backgroundImage: `url('${OVERLAY_BG}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                transform: `translateX(-${index * 20}vw)`,
                                willChange: 'transform',
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* ── Content layer ── */}
            <div
                className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ${exiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                    }`}
            >
                {/* Logo at top center */}
                <div className="absolute top-10 sm:top-14 md:top-20 left-1/2 -translate-x-1/2 px-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <img
                        src="/logo-new.png"
                        alt="Devasutra"
                        className="w-[50vw] sm:w-[42vw] md:w-[35vw] lg:w-[28vw] max-w-lg h-auto object-contain drop-shadow-2xl"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </div>

                {/* Enter Button at bottom center */}
                <div className="absolute bottom-24 sm:bottom-28 md:bottom-20 left-1/2 -translate-x-1/2 text-center px-4 w-full max-w-md">
                    <button
                        onClick={handleEnter}
                        className="group relative overflow-hidden px-8 sm:px-12 py-3.5 sm:py-5 rounded-full transition-all duration-700 cursor-pointer animate-pulse-slow w-full sm:w-auto"
                        style={{
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: 'rgba(255, 255, 255, 0.95)',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(24px)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                                'rgba(255, 255, 255, 0.4)';
                            e.currentTarget.style.backgroundColor =
                                'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow =
                                '0 16px 48px rgba(0, 0, 0, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                                'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.backgroundColor =
                                'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow =
                                '0 8px 32px rgba(0, 0, 0, 0.2)';
                        }}
                    >
                        {/* Shimmer effect on hover */}
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                            style={{
                                background:
                                    'linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)',
                                transform: 'translateX(-100%)',
                                animation: 'shimmer 2.5s infinite linear',
                            }}
                        />
                        <div className="relative flex items-center justify-center gap-3 sm:gap-4">
                            {/* Button text */}
                            <span className="text-xs sm:text-[13px] font-medium tracking-[0.3em] sm:tracking-[0.4em] uppercase animate-text-reveal">
                                VISIT STORE
                            </span>
                            {/* Animated arrow */}
                            <svg
                                className="w-4 h-4 sm:w-5 sm:h-5 text-accent animate-bounce-slow"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                />
                            </svg>
                        </div>
                    </button>

                    {/* Subtle hint text */}
                    <p
                        className="text-white/40 text-[9px] sm:text-[11px] mt-4 sm:mt-6 tracking-[0.2em] uppercase animate-fade-in"
                        style={{ animationDelay: '1000ms', animationFillMode: 'both' }}
                    >
                        Click to continue
                    </p>
                </div>
            </div>
        </div>
    );
}
