import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";

export function TrustBadges() {
  const badges = [
    {
      title: "Authentic Guarantee",
      description: "Spiritually verified sacred materials",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z"
        />
      ),
    },
    {
      title: "Fast Shipping",
      description: "Delivered within 5–7 business days",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7h13l3 4v6h-2m-10 0a2 2 0 104 0m6 0a2 2 0 104 0"
        />
      ),
    },
    {
      title: "Free Returns",
      description: "30-day hassle-free return policy",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0012 0M19 9a7 7 0 00-12 0"
        />
      ),
    },
    {
      title: "Secure Checkout",
      description: "End-to-end SSL encrypted payment",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4M7 10V7a5 5 0 0110 0v3"
        />
      ),
    },
  ];

  const heroImages = [
    { src: "/hero-abt-1.png", alt: "Devotional jewelry" },
    { src: "/hero-abt-2.png", alt: "Spiritual bracelet" },
    { src: "/hero-abt-3.png", alt: "Sacred beads" },
  ];

  return (
    <section className="relative bg-[#f5f7fa] to-white overflow-hidden">

      {/* ===== Soft Divine Glow Background ===== */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-gradient-radial from-neutral-200/40 via-transparent to-transparent blur-3xl opacity-60 pointer-events-none"></div>

      {/* ================= TRUST STRIP ================= */}
      <div className="border-b border-neutral-200/60 backdrop-blur-md bg-white/70">
        <div className="container mx-auto px-6 lg:px-16 py-6 flex flex-wrap justify-center gap-x-14 gap-y-6">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-4 text-sm text-neutral-700 hover:scale-105 transition-transform duration-300"
            >
              <div className="w-9 h-9 rounded-full bg-neutral-100 shadow-sm flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-neutral-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  {badge.icon}
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="tracking-wide font-semibold">
                  {badge.title}
                </span>
                <span className="text-xs text-neutral-500">
                  {badge.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= HERO SECTION ================= */}
      <div className="relative py-36">

        {/* Watermark Brand */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <h2 className="text-[100px] sm:text-[160px] lg:text-[220px] font-serif font-semibold tracking-[0.18em] text-neutral-300/20 text-center leading-none">
            DEVASUTRA
          </h2>
        </div>

        <div className="relative container mx-auto px-6 lg:px-16 text-center">

          {/* HEADLINE */}
          <h1 className="text-5xl lg:text-7xl font-serif text-neutral-900 mb-8 leading-tight">
            Awaken Divine Energy
          </h1>

          {/* SUBTEXT */}
          <p className="text-lg lg:text-xl text-neutral-600 font-light tracking-wide max-w-2xl mx-auto mb-16">
            Sacred craftsmanship designed to protect, empower, and elevate your spirit — 
            rooted in tradition, refined for modern devotion.
          </p>

          {/* SWIPER */}
          <div className="relative flex justify-center items-center mb-20">
            <div className="w-[260px] h-[380px] lg:w-[460px] lg:h-[360px]">
              <Swiper
                effect="cards"
                grabCursor={true}
                loop={true}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                modules={[EffectCards, Autoplay]}
                className="h-full"
              >
                {heroImages.map((image, idx) => (
                  <SwiperSlide
                    key={idx}
                    className="overflow-hidden rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.15)]"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          {/* CTA BUTTON */}
          <div className="flex justify-center">
            <button className="px-10 py-4 rounded-full bg-neutral-900 text-white tracking-wider text-sm uppercase font-medium hover:bg-neutral-800 transition-all duration-300 shadow-lg">
              Explore Collection
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

