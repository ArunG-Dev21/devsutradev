import { useEffect, useState, useRef } from 'react';

/**
 * Full-screen Himalaya overlay shown on first visit (per session).
 * On CTA click: plays a devotional chant audio + fades out the overlay.
 */
export function LandingOverlay() {
    const [show, setShow] = useState(false);
    const [fading, setFading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const seen = sessionStorage.getItem('devasutra-overlay-seen');
        if (!seen) {
            setShow(true);
        }
    }, []);

    function handleEnter() {
        // Play audio
        try {
            if (audioRef.current) {
                audioRef.current.volume = 0.4;
                audioRef.current.play().catch(() => { });
            }
        } catch { }

        // Save audio preference
        localStorage.setItem('devasutra-audio', 'on');

        // Start fade-out
        setFading(true);
        sessionStorage.setItem('devasutra-overlay-seen', '1');

        setTimeout(() => {
            setShow(false);
        }, 1500);
    }

    if (!show) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-[1500ms] ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
        >
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80')" }}
            />
            <div className="absolute inset-0 bg-black/50" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6">
                {/* Brand Name */}
                <h1
                    className="text-5xl md:text-7xl font-bold tracking-[0.15em] uppercase mb-4"
                    style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        color: '#FFFFFF',
                        textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                    }}
                >
                    Devasutra
                </h1>
                <p
                    className="text-sm md:text-base tracking-[0.3em] uppercase mb-12"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                    Sacred Ornaments · Divine Energy
                </p>

                {/* CTA Button */}
                <button
                    onClick={handleEnter}
                    className="relative px-10 py-4 text-sm tracking-[0.2em] uppercase border-2 rounded-sm transition-all duration-300 hover:scale-105 cursor-pointer"
                    style={{
                        borderColor: '#C5A355',
                        color: '#C5A355',
                        backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#C5A355';
                        e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#C5A355';
                    }}
                >
                    Enter the Sacred Store →
                </button>
            </div>

            {/* Hidden audio element */}
            <audio ref={audioRef} src="/audio/chant.mp3" preload="none" />
        </div>
    );
}
