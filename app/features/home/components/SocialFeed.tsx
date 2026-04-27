import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { ReelFullScreen, ReelATCButton } from './ReelFullScreen';

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

/* ── tag SVG (reused in badge + label) ── */
const TagIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7A1.5 1.5 0 0 1 4 5.5 1.5 1.5 0 0 1 5.5 4 1.5 1.5 0 0 1 7 5.5 1.5 1.5 0 0 1 5.5 7z" />
  </svg>
);

/* ── helpers ── */
function getClientX(e: TouchEvent | MouseEvent): number {
  if ('touches' in e) return e.touches[0]?.clientX ?? 0;
  return e.clientX;
}

/* ── scroller wrapper with disappearing buttons ── */
function ProductPillScroller({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 5);
    setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
  }, []);

  useEffect(() => {
    checkScroll();
    // small delay to allow images to render and calculate width
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, children]);

  // Prevent internal scrolling from bubbling up to the main reel slider
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const stopPropagation = (e: Event) => e.stopPropagation();

    // Native event listeners are required here because the parent reel uses native listeners
    el.addEventListener('touchstart', stopPropagation, { passive: false });
    el.addEventListener('touchmove', stopPropagation, { passive: false });
    el.addEventListener('mousedown', stopPropagation);

    return () => {
      el.removeEventListener('touchstart', stopPropagation);
      el.removeEventListener('touchmove', stopPropagation);
      el.removeEventListener('mousedown', stopPropagation);
    };
  }, []);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full group/scroller">
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="
          bg-black/1 dark:bg-black/40
          border border-white/30 dark:border-white/10
          rounded-full
          px-1.5 py-1.5
          w-full
          flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth
        "
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      {showLeft && (
        <button
          onClick={(e) => { e.stopPropagation(); scrollBy(-150); }}
          className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white border border-border rounded-full flex items-center justify-center shadow-md z-10 opacity-0 md:group-hover/scroller:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {showRight && (
        <button
          onClick={(e) => { e.stopPropagation(); scrollBy(150); }}
          className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white border border-border rounded-full flex items-center justify-center shadow-md z-10 opacity-0 md:group-hover/scroller:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── active-card video player ── */
function ActiveVideoCard({ src, muted }: { src: string; muted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = muted;
    videoRef.current.play().catch(() => { });
  }, [muted]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.muted = muted;
    videoRef.current.play().catch(() => { });
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
      className="absolute inset-0 w-full h-full object-cover block pointer-events-none"
    />
  );
}

/* ═══════════════════════════════════════════════════════ */
export function SocialFeed({ reels, instagramUrl = 'https://www.instagram.com/deva.sutra/' }: SocialFeedProps) {
  const [activeIndex, setActiveIndex] = useState(() => Math.floor(reels.length / 2));
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const [vw, setVw] = useState(1024);
  const [muted, setMuted] = useState(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startTime: number; moved: boolean } | null>(null);

  /* track viewport width (SSR-safe) */
  useEffect(() => {
    const update = () => setVw(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* navigation */
  const goTo = useCallback(
    (index: number) => {
      const n = reels.length;
      setActiveIndex(((index % n) + n) % n);
    },
    [reels.length],
  );

  /* swipe / drag */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onStart = (e: MouseEvent | TouchEvent) => {
      dragRef.current = { startX: getClientX(e), startTime: Date.now(), moved: false };
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      if (Math.abs(getClientX(e) - dragRef.current.startX) > 8) dragRef.current.moved = true;
    };
    const onEnd = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const { startX, startTime, moved } = dragRef.current;
      dragRef.current = null;
      if (!moved) return;
      const endX = 'changedTouches' in e ? e.changedTouches[0]?.clientX ?? startX : e.clientX;
      const dx = endX - startX;
      const isFlick = Math.abs(dx) > 20 && Date.now() - startTime < 300;
      if (dx < -40 || (isFlick && dx < 0)) goTo(activeIndex + 1);
      else if (dx > 40 || (isFlick && dx > 0)) goTo(activeIndex - 1);
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

  /* card click */
  const handleCardClick = useCallback(
    (index: number) => {
      if (dragRef.current?.moved) return;
      if (index === activeIndex) setSelectedReelIndex(index);
      else goTo(index);
    },
    [activeIndex, goTo],
  );

  /* keyboard */
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

  /* 3-D card transforms (must stay inline — values are dynamic) */
  const getCardStyle = (index: number): React.CSSProperties => {
    const n = reels.length;
    let diff = index - activeIndex;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    const abs = Math.abs(diff);
    const sign = Math.sign(diff);
    const gap = Math.min(vw * 0.35, 300);
    // Cap rotation, depth and scale so far cards don't degenerate into a sliver.
    const rotateY = -sign * Math.min(abs * 18, 60);
    const translateZ = -Math.min(abs * 80, 320);
    const scale = abs === 0 ? 1 : Math.max(0.6, 1 - abs * 0.1);
    // All cards remain visible; opacity fades with distance and the side
    // gradient overlays then blend them into the page background.
    const opacity = abs === 0 ? 1 : Math.max(0.18, 1 - abs * 0.22);
    return {
      transform: `translateX(calc(-50% + ${diff * gap}px)) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex: 100 - abs,
      pointerEvents: (abs <= 1 ? 'auto' : 'none') as React.CSSProperties['pointerEvents'],
      filter: abs === 0 ? 'none' : `brightness(${Math.max(0.55, 1 - abs * 0.08)})`,
      transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.5s ease, filter 0.5s ease',
      willChange: 'transform, opacity',
    };
  };

  return (
    <section className="w-full overflow-hidden py-14 sm:py-16 lg:py-20 select-none">

      {/* ── Header ── */}
      <div className="text-center mb-10 sm:mb-12 px-4">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-2.5">
          Community Highlights
        </p>
        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal text-foreground leading-[1.1]">
          Social Feed
        </h2>
      </div>

      {/* ── Carousel viewport ── */}
      <div
        className="relative w-full overflow-hidden touch-pan-y"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* perspective wrapper */}
        <div
          ref={trackRef}
          className="relative flex items-center justify-center"
          style={{
            height: 'clamp(460px, 80vw, 640px)',
            perspective: '1200px',
            perspectiveOrigin: 'center center',
          }}
        >
          {reels.map((reel, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={reel.id}
                className="absolute left-1/2 overflow-hidden rounded-[20px]"
                style={{
                  width: 'clamp(260px, 45vw, 360px)',
                  aspectRatio: '9/16',
                  ...getCardStyle(index),
                }}
                onClick={() => handleCardClick(index)}
              >
                {/* inner card */}
                <div
                  className={[
                    'relative w-full h-full rounded-[20px] overflow-hidden bg-[#1a1a1a] cursor-pointer',
                    isActive
                      ? 'shadow-[0_20px_60px_rgba(0,0,0,0.30)]'
                      : 'shadow-[0_8px_32px_rgba(0,0,0,0.18)]',
                  ].join(' ')}
                >
                  {/* media */}
                  {isActive ? (
                    <ActiveVideoCard src={reel.videoUrl} muted={muted} />
                  ) : reel.thumbnailUrl ? (
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.caption || reel.influencerName}
                      loading="lazy"
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-cover block pointer-events-none"
                    />
                  ) : (
                    <video
                      src={reel.videoUrl}
                      muted
                      playsInline
                      preload="none"
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-cover block pointer-events-none"
                    />
                  )}

                  {/* gradient overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.55)_100%)] pointer-events-none" />

                  {/* sound toggle — active card only */}
                  {isActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                      aria-label={muted ? 'Unmute' : 'Mute'}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center cursor-pointer z-10 pointer-events-auto transition-colors duration-200"
                    >
                      {muted ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* product pills */}
                  {reel.products && reel.products.length > 0 && (
                    <div 
                      className="absolute bottom-3 left-0 w-full px-2 z-20 pointer-events-auto flex justify-center"
                    >
                      <ProductPillScroller>
                        {reel.products.map((product) => (
                          <div
                            key={product.id}
                            className="
                              group flex items-center justify-between gap-1
                              shrink-0 w-[92%] sm:w-[240px] snap-center
                              px-1.5 py-1.5 rounded-full
                              transition-all duration-200
                              bg-white dark:bg-zinc-900
                              border border-black/5 dark:border-white/10
                              shadow-sm
                            "
                          >
                            <Link 
                              to={`/products/${product.handle}`} 
                              onClick={(e) => e.stopPropagation()} 
                              className="flex items-center gap-2.5 min-w-0 flex-1 px-1"
                            >
                              <div className="relative shrink-0">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.title}
                                    loading="lazy"
                                    className="w-10 h-10 rounded-full object-cover shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-muted" />
                                )}
                              </div>
                              <div className="min-w-0 flex flex-col justify-center">
                                <p className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight tracking-tight">
                                  {product.title}
                                </p>
                                {product.price && (
                                  <p className="text-[11px] font-medium text-[#F14514] mt-[2px] font-montserrat">
                                    {product.price}
                                  </p>
                                )}
                              </div>
                            </Link>
                            
                            <div className="shrink-0" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                              <ReelATCButton product={product} />
                            </div>
                          </div>
                        ))}
                      </ProductPillScroller>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* ── Pagination ── */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 mt-10 sm:mt-12 px-4 relative z-10">
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Previous slide"
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-border bg-card text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors duration-200 shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          role="tablist"
          aria-label="Reel pagination"
          className="flex items-center gap-1.5 sm:gap-2 max-w-[50vw] sm:max-w-[420px] overflow-x-auto no-scrollbar py-1"
        >
          {reels.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className="group/dot relative flex items-center justify-center p-2 -m-2 cursor-pointer shrink-0"
              >
                <span
                  className={[
                    'block h-[5px] rounded-full',
                    'transition-[width,background-color,opacity] duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
                    isActive
                      ? 'w-8 bg-foreground'
                      : 'w-[5px] bg-foreground/20 group-hover/dot:bg-foreground/55',
                  ].join(' ')}
                />
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-baseline font-mono text-[11px] tracking-[0.18em] tabular-nums shrink-0 select-none">
          <span className="text-foreground font-semibold">{String(activeIndex + 1).padStart(2, '0')}</span>
          <span className="text-muted-foreground/40 mx-1.5">/</span>
          <span className="text-muted-foreground">{String(reels.length).padStart(2, '0')}</span>
        </div>

        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Next slide"
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-border bg-card text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors duration-200 shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ── Instagram CTA ── */}
      <div className="flex justify-center mt-8 px-4">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-border bg-card text-foreground text-[11px] font-semibold tracking-[0.18em] uppercase transition-all duration-200 hover:bg-foreground hover:text-background hover:border-foreground"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          Follow on Instagram
        </a>
      </div>

      {/* ── Fullscreen overlay ── */}
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
