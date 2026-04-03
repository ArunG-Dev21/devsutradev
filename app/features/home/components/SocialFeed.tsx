import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectCoverflow } from 'swiper/modules';
import type { ReelItem } from './WhyDevasutra';
import { ReelFullScreen } from './ReelFullScreen';

// Import CSS
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

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
  }[];
  // Backward compatibility for WhyDevasutra
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

/**
 * Social Feed carousel with video reels and product tagging.
 * Centered layout with scaling effects.
 */
export function SocialFeed({ reels }: SocialFeedProps) {
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);

  if (!reels || reels.length === 0) return null;

  return (
    <section className="social-feed-section">
      <div className="social-feed-container">
        {/* Header */}
        <div className="social-feed-header">
          <p className="social-feed-subtitle">Community Highlights</p>
          <h2 className="social-feed-title">Social Feed</h2>
        </div>

        {/* Horizontal Swiper */}
        <Swiper
          modules={[Pagination, EffectCoverflow]}
          effect={'coverflow'}
          coverflowEffect={{
            rotate: 20,
            stretch: 0,
            depth: 120,
            modifier: 1,
            slideShadows: false,
          }}
          spaceBetween={0}
          slidesPerView={'auto'}
          centeredSlides={true}
          initialSlide={1}
          loop={reels.length >= 5} // Loop only if we have enough slides to avoid duplication glitches
          pagination={{ clickable: true }}
          className="social-feed-swiper"
        >
          {reels.map((reel, index) => (
            <SwiperSlide 
              key={reel.id} 
              onClick={() => setSelectedReelIndex(index)}
            >
              <div className="reel-card">
                <video 
                  src={reel.videoUrl} 
                  poster={reel.thumbnailUrl || undefined}
                  muted 
                  playsInline 
                  loop 
                  autoPlay={false} // Only play when active if we want, but Swiper handles visibility
                  className="reel-card-video"
                />
                
                <div className="reel-card-overlay" />
                
                {/* Active Products Badge */}
                {reel.products && reel.products.length > 0 && (
                  <div className="reel-product-badge">
                    <svg className="reel-product-badge-icon" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    <span>
                      {reel.products.length} {reel.products.length === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Full Screen View Toggle */}
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
