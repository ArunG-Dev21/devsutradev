import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { CartForm } from '@shopify/hydrogen';
import type { SocialReel } from './SocialFeed';
import { useCartNotification } from '~/features/cart/components/CartNotification';

interface ReelFullScreenProps {
  reels: SocialReel[];
  initialIndex: number;
  onClose: () => void;
}

// ─── Inner button for size pill — proper component so hooks work ─────────────
function ReelSizePillInner({
  fetcher,
  variant,
  productTitle,
  productImage,
  onAdded,
}: {
  fetcher: any;
  variant: { id: string; availableForSale: boolean; title: string };
  productTitle: string;
  productImage?: string;
  onAdded: () => void;
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef<string>('idle');

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage ? { url: productImage } : undefined);
      onAdded();
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle, productImage, onAdded]);

  const isAdding = fetcher.state !== 'idle';

  return (
    <button
      type="submit"
      disabled={!variant.availableForSale || isAdding}
      style={{
        padding: '5px 12px',
        borderRadius: '20px',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        border: `1.5px solid ${isAdding ? '#1a1a1a' : 'rgba(0,0,0,0.22)'}`,
        background: isAdding ? '#1a1a1a' : 'transparent',
        color: !variant.availableForSale ? 'rgba(0,0,0,0.28)' : isAdding ? '#fff' : '#1a1a1a',
        cursor: variant.availableForSale && !isAdding ? 'pointer' : 'not-allowed',
        transition: 'all 0.15s ease',
        textDecoration: !variant.availableForSale ? 'line-through' : 'none',
      }}
      aria-label={`Add size ${variant.title}`}
    >
      {isAdding ? '…' : variant.title}
    </button>
  );
}

// ─── Size pill wrapper (just supplies CartForm + passes fetcher down) ─────────
function ReelSizePill({
  variant,
  productTitle,
  productImage,
  productId,
  onAdded,
}: {
  variant: { id: string; availableForSale: boolean; title: string };
  productTitle: string;
  productImage?: string;
  productId: string;
  onAdded: () => void;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{ lines: [{ merchandiseId: variant.id, quantity: 1, selectedVariant: variant as any }] }}
      fetcherKey={`reel-size-${productId}-${variant.id}`}
    >
      {(fetcher) => (
        <ReelSizePillInner
          fetcher={fetcher}
          variant={variant}
          productTitle={productTitle}
          productImage={productImage}
          onAdded={onAdded}
        />
      )}
    </CartForm>
  );
}

// ─── Inner button for single-variant ATC — proper component so hooks work ────
function ReelATCInner({
  fetcher,
  productTitle,
  productImage,
}: {
  fetcher: any;
  productTitle: string;
  productImage?: string;
}) {
  const { showNotification } = useCartNotification();
  const [justAdded, setJustAdded] = useState(false);
  const prevState = useRef<string>('idle');

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage ? { url: productImage } : undefined);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle, productImage]);

  const isAdding = fetcher.state !== 'idle';

  return (
    <button
      type="submit"
      disabled={isAdding}
      style={{
        width: 36, height: 36, borderRadius: '50%',
        background: '#fff',
        border: '1.5px solid rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: isAdding ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s',
        opacity: isAdding ? 0.7 : 1,
      }}
      onMouseEnter={e => {
        if (!isAdding) {
          (e.currentTarget as HTMLElement).style.background = '#000';
          const img = (e.currentTarget as HTMLElement).querySelector('img');
          if (img) img.style.filter = 'invert(1)';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = '#fff';
        const img = (e.currentTarget as HTMLElement).querySelector('img');
        if (img) img.style.filter = 'none';
      }}
      aria-label={`Add ${productTitle} to bag`}
    >
      {isAdding ? (
        <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#000" strokeOpacity="0.25" strokeWidth="2.5" />
          <path d="M12 3a9 9 0 0 1 9 9" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ) : justAdded ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <img src="/icons/add-bag.png" alt="Add to bag" width="18" height="18" style={{ display: 'block' }} />
      )}
    </button>
  );
}

