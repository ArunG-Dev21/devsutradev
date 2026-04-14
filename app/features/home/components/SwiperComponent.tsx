import { useState } from 'react';
import { Link } from 'react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import { HERO_SLIDES } from '~/lib/constants';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

export interface HeroSlide {
  image: string;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string;
}

interface SwiperComponentProps {
  slides?: HeroSlide[];
}

/**
 * Hero Swiper with dynamic slides, fade effect, and CTA buttons.
 * Uses metaobject data when available, falls back to hardcoded constants.
 *
 * Shows a skeleton shimmer until Swiper is fully initialised so users
 * on slow connections never see broken / stacked slides.
 */
export function SwiperComponent({ slides }: SwiperComponentProps) {
  const [isReady, setIsReady] = useState(false);

  // Use dynamic metaobject slides if available, otherwise fall back to constants
  const slideData: HeroSlide[] =
    slides && slides.length > 0
      ? slides
      : HERO_SLIDES.map((s) => ({
        image: s.image,
        heading: s.heading,
        subheading: s.tagline,
        ctaText: s.cta,
        ctaLink: s.link,
      }));

  // Swiper loop mode requires at least 3 slides with EffectFade
  const canLoop = slideData.length >= 3;
  const canAutoplay = slideData.length > 1;

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* ── Skeleton placeholder — visible until Swiper fires onInit ── */}
      {!isReady && (
        <div className="absolute inset-0 z-10 bg-stone-100 dark:bg-neutral-950 flex flex-col items-start justify-end overflow-hidden">
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, var(--shimmer-color, rgba(0,0,0,0.04)) 40%, var(--shimmer-highlight, rgba(0,0,0,0.07)) 50%, var(--shimmer-color, rgba(0,0,0,0.04)) 60%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'swiperShimmer 1.8s ease-in-out infinite',
            }}
          />

          {/* Skeleton content blocks */}
          <div className="relative w-full px-5 sm:px-6 md:px-8 lg:px-12 xl:px-20 pb-14 sm:pb-16 md:pb-16 lg:pb-20 xl:pb-24">
            <div className="max-w-2xl space-y-4">
              {/* Heading skeleton */}
              <div className="h-7 sm:h-9 md:h-10 w-3/4 rounded-lg bg-stone-300/40 dark:bg-white/[0.07]" />
              <div className="h-7 sm:h-9 md:h-10 w-1/2 rounded-lg bg-stone-300/40 dark:bg-white/[0.07]" />
              {/* Subheading skeleton */}
              <div className="h-4 sm:h-5 md:h-6 w-2/3 rounded-md bg-stone-200/50 dark:bg-white/[0.05] mt-2" />
              {/* CTA skeleton */}
              <div className="h-10 sm:h-11 md:h-12 w-40 sm:w-44 md:w-48 rounded-full bg-stone-300/30 dark:bg-white/[0.06] mt-3" />
            </div>
          </div>
        </div>
      )}

      {/* ── Actual Swiper — opacity-0 until ready, then fades in ── */}
      <div
        className="w-full h-full transition-opacity duration-700 ease-out"
        style={{ opacity: isReady ? 1 : 0 }}
      >
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={
            canAutoplay
              ? { delay: 2000, disableOnInteraction: true, pauseOnMouseEnter: true }
              : false
          }
          pagination={{
            clickable: true,
          }}
          loop={canLoop}
          speed={1500}
          className="w-full h-full"
          style={{ '--swiper-pagination-bottom': '0.75rem' } as React.CSSProperties}
          onInit={() => setIsReady(true)}
        >
          {slideData.map((slide, idx) => (
            <SwiperSlide key={`${slide.image}:${slide.ctaLink}`}>
              <div className="relative w-full h-full overflow-hidden">
                {/* Background Image */}
                <img
                  src={slide.image}
                  alt={slide.heading}
                  width={1920}
                  height={1080}
                  sizes="100vw"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Content */}
                <div className="relative h-full flex items-end">
                  <div className="w-full px-5 pb-14 sm:px-6 sm:pb-16 md:px-8 md:pb-16 lg:px-12 lg:pb-20 xl:px-20 xl:pb-24">

                    <div className="max-w-2xl">
                      {/* Heading */}
                      <h2
                        className="text-4xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl font-bold text-white leading-[1.1] mb-3 sm:mb-4 md:mb-5 font-heading"
                      >
                        {slide.heading}
                      </h2>
                      {/* Subheading */}
                      <span className="block text-sm sm:text-base md:text-lg lg:text-xl text-neutral-300 mb-3 sm:mb-4 md:mb-5">
                        {slide.subheading}
                      </span>

                      {/* CTA Button */}
                      <Link
                        to={slide.ctaLink}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-white text-black text-[11px] sm:text-xs md:text-sm uppercase font-medium tracking-wider rounded-full border border-white transition-all duration-300 hover:bg-black hover:text-white hover:border-white no-underline"
                      >
                        {slide.ctaText}
                        <svg
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </Link>

                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
