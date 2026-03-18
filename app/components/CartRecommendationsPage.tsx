import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper/types';
import { useFetcher, Link } from 'react-router';
import { useRef, useState, useEffect } from 'react';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';
import { Money, CartForm } from '@shopify/hydrogen';
import { useCartNotification } from '~/components/CartNotification';
import 'swiper/css';
import 'swiper/css/navigation';

// Types
export type RecommendedProduct = {
  id: string;
  handle: string;
  title: string;
  tags: string[];
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: CurrencyCode };
    maxVariantPrice?: { amount: string; currencyCode: CurrencyCode };
  };
  variant?: { id: string; availableForSale: boolean } | null;
};

export function CartRecommendationsPage({ excludeProductIds }: { excludeProductIds: string[] }) {
  const fetcher = useFetcher<{ products: RecommendedProduct[] }>();
  const limit = 8;
  const exclude = excludeProductIds.join(',');
  const loadKey = `${limit}:${exclude}`;
  const lastLoadedKeyRef = useRef<string | null>(null);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  useEffect(() => {
    if (fetcher.state !== 'idle') return;
    if (lastLoadedKeyRef.current === loadKey) return;
    lastLoadedKeyRef.current = loadKey;
    void fetcher.load(
      `/api/recommendations?limit=${limit}&exclude=${encodeURIComponent(exclude)}`,
    );
  }, [exclude, fetcher, limit, loadKey]);

  const products = fetcher.data?.products ?? [];
  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg md:text-2xl font-heading font-semibold tracking-[0.15em] uppercase text-black dark:text-white">
          You may also like
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => swiper?.slidePrev()}
            disabled={!swiper || isBeginning}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer hover:bg-muted transition-colors"
            aria-label="Previous recommendations"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => swiper?.slideNext()}
            disabled={!swiper || isEnd}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer hover:bg-muted transition-colors"
            aria-label="Next recommendations"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <Swiper
        modules={[Navigation]}
        slidesPerView={1.2}
        spaceBetween={16}
        breakpoints={{
          0: { slidesPerView: 1.1, spaceBetween: 12 },
          480: { slidesPerView: 1.5, spaceBetween: 16 },
          640: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 2, spaceBetween: 16 },
        }}
        onSwiper={(instance) => {
          setSwiper(instance);
          setIsBeginning(instance.isBeginning);
          setIsEnd(instance.isEnd);
        }}
        onSlideChange={(instance) => {
          setIsBeginning(instance.isBeginning);
          setIsEnd(instance.isEnd);
        }}
        className="pb-1"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <RecommendationCardPage product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

function RecommendationCardPage({ product }: { product: RecommendedProduct }) {
  const variantId = product.variant?.id;
  const canAdd = Boolean(variantId && product.variant?.availableForSale);

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300 flex items-stretch relative">
      {/* IMAGE */}
      <Link
        to={`/products/${product.handle}`}
        className="no-underline block w-28 shrink-0"
        prefetch="intent"
      >
        <div className="h-full bg-muted overflow-hidden relative rounded-l-2xl">
          {product.featuredImage?.url ? (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              width={300}
              height={300}
              sizes="112px"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-4xl opacity-20 text-muted-foreground">*</span>
            </div>
          )}
          {!canAdd && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 bg-white/90 backdrop-blur text-[9px] font-semibold tracking-wider uppercase rounded-full shadow-sm">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </Link>
      {/* CONTENT */}
      <div className="flex flex-col gap-2 flex-1 px-4 py-3">
        {/* TITLE */}
        <Link
          to={`/products/${product.handle}`}
          className="no-underline"
          prefetch="intent"
        >
          <h3 className="text-lg font-medium text-foreground leading-snug line-clamp-2 group-hover:underline underline-offset-2">
            {product.title}
          </h3>
        </Link>
        {/* PRICE + BUTTON */}
        <div className="flex items-center justify-between">
          <Money
            withoutTrailingZeros
            data={product.priceRange.minVariantPrice}
            className="text-2xl text-foreground"
          />
        </div>
        {canAdd && (
          <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesAdd}
            inputs={{ lines: [{ merchandiseId: variantId!, quantity: 1, selectedVariant: product.variant }] }}
          >
            {(fetcher: any) => (
              <RecommendationAddButtonPage fetcher={fetcher} productTitle={product.title} />
            )}
          </CartForm>
        )}
      </div>
    </div>
  );
}

function RecommendationAddButtonPage({ fetcher, productTitle }: { fetcher: any; productTitle: string }) {
  const { showNotification } = useCartNotification();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle);
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle]);

  return (
    <button
      type="submit"
      disabled={fetcher.state !== 'idle'}
      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-lg text-[11px] uppercase tracking-wider font-bold transition-colors cursor-pointer"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
      Add to Cart
    </button>
  );
}