// ─── Reel ATC Button (single or multi-variant) ───────────────────────────────
export function ReelATCButton({
  product,
}: {
  product: SocialReel['products'][number];
}) {
  const [showSizes, setShowSizes] = useState(false);
  const variants = product.variants ?? [];
  const hasMultiple = variants.length > 1;
  const isAvailable = product.availableForSale !== false;
  const closeSizes = useCallback(() => setShowSizes(false), []);

  if (!product.variantId || !isAvailable) {
    return (
      <button
        disabled
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: '1.5px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'not-allowed', flexShrink: 0,
        }}
        title="Unavailable"
      >
        <img src="/icons/add-bag.png" alt="Unavailable" width="18" height="18" style={{ opacity: 0.25, filter: 'invert(1)' }} />
      </button>
    );
  }

  if (hasMultiple) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        {showSizes && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end', maxWidth: 140 }}>
            {variants.map((v) => (
              <ReelSizePill
                key={v.id}
                variant={v}
                productTitle={product.title}
                productImage={product.image}
                productId={product.id}
                onAdded={closeSizes}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowSizes((s) => !s)}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: showSizes ? '#1a1a1a' : '#fff',
            border: '1.5px solid rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => {
            if (!showSizes) {
              (e.currentTarget as HTMLElement).style.background = '#000';
              const img = (e.currentTarget as HTMLElement).querySelector('img');
              if (img) img.style.filter = 'invert(1)';
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = showSizes ? '#1a1a1a' : '#fff';
            const img = (e.currentTarget as HTMLElement).querySelector('img');
            if (img) img.style.filter = 'none';
          }}
          aria-label={showSizes ? 'Close size picker' : 'Select size'}
        >
          {showSizes ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <img src="/icons/add-bag.png" alt="Select size" width="18" height="18" style={{ display: 'block' }} />
          )}
        </button>
      </div>
    );
  }

  // Single variant — CartForm delegates rendering to ReelATCInner (a real component)
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{ lines: [{ merchandiseId: product.variantId!, quantity: 1, selectedVariant: { id: product.variantId! } as any }] }}
      fetcherKey={`reel-atc-${product.id}`}
    >
      {(fetcher) => (
        <ReelATCInner
          fetcher={fetcher}
          productTitle={product.title}
          productImage={product.image}
        />
      )}
    </CartForm>
  );
}

/**
 * Full-screen reel experience with vertical snap-scrolling.
 * Fixed 9:16 aspect ratio with Instagram-style UI.
 */
