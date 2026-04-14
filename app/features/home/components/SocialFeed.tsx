import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
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
    variants?: Array<{ id: string; availableForSale: boolean; title: string }>;
  }[];
  customerName: string;
  customerAvatar?: string;
  productHandle?: string | null;
  productTitle?: string | null;
  productImage?: string | null;
  productPrice?: string | null;
  instagramUrl?: string | null;
}

interface SocialFeedProps {
  reels: SocialReel[];
  instagramUrl?: string;
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

  /* ── sound toggle ── */
  .sf-sound-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    pointer-events: auto;
    transition: background 0.2s;
  }

  .sf-sound-btn:hover {
    background: rgba(0,0,0,0.7);
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

  /* ── tagged products strip ── */
  .sf-tagged-products {
    margin-top: 20px;
    padding: 0 16px;
  }

  .sf-tagged-products-inner {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .sf-tagged-products-inner::-webkit-scrollbar { display: none; }

  .sf-product-card {
    flex-shrink: 0;
    width: 120px;
    border-radius: 14px;
    overflow: hidden;
    background: #fff;
    border: 1px solid rgba(0,0,0,0.08);
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .sf-product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  }

  .sf-product-img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
  }

  .sf-product-info {
    padding: 8px;
  }

  .sf-product-name {
    font-size: 11px;
    font-weight: 500;
    color: #1a1a1a;
    line-height: 1.3;
    margin: 0 0 3px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .sf-product-price {
    font-size: 11px;
    font-weight: 600;
    color: #555;
    margin: 0;
  }

  /* ── instagram cta ── */
  .sf-instagram-cta {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }
`;

/* ───────────────── helpers ───────────────── */
function getClientX(e: TouchEvent | MouseEvent): number {
  if ('touches' in e) return e.touches[0]?.clientX ?? 0;
  return e.clientX;
}

/* ── Active card video player ── */
function ActiveVideoCard({ src, muted }: { src: string; muted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = muted;
    videoRef.current.play().catch(() => {});
  }, [muted]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.muted = muted;
    videoRef.current.play().catch(() => {});
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <video
      ref={videoRef}
      src={src}
      loop
      playsInline
      muted={muted}
      autoPlay
      draggable={false}
    />
  );
}

/* ───────────────────────── component ───────────────────────── */
export function SocialFeed({ reels, instagramUrl = 'https://www.instagram.com/devasutra/' }: SocialFeedProps) {
  const [activeIndex, setActiveIndex] = useState(() => Math.floor(reels.length / 2));
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const [vw, setVw] = useState(1024);
  const [muted, setMuted] = useState(true);

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
      if (!moved) return;

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

  /* ── card click ── */
  const handleCardClick = useCallback(
    (index: number) => {
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

  const activeReel = reels[activeIndex];

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
            const isActive = index === activeIndex;
            return (
              <div
                key={reel.id}
                className={`sf-card-wrap${isActive ? ' is-active' : ''}`}
                style={getCardStyle(index)}
                onClick={() => handleCardClick(index)}
              >
                <div className="sf-card">
                  {isActive ? (
                    /* Active card: autoplay video muted */
                    <ActiveVideoCard src={reel.videoUrl} muted={muted} />
                  ) : reel.thumbnailUrl ? (
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.caption || reel.influencerName}
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <video
                      src={reel.videoUrl}
                      muted
                      playsInline
                      draggable={false}
                    />
                  )}

                  <div className="sf-card-overlay" />

                  {/* Sound toggle — only on active card */}
                  {isActive && (
                    <button
                      className="sf-sound-btn"
                      onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                      aria-label={muted ? 'Unmute' : 'Mute'}
                    >
                      {muted ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      )}
                    </button>
                  )}

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

      {/* Tagged products strip for active reel */}
      {activeReel?.products && activeReel.products.length > 0 && (
        <div className="sf-tagged-products">
          <div className="sf-tagged-products-inner">
            {activeReel.products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.handle}`}
                className="sf-product-card"
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="sf-product-img"
                    loading="lazy"
                  />
                )}
                <div className="sf-product-info">
                  <p className="sf-product-name">{product.title}</p>
                  {product.price && (
                    <p className="sf-product-price">{product.price}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Instagram CTA */}
      <div className="sf-instagram-cta">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-[#1a1a1a]/20 bg-white text-[#1a1a1a] text-[11px] font-semibold tracking-[0.18em] uppercase transition-all duration-200 hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a]"
          style={{ fontFamily: "'Helvetica Neue', Helvetica, sans-serif" }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          Follow on Instagram
        </a>
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
