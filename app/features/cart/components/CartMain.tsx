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
import { A11y } from 'swiper/modules';
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
  const { close, type: asideType } = useAside();

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
    <div className="h-full flex flex-col bg-transparent text-foreground">

      {layout === 'aside' ? (
        /* ── ASIDE LAYOUT ── */
        <>
          {cartHasItems && (
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

          <div className="flex-1 min-h-0 overflow-y-auto px-5">
            <CartEmpty hidden={linesCount} layout={layout} />
            <ul className="pt-3 space-y-3 pb-2">
              {(cart?.lines?.nodes ?? []).map((line) => {
                if ('parentRelationship' in line && line.parentRelationship?.parent) return null;
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
              <div className="mt-6 mb-2">
                <CartRecommendations
                  layout="aside"
                  excludeProductIds={cartProductIds}
                  onNavigateAway={() => close()}
                  isCartOpen={asideType === 'cart'}
                />
              </div>
            )}
          </div>

          {cartHasItems && <CartSummary cart={cart} layout={layout} />}
        </>
      ) : (
        /* ── PAGE LAYOUT ── */
        <>
          <div className={cartHasItems ? 'flex flex-col lg:flex-row gap-6 lg:gap-0 items-start' : 'flex flex-col'}>
            <div className={cartHasItems ? 'w-full lg:w-3/5 xl:w-2/3' : 'w-full'}>
              <CartEmpty hidden={linesCount} layout={layout} />
              <ul>
                {(cart?.lines?.nodes ?? []).map((line) => {
                  if ('parentRelationship' in line && line.parentRelationship?.parent) return null;
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
            </div>

            {cartHasItems && (
              <div className="w-full lg:w-2/5 xl:w-1/3 lg:sticky lg:top-8">
                <CartSummary cart={cart} layout={layout} />
              </div>
            )}
          </div>

          {cartHasItems && (
            <CartRecommendations
              layout="page"
              excludeProductIds={cartProductIds}
              onNavigateAway={() => {}}
            />
          )}
        </>
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
  isCartOpen = true,
}: {
  layout: CartLayout;
  excludeProductIds: string[];
  onNavigateAway: () => void;
  isCartOpen?: boolean;
}) {
  const fetcher = useFetcher<{ products: RecommendedProduct[] }>();
  const limit = 8;
  const exclude = excludeProductIds.join(',');
  const loadKey = `${limit}:${exclude}`;
  const lastLoadedKeyRef = useRef<string | null>(null);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  // Re-measure after the aside slide-in transition finishes, and again after
  // products load (two rAF ticks let the drawer settle before measuring).
  useEffect(() => {
    if (!swiper || swiper.destroyed) return;
    if (layout === 'aside' && !isCartOpen) return;
    let raf1 = 0;
    let raf2 = 0;
    const t1 = setTimeout(() => {
      if (swiper.destroyed) return;
      swiper.update();
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (!swiper.destroyed) swiper.update();
        });
      });
    }, layout === 'aside' ? 520 : 60);
    return () => {
      clearTimeout(t1);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isCartOpen, swiper, layout, fetcher.data?.products?.length]);

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

  const isPage = layout === 'page';

  return (
    <section className={isPage ? 'mt-12 md:mt-16 pt-12 md:pt-16 pb-10 md:pb-14 relative' : ''}>
      {isPage && (
        <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
          <img src="/line-art.png" alt="" className="w-auto h-auto max-w-full pointer-events-none" />
        </div>
      )}

      <div className={`flex items-center ${isPage ? 'justify-center mb-10 flex-col gap-3' : 'justify-between mb-3'}`}>
        {isPage ? (
          <>
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Handpicked For You
            </p>
            <h2
              className="text-3xl md:text-4xl font-light text-foreground"
              style={{ fontFamily: "'Cormorant Variable', Georgia, serif" }}
            >
              You May Also Like
            </h2>
          </>
        ) : (
          <p className="text-base tracking-[0.15em] uppercase text-black dark:text-white">
            You may also like
          </p>
        )}
        {!isPage && products.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => swiper?.slidePrev()}
              disabled={isBeginning}
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
              disabled={isEnd}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer hover:bg-muted transition-colors"
              aria-label="Next recommendations"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isPage && products.length > 1 && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={() => swiper?.slidePrev()}
            disabled={isBeginning}
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
            disabled={isEnd}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer hover:bg-muted transition-colors"
            aria-label="Next recommendations"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      <Swiper
        modules={[A11y]}
        slidesPerView={1}
        spaceBetween={12}
        watchOverflow
        resizeObserver
        breakpoints={isPage ? {
          640: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 3, spaceBetween: 20 },
          1280: { slidesPerView: 4, spaceBetween: 24 },
        } : undefined}
        onSwiper={(instance) => {
          setSwiper(instance);
          setIsBeginning(instance.isBeginning);
          setIsEnd(instance.isEnd);
        }}
        onSlideChange={(instance) => {
          setIsBeginning(instance.isBeginning);
          setIsEnd(instance.isEnd);
        }}
        onResize={(instance) => {
          setIsBeginning(instance.isBeginning);
          setIsEnd(instance.isEnd);
        }}
        className="pb-1 w-full"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} className="h-auto">
            <RecommendationCard
              product={product}
              compact
              onNavigateAway={onNavigateAway}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

function RecommendationCard({
  product,
  compact = false,
  onNavigateAway,
}: {
  product: RecommendedProduct;
  compact?: boolean;
  onNavigateAway: () => void;
}) {
  const variantId = product.variant?.id;
  const canAdd = Boolean(variantId && product.variant?.availableForSale);

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border transition-all duration-300 flex items-stretch relative h-[120px]">

      {/* IMAGE — with icon-only ATC button on mobile (absolute bottom-right) */}
      <div className="no-underline block w-32 shrink-0 relative">
        <Link
          to={`/products/${product.handle}`}
          onClick={onNavigateAway}
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

      </div>

      {/* CONTENT */}
      <div className="flex flex-col gap-1.5 flex-1 px-4 py-3">

        {/* TITLE */}
        <Link
          to={`/products/${product.handle}`}
          onClick={onNavigateAway}
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

        {/* Add to Bag button — shown on all screen sizes */}
        {canAdd && variantId && (
          <div className="mt-auto">
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
  const wasSubmitted = useRef(false);

  useEffect(() => {
    if (fetcher.state === 'submitting') wasSubmitted.current = true;
    if (wasSubmitted.current && fetcher.state === 'idle') {
      wasSubmitted.current = false;
      showNotification(productTitle);
    }
  }, [fetcher.state, showNotification, productTitle]);

  const isAdding = fetcher.state !== 'idle';

  return (
    <button
      type="submit"
      disabled={isAdding}
      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-black border border-black text-white rounded-full text-[10px] uppercase tracking-widest font-medium hover:bg-stone-800 hover:border-stone-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 group/atcbtn"
    >
      {isAdding ? (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
          <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ) : (
        <img src="/icons/add-bag.png" alt="" className="w-3.5 h-3.5 object-contain invert transition-all" />
      )}
      {isAdding ? 'Adding…' : 'Add to Bag'}
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
