import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { CartForm } from '@shopify/hydrogen';
import type { SocialReel } from './SocialFeed';

interface ReelFullScreenProps {
  reels: SocialReel[];
  initialIndex: number;
  onClose: () => void;
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
  const [globalMuted, setGlobalMuted] = useState(false);

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

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalStyle;
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
    <div className="reel-modal">
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
      <div className="reel-modal-container" ref={containerRef} onScroll={handleScroll}>
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
                          {product.variantId && product.availableForSale !== false ? (
                            <CartForm
                              route="/cart"
                              action={CartForm.ACTIONS.LinesAdd}
                              inputs={{
                                lines: [{ merchandiseId: product.variantId, quantity: 1 }],
                              }}
                            >
                              {(fetcher) => (
                                <button
                                  type="submit"
                                  disabled={fetcher.state !== 'idle'}
                                  className="reel-sheet-atc"
                                  aria-label={`Add ${product.title} to bag`}
                                  title="Add to bag"
                                >
                                  <img
                                    src="/icons/add-bag.png"
                                    alt="Add to bag"
                                    width="20"
                                    height="20"
                                  />
                                </button>
                              )}
                            </CartForm>
                          ) : (
                            <button className="reel-sheet-atc reel-sheet-atc--disabled" disabled title="Unavailable">
                              <img
                                src="/icons/add-bag.png"
                                alt="Unavailable"
                                width="20"
                                height="20"
                                style={{ opacity: 0.4 }}
                              />
                            </button>
                          )}
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
