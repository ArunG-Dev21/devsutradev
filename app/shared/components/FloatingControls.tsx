import { useEffect, useRef, useState } from 'react';
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

      {/* Audio Consent — swipe-to-unlock pill */}
      {showConsent && (
        <AudioConsentSlider
          onAccept={() => handleConsent(true)}
          onSkip={() => handleConsent(false)}
        />
      )}
    </>
  );
}

// ─── Swipe-to-unlock audio consent ───────────────────────────────────────────

const THUMB = 48;
const PAD   = 6;

type NoteParticle = { id: number; x: number; type: 0 | 1 | 2; delay: number };

function AudioConsentSlider({ onAccept, onSkip }: { onAccept: () => void; onSkip: () => void }) {
  const trackRef   = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX]     = useState(0);
  const [dragging, setDragging]   = useState(false);
  const [done, setDone]           = useState(false);
  const [notes, setNotes]         = useState<NoteParticle[]>([]);
  const noteId   = useRef(0);
  const pStart   = useRef(0);
  const xStart   = useRef(0);

  const maxDrag = () => Math.max(0, (trackRef.current?.offsetWidth ?? 300) - THUMB - PAD * 2);

  /* Spawn floating note particles */
  useEffect(() => {
    const iv = setInterval(() => {
      setNotes(n => [
        ...n.slice(-6),
        {
          id: ++noteId.current,
          x: 15 + Math.random() * 70,
          type: (noteId.current % 3) as 0 | 1 | 2,
          delay: Math.random() * 0.3,
        },
      ]);
    }, 950);
    return () => clearInterval(iv);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    pStart.current = e.clientX;
    xStart.current = offsetX;
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging || done) return;
    const max  = maxDrag();
    const next = Math.max(0, Math.min(max, xStart.current + (e.clientX - pStart.current)));
    setOffsetX(next);
    if (next >= max * 0.88) {
      setDone(true);
      setOffsetX(max);
      setTimeout(onAccept, 320);
    }
  };

  const onUp = () => {
    if (!done) { setDragging(false); setOffsetX(0); }
  };

  const progress = maxDrag() > 0 ? offsetX / maxDrag() : 0;

  const noteShape = [
    /* single note */
    <path key="a" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />,
    /* double note */
    <>
      <path key="b1" d="M9 3v10.55C8.41 13.21 7.73 13 7 13c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h6V3H9z" />
      <path key="b2" d="M15 3v4h-2V3h2z" />
    </>,
    /* beamed pair */
    <>
      <path key="c1" d="M6 3v10.17c-.5-.11-1-.17-1.5-.17C2.01 13 0 15.01 0 17.5S2.01 22 4.5 22 9 19.99 9 17.5V6h9v7.17c-.5-.11-1-.17-1.5-.17-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5V3H6z" />
    </>,
  ] as const;

  return (
    <div
      className="fixed bottom-20 sm:bottom-12 left-1/2 -translate-x-1/2 z-[999] pointer-events-auto flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-500"
    >
      {/* Outer wrapper — notes float out of here */}
      <div className="relative" style={{ width: 300, paddingTop: 56 }}>

        {/* Floating note particles */}
        {notes.map(n => (
          <span
            key={n.id}
            className="absolute pointer-events-none"
            style={{
              left: `${n.x}%`,
              bottom: 10,
              width: 13,
              height: 13,
              color: `rgba(255,255,255,0.6)`,
              animationName: 'noteFloat',
              animationDuration: '2.2s',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              animationDelay: `${n.delay}s`,
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              {noteShape[n.type]}
            </svg>
          </span>
        ))}

        {/* Pill track */}
        <div
          ref={trackRef}
          className="relative flex items-center rounded-full select-none"
          style={{
            height: 60,
            padding: PAD,
            background: '#000',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 8px 36px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
            style={{
              width: PAD + offsetX + THUMB,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
              transition: dragging ? 'none' : 'width 0.4s',
            }}
          />

          {/* "Swipe for music" label */}
          <span
            className="absolute inset-0 flex items-center justify-center text-[10px] tracking-[0.18em] uppercase pointer-events-none select-none font-medium"
            style={{
              color: 'rgba(255,255,255,0.35)',
              opacity: Math.max(0, 1 - progress * 2),
              transition: dragging ? 'none' : 'opacity 0.3s',
              letterSpacing: '0.18em',
            }}
          >
            Swipe for music
          </span>

          {/* Right target circle */}
          <div
            className="absolute right-[6px] flex items-center justify-center rounded-full"
            style={{
              width: THUMB,
              height: THUMB,
              background: progress > 0.72 ? '#fff' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid rgba(255,255,255,${0.15 + progress * 0.7})`,
              boxShadow: progress > 0.72 ? '0 0 18px rgba(255,255,255,0.3)' : 'none',
              transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
              color: progress > 0.72 ? '#000' : 'rgba(255,255,255,0.3)',
            }}
          >
            {done ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
                <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            )}
          </div>

          {/* Draggable left thumb */}
          <div
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="absolute flex items-center justify-center rounded-full touch-none z-10"
            style={{
              width: THUMB,
              height: THUMB,
              left: PAD + offsetX,
              background: '#fff',
              boxShadow: dragging
                ? '0 4px 22px rgba(255,255,255,0.35), 0 0 0 5px rgba(255,255,255,0.08)'
                : '0 2px 12px rgba(255,255,255,0.15)',
              cursor: done ? 'default' : 'grab',
              transition: dragging ? 'box-shadow 0.1s' : 'left 0.45s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s',
              color: '#000',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="text-[11px] tracking-[0.14em] uppercase cursor-pointer transition-opacity opacity-70 hover:opacity-100"
        style={{ color: '#fff' }}
        type="button"
      >
        skip
      </button>

      <style>{`
        @keyframes noteFloat {
          0%   { transform: translateY(0)    scale(1);   opacity: 0.8; }
          40%  { opacity: 0.6; }
          100% { transform: translateY(-62px) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}