import { SwiperComponent, type HeroSlide } from './SwiperComponent';
import { FeaturedCollectionComponent } from './FeaturedCollectionComponent';
import { MobileCollectionNav } from './MobileCollectionNav';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';

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
          width?: number | null;
          height?: number | null;
        } | null;
        priceRange: {
          minVariantPrice: { amount: string; currencyCode: CurrencyCode };
        };
        variants?: {
          nodes: Array<{ id: string; availableForSale: boolean }>;
        };
      }>;
    };
  };
  slides?: HeroSlide[];
  reviewSummaries?: Record<string, { averageRating: number; reviewCount: number }>;
}

/**
 * Split hero section — Swiper on left, Featured Collection on right.
 * Full viewport height on desktop, stacked on mobile.
 */
export function Hero({ collection, slides, reviewSummaries }: HeroProps) {
  if (!collection) return null;

  return (
    <section className="flex flex-col lg:grid lg:grid-cols-2 lg:h-[90vh]">
      <div className="w-full h-[60vh] min-h-[400px] lg:h-[90vh] lg:min-h-0 overflow-hidden">
        <SwiperComponent slides={slides} />
      </div>
      <MobileCollectionNav />
      <div className="w-full h-auto lg:h-full lg:overflow-y-auto no-scrollbar">
        <FeaturedCollectionComponent collection={collection} reviewSummaries={reviewSummaries} />
      </div>
    </section>
  );
}