export function ReelFullScreen({ reels, initialIndex, onClose }: ReelFullScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeReelIndex, setActiveReelIndex] = useState(initialIndex);
  const [expandedCaptionId, setExpandedCaptionId] = useState<string | null>(null);
  const [showProductSheetId, setShowProductSheetId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    const timer = setTimeout(() => {
      if (containerRef.current) {
        const items = containerRef.current.querySelectorAll('.reel-modal-item');
        if (items[initialIndex]) {
          items[initialIndex].scrollIntoView({ behavior: 'auto' });
        }
      }
    }, 100);

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Pause the page-level Lenis smooth-scroll while the modal is open so
    // wheel / touch events reach the inner vertical snap container instead
    // of being hijacked to scroll the window behind the modal.
    const lenis = (window as any).__lenis as
      | { stop: () => void; start: () => void }
      | undefined;
    lenis?.stop?.();

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalStyle;
      lenis?.start?.();
    };
  }, [initialIndex]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    if (height === 0) return;

    const newIndex = Math.round(scrollPos / height);
    if (newIndex !== activeReelIndex && newIndex >= 0 && newIndex < reels.length) {
      setActiveReelIndex(newIndex);
      setExpandedCaptionId(null);
      setShowProductSheetId(null);
    }
  };

  if (!isMounted) return null;

  const modalContent = (
    <div className="reel-modal" data-lenis-prevent>
      <div
        className="reel-modal-bg"
        style={{ backgroundImage: `url(${reels[activeReelIndex]?.thumbnailUrl || reels[activeReelIndex]?.products?.[0]?.image || ''})` }}
      />

      {/* Close */}
      <button className="reel-close-btn" onClick={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Vertical scroll container */}
      <div className="reel-modal-container" ref={containerRef} onScroll={handleScroll} data-lenis-prevent>
        {reels.map((reel, index) => {
          const isCaptionExpanded = expandedCaptionId === reel.id;
          const isSheetOpen = showProductSheetId === reel.id;
          const hasProducts = reel.products && reel.products.length > 0;

          return (
            <div key={reel.id} className="reel-modal-item">
              <div className="reel-viewport">
                <ReelVideoPlayer
                  src={reel.videoUrl}
                  isActive={index === activeReelIndex}
                  isMuted={globalMuted}
                  onVideoClick={() => {
                    setExpandedCaptionId(null);
                    setShowProductSheetId(null);
                  }}
                />

                {/* View count */}
                <div className="reel-view-count">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>{reel.viewCount}</span>
                </div>

                <div className="reel-info-gradient" />

                <div className={`reel-overlay ${isCaptionExpanded ? 'caption-expanded' : ''}`}>
                  {/* Sidebar */}
                  <div className="reel-sidebar">
                    {/* Mute toggle */}
                    <button
                      className="reel-sidebar-btn"
                      onClick={(e) => { e.stopPropagation(); setGlobalMuted(!globalMuted); }}
                      aria-label={globalMuted ? 'Unmute' : 'Mute'}
                    >
                      {globalMuted ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                      )}
                    </button>

                    {/* Product sheet toggle */}
                    {hasProducts && (
                      <button
                        className={`reel-sidebar-btn ${isSheetOpen ? 'reel-sidebar-btn--active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProductSheetId(isSheetOpen ? null : reel.id);
                          setExpandedCaptionId(null);
                        }}
                        aria-label="Tagged products"
                      >
                        <img
                          src="/icons/add-bag.png"
                          alt="Products"
                          width="22"
                          height="22"
                          style={{ filter: 'invert(1)', display: 'block' }}
                        />
                      </button>
                    )}
                  </div>

                  {/* Bottom info */}
                  <div className="reel-bottom-info">
                    <div className="info-content-wrapper">
                      <div className="reel-author-row">
                        <div className="reel-author-circle">
                          {reel.influencerName?.charAt(0) || '?'}
                        </div>
                        <div className="reel-author-text">
                          <span className="reel-author-name">{reel.influencerName}</span>
                          <span className="reel-author-handle">{reel.creatorHandle}</span>
                        </div>
                      </div>

                      {reel.caption && (
                        <div
                          className="reel-caption-container"
                          onClick={() => !isCaptionExpanded && setExpandedCaptionId(reel.id)}
                        >
                          <div className={`reel-caption-text ${isCaptionExpanded ? '' : 'clamped'}`}>
                            {reel.caption}
                            {!isCaptionExpanded && reel.caption.length > 60 && (
                              <span className="btn-read-more">...more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Product bottom sheet ── */}
                {hasProducts && (
                  <div className={`reel-product-sheet ${isSheetOpen ? 'reel-product-sheet--open' : ''}`}>
                    {/* Handle bar */}
                    <div className="reel-sheet-handle" />

                    <p className="reel-sheet-label">Tagged Products</p>

                    <div className="reel-sheet-products">
                      {reel.products.map((product) => (
                        <div key={product.id} className="reel-sheet-item">
                          {/* Thumbnail */}
                          <Link
                            to={`/products/${product.handle}`}
                            className="reel-sheet-thumb"
                            onClick={onClose}
                          >
                            {product.image && (
                              <img src={product.image} alt={product.title} />
                            )}
                          </Link>

                          {/* Info */}
                          <div className="reel-sheet-info">
                            <Link
                              to={`/products/${product.handle}`}
                              className="reel-sheet-title"
                              onClick={onClose}
                            >
                              {product.title}
                            </Link>
                            {product.price && (
                              <span className="reel-sheet-price">{product.price}</span>
                            )}
                          </div>

                          {/* Add to cart */}
                          <ReelATCButton product={product} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function ReelVideoPlayer({
  src,
  isActive,
  isMuted,
  onVideoClick,
}: {
  src: string;
  isActive: boolean;
  isMuted: boolean;
  onVideoClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      src={src}
      loop
      muted={isMuted || !isActive}
      playsInline
      className="reel-video-full"
      onClick={onVideoClick}
    />
  );
}
