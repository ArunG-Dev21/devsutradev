import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
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
  const [showProductDrawerId, setShowProductDrawerId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(false); // Unmuted by default on tap

  // Portal target check
  useEffect(() => {
    setIsMounted(true);
    
    // Auto-scroll to the clicked reel on mount
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const items = containerRef.current.querySelectorAll('.reel-modal-item');
        if (items[initialIndex]) {
          items[initialIndex].scrollIntoView({ behavior: 'auto' });
        }
      }
    }, 100);
    
    // Lock body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalStyle;
    };
  }, [initialIndex]);

  // Track active reel on scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    if (height === 0) return;
    
    const newIndex = Math.round(scrollPos / height);
    if (newIndex !== activeReelIndex && newIndex >= 0 && newIndex < reels.length) {
      setActiveReelIndex(newIndex);
      // Reset expansions when swiveling
      setExpandedCaptionId(null);
      setShowProductDrawerId(null);
    }
  };

  if (!isMounted) return null;

  const modalContent = (
    <div className="reel-modal">
      {/* Blurred background of current video */}
      <div 
        className="reel-modal-bg" 
        style={{ backgroundImage: `url(${reels[activeReelIndex]?.thumbnailUrl || reels[activeReelIndex]?.products?.[0]?.image || ''})` }} 
      />

      {/* Close Button (Global) */}
      <button className="reel-close-btn" onClick={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Vertical Reel Container */}
      <div 
        className="reel-modal-container" 
        ref={containerRef}
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => {
          const isCaptionExpanded = expandedCaptionId === reel.id;
          const isDrawerOpen = showProductDrawerId === reel.id;

          return (
            <div key={reel.id} className="reel-modal-item">
              <div className="reel-viewport">
                <ReelVideoPlayer 
                  src={reel.videoUrl} 
                  isActive={index === activeReelIndex} 
                  isMuted={globalMuted} 
                  onVideoClick={() => {
                    setExpandedCaptionId(null);
                    setShowProductDrawerId(null);
                  }} 
                />

                {/* View Count Overlay */}
                <div className="reel-view-count">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>{reel.viewCount}</span>
                </div>
                
                {/* Visual Gradients */}
                <div className="reel-info-gradient" />

                <div className={`reel-overlay ${isCaptionExpanded ? 'caption-expanded' : ''}`}>
                  {/* Interaction Sidebar */}
                  <div className="reel-sidebar">
                    <button 
                      className="reel-sidebar-btn" 
                      onClick={(e) => { e.stopPropagation(); setGlobalMuted(!globalMuted); }}
                      aria-label={globalMuted ? "Unmute" : "Mute"}
                    >
                      {globalMuted ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <line x1="23" y1="9" x2="17" y2="15"></line>
                          <line x1="17" y1="9" x2="23" y2="15"></line>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        </svg>
                      )}
                    </button>

                    {reel.products && reel.products.length > 0 && (
                      <div className="reel-popover-anchor">
                        <button 
                          className="reel-sidebar-btn"
                          onClick={() => setShowProductDrawerId(isDrawerOpen ? null : reel.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                          </svg>
                        </button>

                        {/* CONNECTED PRODUCT POPOVER */}
                        {isDrawerOpen && (
                          <div className="reel-product-popover-container">
                            <div className="reel-product-popover">
                              <div className="popover-header">
                                <span>Tagged Products</span>
                                <button onClick={() => setShowProductDrawerId(null)}>✕</button>
                              </div>
                              <div className="popover-content">
                                {reel.products.map((product) => (
                                  <div key={product.id} className="popover-item">
                                    <Link to={`/products/${product.handle}`} className="popover-item-link">
                                      <img src={product.image} alt={product.title} />
                                      <div className="popover-item-info">
                                        <h4>{product.title}</h4>
                                        <p>{product.price}</p>
                                      </div>
                                    </Link>
                                    <button className="btn-add-bag" title="Add to Bag">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                                        <line x1="12" y1="11" x2="12" y2="17"></line>
                                        <line x1="9" y1="14" x2="15" y2="14"></line>
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="popover-arrow" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Info Section with PUSH UP logic */}
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

                      <div className="reel-caption-container" onClick={() => !isCaptionExpanded && setExpandedCaptionId(reel.id)}>
                        <div className={`reel-caption-text ${isCaptionExpanded ? '' : 'clamped'}`}>
                          {reel.caption}
                          {!isCaptionExpanded && reel.caption && reel.caption.length > 60 && (
                            <span className="btn-read-more">...more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/**
 * Handles active/inactive video playback states to avoid overlapping audio and save resources.
 */
function ReelVideoPlayer({ 
  src, 
  isActive, 
  isMuted, 
  onVideoClick
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
      videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <video 
      ref={videoRef}
      src={src} 
      loop 
      muted={isMuted || !isActive} // Keep inactive muted to prevent artifact playbacks
      playsInline 
      className="reel-video-full"
      onClick={onVideoClick}
    />
  );
}
