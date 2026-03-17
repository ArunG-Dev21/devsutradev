import {
  CartForm,
  Money,
  useOptimisticCart,
  type OptimisticCartLine,
} from '@shopify/hydrogen';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useFetcher, type FetcherWithComponents } from 'react-router';
import { useCartNotification } from '~/components/CartNotification';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper/types';
import { CartRecommendationsPage } from './CartRecommendationsPage';
import type { CartApiQueryFragment } from 'storefrontapi.generated';
import { useAside } from '~/components/Aside';
import { CartLineItem, type CartLine } from '~/components/CartLineItem';
import { CartSummary } from './CartSummary';
import { FREE_SHIPPING_THRESHOLD } from '~/lib/constants';
import 'swiper/css';
import 'swiper/css/navigation';

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
            <p className="text-[11px] font-semibold text-foreground tracking-wide">
              You qualify for free shipping.
            </p>
          )}
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto ${layout === 'aside' ? 'px-5' : 'w-full lg:w-3/5 xl:w-2/3'
          }`}
      >
        <CartEmpty hidden={linesCount} layout={layout} />
        <ul>
          {(cart?.lines?.nodes ?? []).map((line) => {
            if ('parentRelationship' in line && line.parentRelationship?.parent) {
              return null;
            }
            return (
              <CartLineItem
                key={line.id}
                line={line}
                layout={layout}
                childrenMap={childrenMap}
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
  const limit = layout === 'aside' ? 8 : 8;
  const exclude = excludeProductIds.join(',');
  const loadKey = `${limit}:${exclude}`;
  const lastLoadedKeyRef = useRef<string | null>(null);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

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
        <p className="text-base tracking-[0.15em] uppercase text-black dark:text-white">
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
        slidesPerView={1}
        spaceBetween={12}
        breakpoints={{
          0: { slidesPerView: 1, spaceBetween: 12 },
          640: { slidesPerView: 1, spaceBetween: 12 },
          1024: { slidesPerView: 1, spaceBetween: 12 },
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
  const badgeTag = product.tags?.[0];

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300 flex items-stretch relative">

      {/* IMAGE */}
      <Link
        to={`/products/${product.handle}`}
        onClick={onNavigateAway}
        className="no-underline block w-28 shrink-0"
        prefetch="intent"
      >
        <div className="h-full bg-muted overflow-hidden relative rounded-l-2xl">
          {product.featuredImage?.url ? (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
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
          onClick={onNavigateAway}
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
            inputs={{ lines: [{ merchandiseId: variantId!, quantity: 1 }] }}
          >
            {(fetcher: FetcherWithComponents<any>) => (
              <RecommendationAddButton
                fetcher={fetcher}
                productTitle={product.title}
              />
            )}
          </CartForm>
        )}

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

      <p className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1">Your cart is empty</p>
      <p className="text-xs text-stone-400 dark:text-stone-500 mb-8 leading-relaxed">
        Looks like you have not added anything yet.
      </p>

      <Link
        to="/collections/all"
        onClick={close}
        prefetch="viewport"
        className="no-underline inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold tracking-widest uppercase rounded-xl hover:bg-stone-700 dark:hover:bg-white transition-colors duration-200"
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
