import { useState, useRef, useEffect, useCallback } from 'react';
import { ReelFullScreen } from './ReelFullScreen';

export interface SocialReel {
  id: string;
  videoUrl: string;
  influencerName: string;
  creatorHandle: string;
  caption: string;
  thumbnailUrl?: string | null;
  viewCount?: string;
  products: {
    id: string;
    handle: string;
    title: string;
    image: string;
    price: string | null;
    variantId?: string | null;
    availableForSale?: boolean;
  }[];
  customerName: string;
  customerAvatar?: string;
  productHandle?: string | null;
  productTitle?: string | null;
  productImage?: string | null;
  productPrice?: string | null;
}

interface SocialFeedProps {
  reels: SocialReel[];
}

/* ───────────────────────── styles ───────────────────────── */
const css = `
  .sf-section {
    width: 100%;
    overflow: hidden;
    padding: 60px 0 80px;
    background-color: #f5f2ed;
    user-select: none;
  }

  .sf-header {
    text-align: center;
    margin-bottom: 48px;
  }

  .sf-subtitle {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #9a8c7e;
    margin: 0 0 10px;
  }

  .sf-title {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 400;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.1;
  }

  /* ── track wrapper ── */
  .sf-viewport {
    position: relative;
    width: 100%;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    touch-action: pan-y;
  }

  .sf-track {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    height: clamp(400px, 65vw, 580px);
    perspective: 1200px;
    perspective-origin: center center;
  }

  /* ── individual card ── */
  .sf-card-wrap {
    position: absolute;
    left: 50%;
    width: clamp(200px, 42vw, 300px);
    aspect-ratio: 9 / 16;
    transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                opacity 0.5s ease,
                filter 0.5s ease;
    will-change: transform, opacity;
    border-radius: 20px;
    overflow: hidden;
  }

  .sf-card {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 20px;
    overflow: hidden;
    background: #1a1a1a;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    cursor: pointer;
  }

  .sf-card-wrap.is-active .sf-card {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .sf-card video,
  .sf-card img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  .sf-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 50%,
      rgba(0, 0, 0, 0.55) 100%
    );
    pointer-events: none;
  }

  /* ── product badge ── */
  .sf-badge {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(30, 30, 30, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    padding: 6px 14px;
    border-radius: 999px;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.12);
    pointer-events: none;
  }

  .sf-badge-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  /* ── pagination dots ── */
  .sf-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 32px;
  }

  .sf-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #9a8c7e;
    opacity: 0.4;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .sf-dot.is-active {
    width: 20px;
    background: #1a1a1a;
    opacity: 1;
  }
`;

/* ───────────────── helpers ───────────────── */
function getClientX(e: TouchEvent | MouseEvent): number {
  if ('touches' in e) return e.touches[0]?.clientX ?? 0;
  return e.clientX;
}

