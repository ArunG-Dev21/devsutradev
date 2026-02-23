import { SwiperComponent, type HeroSlide } from './SwiperComponent';
import { FeaturedCollectionComponent } from './FeaturedCollectionComponent';

interface HeroProps {
  collection: {
    title: string;
    handle: string;
    products: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string;
        availableForSale?: boolean;
        featuredImage?: {
          url: string;
          altText?: string | null;
          width?: number;
          height?: number;
        } | null;
        priceRange: {
          minVariantPrice: { amount: string; currencyCode: string };
        };
        variants?: {
          nodes: Array<{ id: string; availableForSale: boolean }>;
        };
      }>;
    };
  };
  slides?: HeroSlide[];
}

/**
 * Split hero section — Swiper on left, Featured Collection on right.
 * Full viewport height on desktop, stacked on mobile.
 */
export function Hero({ collection, slides }: HeroProps) {
  if (!collection) return null;

  return (
    <section className="flex flex-col lg:grid lg:grid-cols-2 lg:h-screen">
      <div
        className="w-full h-[60vh] min-h-[400px] lg:h-full lg:min-h-0"
        onWheel={(e) => {
          // Stop scroll events on the Swiper from scrolling the whole page (only relevant on desktop)
          if (window.innerWidth >= 1024) {
            e.stopPropagation();
          }
        }}
        onTouchMove={(e) => {
          // Allow natural mobile scroll but prevent swiper vertical drag from stealing it
          e.stopPropagation();
        }}
      >
        <SwiperComponent slides={slides} />
      </div>
      <div className="w-full h-auto lg:h-full lg:overflow-y-auto">
        <FeaturedCollectionComponent collection={collection} />
      </div>
    </section>
  );
}