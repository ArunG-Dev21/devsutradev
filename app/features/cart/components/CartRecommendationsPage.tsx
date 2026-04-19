import { useFetcher, Link, type FetcherWithComponents } from 'react-router';
import { useRef, useEffect } from 'react';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';
import { Money, CartForm } from '@shopify/hydrogen';
import { useCartNotification } from './CartNotification';

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
  const ratingsFetcher = useFetcher<{ summaries: Record<string, { averageRating: number; reviewCount: number }> }>();
  const limit = 8;
  const exclude = excludeProductIds.join(',');
  const loadKey = `${limit}:${exclude}`;
  const lastLoadedKeyRef = useRef<string | null>(null);
  const lastRatingsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetcher.state !== 'idle') return;
    if (lastLoadedKeyRef.current === loadKey) return;
    lastLoadedKeyRef.current = loadKey;
    void fetcher.load(
      `/api/recommendations?limit=${limit}&exclude=${encodeURIComponent(exclude)}`,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  useEffect(() => {
    const prods = fetcher.data?.products ?? [];
    if (!prods.length || ratingsFetcher.state !== 'idle') return;
    const key = prods.map((p) => p.id).join(',');
    if (lastRatingsKeyRef.current === key) return;
    lastRatingsKeyRef.current = key;
    const ids = prods.map((p) => p.id.split('/').pop() ?? '').filter(Boolean);
    const handles = prods.map((p) => p.handle);
    void ratingsFetcher.load(
      `/api/ratings?ids=${encodeURIComponent(ids.join(','))}&handles=${encodeURIComponent(handles.join(','))}`,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data?.products]);

  const ratings = ratingsFetcher.data?.summaries ?? {};
  const products = fetcher.data?.products ?? [];
  if (products.length === 0) return null;

  return (
    <section className="mt-16 md:mt-24 pt-14 relative">
      <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
        <img src="/line-art.png" alt="" className="w-auto h-auto max-w-full pointer-events-none" />
      </div>

      <div className="text-center mb-10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
          Handpicked For You
        </p>
        <h2
          className="text-3xl md:text-4xl font-light text-foreground"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          You May Also Like
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-5">
        {products.map((product, index) => {
          const pid = product.id.split('/').pop() ?? '';
          const rating = ratings[pid]?.averageRating;
          return (
            <RecommendationCard key={product.id} product={product} rating={rating} index={index} />
          );
        })}
      </div>
    </section>
  );
}

function RecommendationCard({
  product,
  rating,
  index,
}: {
  product: RecommendedProduct;
  rating?: number;
  index: number;
}) {
  const variantId = product.variant?.id;
  const canAdd = Boolean(variantId && product.variant?.availableForSale);

  return (
    <div className="group bg-[#f6f6f6] rounded-[24px] p-2 sm:p-2.5 flex flex-col transition-all h-full">
      <div className="relative aspect-square overflow-hidden rounded-3xl mb-2 sm:mb-3 shrink-0">
        <Link to={`/products/${product.handle}`} prefetch="intent" className="block w-full h-full">
          {product.featuredImage?.url ? (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              width={400}
              height={400}
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
              loading={index < 2 ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              <span className="text-5xl opacity-20 text-muted-foreground">✦</span>
            </div>
          )}
        </Link>

        {rating && rating > 0 && (
          <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <svg className="w-2.5 h-2.5 text-[#F14514] shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[10px] font-semibold text-black leading-none tabular-nums">{rating.toFixed(1)}</span>
          </div>
        )}

        {!canAdd && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 bg-white/90 backdrop-blur text-[9px] font-semibold tracking-wider uppercase rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-3 sm:p-4 flex flex-col flex-1 gap-2 border border-black/10">
        <Link to={`/products/${product.handle}`} prefetch="intent" className="block">
          <h3 className="text-sm sm:text-base leading-tight line-clamp-1 text-black group-hover:underline underline-offset-2">
            {product.title}
          </h3>
        </Link>

        <Money
          withoutTrailingZeros
          data={product.priceRange.minVariantPrice}
          className="text-base sm:text-xl font-medium text-black leading-none"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        />

        <div className="mt-auto pt-2">
          {canAdd && variantId ? (
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesAdd}
              inputs={{ lines: [{ merchandiseId: variantId, quantity: 1, selectedVariant: product.variant }] }}
            >
              {(fetcher: FetcherWithComponents<any>) => (
                <RecommendationAddButton fetcher={fetcher} productTitle={product.title} />
              )}
            </CartForm>
          ) : (
            <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground py-2">
              Sold Out
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendationAddButton({
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
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-black text-white rounded-full text-[10px] uppercase tracking-widest font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
    >
      {isAdding ? (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
        </svg>
      ) : (
        <img src="/icons/add-bag.png" alt="" className="w-3.5 h-3.5 object-contain invert" />
      )}
      {isAdding ? 'Adding…' : 'Add to Bag'}
    </button>
  );
}
