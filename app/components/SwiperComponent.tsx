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
 */
export function SwiperComponent({ slides }: SwiperComponentProps) {
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
    <div className="relative w-full h-full">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={
          canAutoplay
            ? { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }
            : false
        }
        pagination={{
          clickable: true,
          bulletClass:
            'swiper-pagination-bullet !bg-white/50 !w-2 !h-2 !mx-1.5 !rounded-full transition-all duration-300',
          bulletActiveClass:
            '!bg-white !w-8 !rounded-full !opacity-100',
        }}
        loop={canLoop}
        speed={1200}
        className="w-full h-full"
        style={{ '--swiper-pagination-bottom': '2rem' } as React.CSSProperties}
      >
        {slideData.map((slide, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative w-full h-full overflow-hidden">
              {/* Background Image */}
              <img
                src={slide.image}
                alt={slide.heading}
                loading={idx === 0 ? 'eager' : 'lazy'}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
              {/* <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" /> */}

              {/* Content */}
              <div className="relative h-full flex items-center lg:items-end">
                <div className="w-full px-8 lg:px-12 xl:px-20 pb-16 lg:pb-24">

                  <div className="max-w-2xl">
                    {/* Heading */}
                    <h2
                      className="text-4xl md:text-5xl lg:text-6xl xl:text-5xl font-semibold text-white leading-[1.05] mb-8"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        textShadow: '0 6px 30px rgba(0,0,0,0.45)',
                      }}
                    >
                      {slide.heading}
                    </h2>
                    {/* Subheading */}
                    <span className="block text-lg text-neutral-300 mb-6">
                      {slide.subheading}
                    </span>

                    {/* CTA Button */}
                    <Link
                      to={slide.ctaLink}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black text-xs tracking-[0.25em] uppercase font-medium rounded-full border border-white transition-all duration-300 hover:bg-black hover:text-white hover:border-white no-underline"
                    >
                      {slide.ctaText}
                      <svg
                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
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
  );
}