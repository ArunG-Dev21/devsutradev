import { SwiperComponent } from './SwiperComponent';
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
}

/**
 * Split hero section — Swiper on left, Featured Collection on right.
 * Full viewport height on desktop, stacked on mobile.
 */
export function Hero({ collection }: HeroProps) {
  if (!collection) return null;

  return (
    <section className="grid lg:grid-cols-2">
      <SwiperComponent />
      <FeaturedCollectionComponent collection={collection} />
    </section>
  );
}