/* ───────────────────────── component ───────────────────────── */
export function SocialFeed({ reels }: SocialFeedProps) {
  const [activeIndex, setActiveIndex] = useState(() => Math.floor(reels.length / 2));
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const [vw, setVw] = useState(1024);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startTime: number; moved: boolean } | null>(null);

  // Inject styles
  useEffect(() => {
    const id = 'sf-carousel-styles';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // Track viewport width (SSR-safe)
  useEffect(() => {
    const update = () => setVw(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* ── navigation ── */
  const goTo = useCallback(
    (index: number) => {
      const n = reels.length;
      setActiveIndex(((index % n) + n) % n);
    },
    [reels.length],
  );

  /* ── swipe via mouse/touch on the track ── */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onStart = (e: MouseEvent | TouchEvent) => {
      dragRef.current = { startX: getClientX(e), startTime: Date.now(), moved: false };
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const dx = getClientX(e) - dragRef.current.startX;
      if (Math.abs(dx) > 8) dragRef.current.moved = true;
    };

    const onEnd = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const { startX, startTime, moved } = dragRef.current;
      dragRef.current = null;
      if (!moved) return; // was a tap, not a drag — let onClick handle it

      const endX = 'changedTouches' in e ? e.changedTouches[0]?.clientX ?? startX : e.clientX;
      const dx = endX - startX;
      const elapsed = Date.now() - startTime;
      const threshold = 40;
      const isFlick = Math.abs(dx) > 20 && elapsed < 300;

      if (dx < -threshold || (isFlick && dx < 0)) {
        goTo(activeIndex + 1);
      } else if (dx > threshold || (isFlick && dx > 0)) {
        goTo(activeIndex - 1);
      }
    };

    el.addEventListener('mousedown', onStart);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseup', onEnd);
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);

    return () => {
      el.removeEventListener('mousedown', onStart);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseup', onEnd);
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [activeIndex, goTo]);

  /* ── card click — completely separate from drag ── */
  const handleCardClick = useCallback(
    (index: number) => {
      // If drag just happened, dragRef is already null but moved was set.
      // Since onEnd returns early for taps (moved=false), onClick only fires for taps.
      // But we also need to block clicks after a drag. Use a simple check:
      if (dragRef.current?.moved) return;

      if (index === activeIndex) {
        setSelectedReelIndex(index);
      } else {
        goTo(index);
      }
    },
    [activeIndex, goTo],
  );

  /* ── keyboard ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(activeIndex + 1);
      if (e.key === 'ArrowLeft') goTo(activeIndex - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, goTo]);

  if (!reels || reels.length === 0) return null;

  /* ── compute transforms ── */
  const getCardStyle = (index: number): React.CSSProperties => {
    const n = reels.length;
    let diff = index - activeIndex;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;

    const absDiff = Math.abs(diff);

    const cardGap = Math.min(vw * 0.22, 220);
    const translateX = diff * cardGap;
    const translateZ = -absDiff * 80;
    const rotateY = -diff * 18;
    const scale = absDiff === 0 ? 1 : Math.max(0.75, 1 - absDiff * 0.1);
    const opacity = absDiff <= 3 ? Math.max(0.3, 1 - absDiff * 0.25) : 0;
    const zIndex = 10 - absDiff;

    return {
      transform: `translateX(calc(-50% + ${translateX}px)) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      pointerEvents: absDiff <= 4 ? 'auto' : 'none',
      filter: absDiff === 0 ? 'none' : `brightness(${1 - absDiff * 0.08})`,
    } as React.CSSProperties;
  };

  return (
    <section className="sf-section">
      <div className="sf-header">
        <p className="sf-subtitle">Community Highlights</p>
        <h2 className="sf-title">Social Feed</h2>
      </div>

      <div className="sf-viewport">
        <div className="sf-track" ref={trackRef}>
          {reels.map((reel, index) => {
            const diff = Math.abs(index - activeIndex);
            return (
              <div
                key={reel.id}
                className={`sf-card-wrap${index === activeIndex ? ' is-active' : ''}`}
                style={getCardStyle(index)}
                onClick={() => handleCardClick(index)}
              >
                <div className="sf-card">
                  {reel.thumbnailUrl ? (
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.caption || reel.influencerName}
                      loading={diff <= 2 ? 'eager' : 'lazy'}
                      draggable={false}
                    />
                  ) : (
                    <video
                      src={reel.videoUrl}
                      muted
                      playsInline
                      loop
                      autoPlay={false}
                      draggable={false}
                    />
                  )}

                  <div className="sf-card-overlay" />

                  {reel.products && reel.products.length > 0 && (
                    <div className="sf-badge">
                      <svg className="sf-badge-icon" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                      <span>
                        {reel.products.length}{' '}
                        {reel.products.length === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="sf-dots">
        {reels.map((_, i) => (
          <button
            key={i}
            className={`sf-dot${i === activeIndex ? ' is-active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {selectedReelIndex !== null && (
        <ReelFullScreen
          reels={reels}
          initialIndex={selectedReelIndex}
          onClose={() => setSelectedReelIndex(null)}
        />
      )}
    </section>
  );
}