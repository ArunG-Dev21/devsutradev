import { Link } from 'react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import { HERO_SLIDES } from '~/lib/constants';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

/**
 * Hero Swiper with 4 dynamic slides, fade effect, and CTA buttons.
 */
export function SwiperComponent() {
  return (
    <div className="relative h-[50vh] md:h-[90vh]">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop
        className="h-full"
      >
        {HERO_SLIDES.map((slide, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative h-full">
              {/* Background Image */}
              <img
                src={slide.image}
                className="absolute inset-0 w-full h-full object-cover"
                alt={slide.heading}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

              {/* Content */}
              <div className="relative z-10 h-full flex items-end md:items-center px-6 md:px-12 pb-12 md:pb-0">
                <div className="text-white max-w-lg">
                  <p
                    className="text-[10px] md:text-xs tracking-[0.4em] uppercase mb-3 md:mb-4"
                    style={{ color: '#C5A355' }}
                  >
                    {slide.tagline}
                  </p>

                  <h2
                    className="text-3xl md:text-5xl font-light mb-3 md:mb-6"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {slide.heading}
                  </h2>

                  <p className="text-white/70 text-sm md:text-base mb-5 md:mb-8 leading-relaxed">
                    {slide.description}
                  </p>

                  <Link
                    to={slide.link}
                    className="inline-block px-6 md:px-8 py-2.5 md:py-3 text-xs md:text-sm tracking-[0.15em] uppercase border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 no-underline"
                  >
                    {slide.cta} →
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}