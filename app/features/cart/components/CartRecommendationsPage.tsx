import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper/types';
import { useFetcher, Link, type FetcherWithComponents } from 'react-router';
import { useRef, useState, useEffect } from 'react';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';
import { Money, CartForm } from '@shopify/hydrogen';
import { useCartNotification } from './CartNotification';
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

      <div className="overflow-hidden">
        <Swiper
          modules={[Navigation]}
          slidesPerView={1.15}
          spaceBetween={12}
          breakpoints={{
            480: { slidesPerView: 1.5, spaceBetween: 12 },
            640: { slidesPerView: 2, spaceBetween: 12 },
            1024: { slidesPerView: 2, spaceBetween: 12 },
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
              <RecommendationCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}

function RecommendationCard({ product }: { product: RecommendedProduct }) {
  const variantId = product.variant?.id;
  const canAdd = Boolean(variantId && product.variant?.availableForSale);

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border transition-all duration-300 flex items-stretch relative h-[120px]">
      {/* IMAGE — with icon-only ATC button on mobile (absolute bottom-right) */}
      <div className="no-underline block w-32 shrink-0 relative">
        <Link
          to={`/products/${product.handle}`}
          className="no-underline block h-full"
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
                <span className="px-2 py-0.5 bg-white/90 backdrop-blur text-[9px] font-semibold tracking-wider uppercase rounded-full">
                  Sold Out
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Mobile-only: icon button bottom-right */}
        {canAdd && variantId && (
          <div className="absolute bottom-2 right-2 sm:hidden z-10">
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesAdd}
              inputs={{ lines: [{ merchandiseId: variantId, quantity: 1, selectedVariant: product.variant }] }}
            >
              {(fetcher: FetcherWithComponents<any>) => (
                <RecommendationIconButton fetcher={fetcher} productTitle={product.title} />
              )}
            </CartForm>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex flex-col gap-1.5 flex-1 px-4 py-3">
        {/* TITLE */}
        <Link
          to={`/products/${product.handle}`}
          className="no-underline"
          prefetch="intent"
        >
          <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:underline underline-offset-2">
            {product.title}
          </h3>
        </Link>

        {/* PRICE */}
        <Money
          withoutTrailingZeros
          data={product.priceRange.minVariantPrice}
          className="text-xl font-light text-foreground"
        />

        {/* Desktop: full-width Add to Bag button */}
        {canAdd && variantId && (
          <div className="mt-auto hidden sm:block">
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesAdd}
              inputs={{ lines: [{ merchandiseId: variantId, quantity: 1, selectedVariant: product.variant }] }}
            >
              {(fetcher: FetcherWithComponents<any>) => (
                <RecommendationLongButton fetcher={fetcher} productTitle={product.title} />
              )}
            </CartForm>
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationLongButton({
  fetcher,
  productTitle,
}: {
  fetcher: FetcherWithComponents<any>;
  productTitle: string;
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle);
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle]);

  const isAdding = fetcher.state !== 'idle';

  return (
    <button
      type="submit"
      disabled={isAdding}
      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-black border border-black text-white rounded-full text-[10px] uppercase tracking-widest font-medium hover:bg-stone-800 hover:border-stone-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 group/atcbtn"
    >
      {isAdding ? (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
        </svg>
      ) : (
        <img src="/icons/add-bag.png" alt="" className="w-3.5 h-3.5 object-contain invert transition-all" />
      )}
      {isAdding ? 'Adding…' : 'Add to Bag'}
    </button>
  );
}

function RecommendationIconButton({
  fetcher,
  productTitle,
}: {
  fetcher: FetcherWithComponents<any>;
  productTitle: string;
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle);
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle]);

  const isAdding = fetcher.state !== 'idle';

  return (
    <button
      type="submit"
      disabled={isAdding}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-800 text-gray-800 hover:bg-black hover:border-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 shadow-md group/iconbtn"
      aria-label="Add to bag"
    >
      {isAdding ? (
        <svg className="animate-spin w-3.5 h-3.5 text-gray-800 group-hover/iconbtn:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
        </svg>
      ) : (
        <img src="/icons/add-bag.png" alt="" className="w-4 h-4 object-contain group-hover/iconbtn:invert transition-all" />
      )}
    </button>
  );
}
