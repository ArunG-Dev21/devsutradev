import { useEffect, useRef, useState } from 'react';

const AUDIO_SRC = '/audio/chant.mp3';

/**
 * Persistent audio toggle button (fixed bottom-left).
 * Plays /audio/chant.mp3 in a loop. Preference saved in localStorage.
 * Gracefully handles a missing audio file (no errors shown to user).
 */
export function AudioToggle() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [hasAudio, setHasAudio] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const pref = localStorage.getItem('devasutra-audio');
        if (pref === 'on' && audioRef.current) {
            audioRef.current.volume = 0.3;
            audioRef.current
                .play()
                .then(() => setPlaying(true))
                .catch(() => {
                    // Audio file may not exist yet — hide the button silently
                    setHasAudio(false);
                });
        }
    }, []);

    function handleError() {
        // Suppress console errors for missing audio file
        setHasAudio(false);
    }

    function toggle() {
        if (!audioRef.current || !hasAudio) return;
        if (playing) {
            audioRef.current.pause();
            setPlaying(false);
            localStorage.setItem('devasutra-audio', 'off');
        } else {
            audioRef.current.volume = 0.3;
            audioRef.current
                .play()
                .then(() => {
                    setPlaying(true);
                    localStorage.setItem('devasutra-audio', 'on');
                })
                .catch(() => {
                    setHasAudio(false);
                });
        }
    }

    // Don't render the button if audio file doesn't exist
    if (!hasAudio) return null;

    return (
        <>
            <audio
                ref={audioRef}
                src={AUDIO_SRC}
                loop
                preload="none"
                onError={handleError}
            />
            <button
                onClick={toggle}
                className="fixed bottom-6 left-6 z-[100] w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all duration-300 hover:scale-110 shadow-lg cursor-pointer"
                style={{
                    backgroundColor: playing ? '#C5A355' : 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                }}
                title={playing ? 'Mute audio' : 'Play audio'}
                aria-label={playing ? 'Mute audio' : 'Play audio'}
            >
                {playing ? '🔊' : '🔇'}
            </button>
        </>
    );
}
