import {
  CartForm,
  Money,
  useOptimisticCart,
  type OptimisticCartLine,
} from '@shopify/hydrogen';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useFetcher, type FetcherWithComponents } from 'react-router';
import { useCartNotification } from './CartNotification';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper/types';
import { CartRecommendationsPage } from './CartRecommendationsPage';
import type { CartApiQueryFragment } from 'storefrontapi.generated';
import { useAside } from '~/shared/components/Aside';
import { CartLineItem, type CartLine } from './CartLineItem';
import { CartSummary } from './CartSummary';
import { FREE_SHIPPING_THRESHOLD } from '~/lib/constants';
import 'swiper/css';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = { [parentId: string]: CartLine[] };

function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const childMap = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(childMap)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}

export function CartMain({ layout, cart: originalCart }: CartMainProps) {
  const cart = useOptimisticCart(originalCart);
  const { close } = useAside();

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);
  const cartProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const line of cart?.lines?.nodes ?? []) {
      const productId = (line as any)?.merchandise?.product?.id;
      if (typeof productId === 'string') ids.add(productId);
    }
    return [...ids];
  }, [cart?.lines?.nodes]);

  // Fetch Judge.me rating summaries for cart line items
  const ratingsFetcher = useFetcher<{ summaries: Record<string, { averageRating: number; reviewCount: number }> }>();
  const lastRatingsKeyRef = useRef<string | null>(null);
  const cartLineProducts = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; handle: string }[] = [];
    for (const line of cart?.lines?.nodes ?? []) {
      const productId = String((line as any)?.merchandise?.product?.id || '').split('/').pop() || '';
      const handle = (line as any)?.merchandise?.product?.handle || '';
      if (productId && handle && !seen.has(productId)) {
        seen.add(productId);
        result.push({ id: productId, handle });
      }
    }
    return result;
  }, [cart?.lines?.nodes]);

  useEffect(() => {
    if (!cartLineProducts.length) return;
    const key = cartLineProducts.map((p) => p.id).join(',');
    if (lastRatingsKeyRef.current === key) return;
    lastRatingsKeyRef.current = key;
    const ids = cartLineProducts.map((p) => p.id).join(',');
    const handles = cartLineProducts.map((p) => p.handle).join(',');
    void ratingsFetcher.load(`/api/ratings?ids=${encodeURIComponent(ids)}&handles=${encodeURIComponent(handles)}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartLineProducts]);

  const cartRatings = ratingsFetcher.data?.summaries ?? {};

  const subtotal = parseFloat(cart?.cost?.subtotalAmount?.amount || '0');
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  return (
    <div
      className={`h-full flex ${layout === 'page' && cartHasItems
        ? 'flex-col lg:flex-row gap-6 lg:gap-0 items-start'
        : 'flex-col'
        } bg-transparent text-foreground`}
    >
      {layout === 'aside' && cartHasItems && (
        <div className="px-5 py-3.5 bg-card border-b border-border">
          {remaining > 0 ? (
            <>
              <p className="text-[11px] text-muted-foreground mb-2 tracking-wide">
                Add <span className="font-bold text-foreground">Rs {remaining.toFixed(0)}</span>{' '}
                more for free shipping
              </p>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-500"
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-shipping-gradient">
              You qualify for free shipping
            </p>
          )}
        </div>
      )}

      <div
        className={`flex-1 min-h-0 overflow-y-auto ${layout === 'aside' ? 'px-5' : 'w-full lg:w-3/5 xl:w-2/3'
          }`}
      >
        <CartEmpty hidden={linesCount} layout={layout} />
        <ul className={layout === 'aside' ? 'pt-3 space-y-3 pb-2' : ''}>
          {(cart?.lines?.nodes ?? []).map((line) => {
            if ('parentRelationship' in line && line.parentRelationship?.parent) {
              return null;
            }
            const pid = String((line as any)?.merchandise?.product?.id || '').split('/').pop() || '';
            return (
              <CartLineItem
                key={line.id}
                line={line}
                layout={layout}
                childrenMap={childrenMap}
                reviewSummary={pid ? cartRatings[pid] : undefined}
              />
            );
          })}
        </ul>

        {cartHasItems && (
          <div className={`${layout === 'aside' ? 'mt-6 mb-2' : 'mt-10'}`}>
            {layout === 'aside' ? (
              <CartRecommendations
                layout={layout}
                excludeProductIds={cartProductIds}
                onNavigateAway={() => layout === 'aside' && close()}
              />
            ) : (
              <CartRecommendationsPage excludeProductIds={cartProductIds} />
            )}
          </div>
        )}
      </div>

      {cartHasItems && (
        <div
          className={`${layout === 'page' ? 'w-full lg:w-2/5 xl:w-1/3 lg:sticky lg:top-8' : ''
            }`}
        >
          <CartSummary cart={cart} layout={layout} />
        </div>
      )}
    </div>
  );
}

type RecommendedProduct = {
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

function CartRecommendations({
  layout,
  excludeProductIds,
  onNavigateAway,
}: {
  layout: CartLayout;
  excludeProductIds: string[];
  onNavigateAway: () => void;
}) {
  const fetcher = useFetcher<{ products: RecommendedProduct[] }>();
  const ratingsFetcher = useFetcher<{ summaries: Record<string, { averageRating: number; reviewCount: number }> }>();
  const limit = layout === 'aside' ? 8 : 8;
  const exclude = excludeProductIds.join(',');
  const loadKey = `${limit}:${exclude}`;
  const lastLoadedKeyRef = useRef<string | null>(null);
  const lastRatingsKeyRef = useRef<string | null>(null);
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
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] tracking-[0.28em] uppercase text-muted-foreground mb-0.5">
            Handpicked For You
          </p>
          <p
            className="text-xl font-light text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            You May Also Like
          </p>
        </div>
        {products.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => swiper?.slidePrev()}
              disabled={isBeginning}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer hover:bg-muted transition-colors"
              aria-label="Previous recommendations"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => swiper?.slideNext()}
              disabled={isEnd}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer hover:bg-muted transition-colors"
              aria-label="Next recommendations"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <Swiper
          slidesPerView={1}
          spaceBetween={12}
          observer
          observeParents
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
          {products.map((product) => {
            const pid = product.id.split('/').pop() ?? '';
            const rating = ratings[pid]?.averageRating;
            return (
              <SwiperSlide key={product.id}>
                <RecommendationCard
                  product={product}
                  compact
                  onNavigateAway={onNavigateAway}
                  rating={rating}
                />
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}

function RecommendationCard({
  product,
  compact = false,
  onNavigateAway,
  rating,
}: {
  product: RecommendedProduct;
  compact?: boolean;
  onNavigateAway: () => void;
  rating?: number;
}) {
  const variantId = product.variant?.id;
  const canAdd = Boolean(variantId && product.variant?.availableForSale);

  return (
    <div className="group bg-[#f6f6f6] rounded-[24px] p-2 flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-3xl mb-2 shrink-0">
        <Link
          to={`/products/${product.handle}`}
          onClick={onNavigateAway}
          className="block w-full h-full"
          prefetch="intent"
        >
          {product.featuredImage?.url ? (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              width={300}
              height={300}
              sizes="360px"
              className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              <span className="text-4xl opacity-20 text-muted-foreground">✦</span>
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

      <div className="bg-white rounded-3xl p-3 flex flex-col gap-1.5 border border-black/10">
        <Link
          to={`/products/${product.handle}`}
          onClick={onNavigateAway}
          className="block no-underline"
          prefetch="intent"
        >
          <h3 className="text-sm font-medium text-black leading-snug line-clamp-1 group-hover:underline underline-offset-2">
            {product.title}
          </h3>
        </Link>

        <Money
          withoutTrailingZeros
          data={product.priceRange.minVariantPrice}
          className="text-lg font-medium text-black leading-none"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        />

        {canAdd && variantId && (
          <div className="mt-1">
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

function CartEmpty({
  hidden = false,
  layout,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const { close } = useAside();
  return (
    <div hidden={hidden} className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-900/50 flex items-center justify-center mb-5 border border-transparent dark:border-white/10">
        <svg
          className="w-7 h-7 text-stone-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
          />
        </svg>
      </div>

      <p className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1">Your Bag is empty</p>
      <p className="text-xs text-stone-400 dark:text-stone-500 mb-8 leading-relaxed">
        Looks like you have not added anything yet.
      </p>

      <Link
        to="/collections/all"
        onClick={close}
        prefetch="viewport"
        className="no-underline inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold tracking-widest uppercase rounded-full hover:bg-stone-700 dark:hover:bg-white transition-colors duration-200"
      >
        Start shopping
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    </div>
  );
}
