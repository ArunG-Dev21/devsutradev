'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

interface SplitHeroProps {
  featuredProducts: {
    id: string;
    title: string;
    image: string;
    price: string;
  }[];
}

export function SplitHero({ featuredProducts }: SplitHeroProps) {
  return (
    <section className="min-h-[85vh] grid lg:grid-cols-2">

      {/* LEFT - SWIPER */}
      <div className="relative">
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4000 }}
          pagination={{ clickable: true }}
          loop
          className="h-full"
        >
          <SwiperSlide>
            <img
              src="/hero1.jpg"
              className="w-full h-[85vh] object-cover"
              alt=""
            />
          </SwiperSlide>

          <SwiperSlide>
            <img
              src="/hero2.jpg"
              className="w-full h-[85vh] object-cover"
              alt=""
            />
          </SwiperSlide>

          <SwiperSlide>
            <img
              src="/hero3.jpg"
              className="w-full h-[85vh] object-cover"
              alt=""
            />
          </SwiperSlide>
        </Swiper>
      </div>

      {/* RIGHT - FEATURED COLLECTION */}
      <div className="bg-bg-light flex items-center border-l border-primary-border">
        <div className="px-10 lg:px-20 w-full">

          <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-3 font-medium">
            Sacred Collection
          </p>

          <h2 className="text-4xl lg:text-5xl font-heading font-medium text-text-main mb-8 text-glow">
            Shop Devotional Bracelets
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group">

                <div className="overflow-hidden rounded-md mb-3">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>

                <h3 className="text-sm uppercase tracking-widest text-text-main mt-4 mb-1">
                  {product.title}
                </h3>

                <p className="text-sm text-text-muted">
                  {product.price}
                </p>

              </div>
            ))}
          </div>

        </div>
      </div>

    </section>
  );
}