import {
  CartForm,
  Money,
  useOptimisticCart,
  type OptimisticCartLine,
} from '@shopify/hydrogen';
import {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useFetcher} from 'react-router';
import {Navigation} from 'swiper/modules';
import {Swiper, SwiperSlide} from 'swiper/react';
import type {Swiper as SwiperType} from 'swiper/types';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {FREE_SHIPPING_THRESHOLD} from '~/lib/constants';
import 'swiper/css';
import 'swiper/css/navigation';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};

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

export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const cart = useOptimisticCart(originalCart);
  const {close} = useAside();

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
      className={`h-full flex ${
        layout === 'page' && cartHasItems
          ? 'flex-col lg:flex-row gap-8 lg:gap-12 items-start'
          : 'flex-col'
      } bg-white`}
    >
      {layout === 'aside' && cartHasItems && (
        <div className="px-5 py-3.5 bg-white border-b border-gray-200">
          {remaining > 0 ? (
            <>
              <p className="text-[11px] text-stone-500 mb-2 tracking-wide">
                Add <span className="font-bold text-stone-900">Rs {remaining.toFixed(0)}</span>{' '}
                more for free shipping
              </p>
              <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-900 rounded-full transition-all duration-500"
                  style={{width: `${shippingProgress}%`}}
                />
              </div>
            </>
          ) : (
            <p className="text-[11px] font-semibold text-stone-900 tracking-wide">
              You qualify for free shipping.
            </p>
          )}
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto ${
          layout === 'aside' ? 'px-5' : 'w-full lg:w-3/5 xl:w-2/3'
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
            <CartRecommendations
              layout={layout}
              excludeProductIds={cartProductIds}
              onNavigateAway={() => layout === 'aside' && close()}
            />
          </div>
        )}
      </div>

      {cartHasItems && (
        <div
          className={`${
            layout === 'page' ? 'w-full lg:w-2/5 xl:w-1/3 lg:sticky lg:top-8' : ''
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
    minVariantPrice: {amount: string; currencyCode: string};
    maxVariantPrice?: {amount: string; currencyCode: string};
  };
  variant?: {id: string; availableForSale: boolean} | null;
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
  const fetcher = useFetcher<{products: RecommendedProduct[]}>();
  const limit = layout === 'aside' ? 8 : 8;
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
    fetcher.load(
      `/api/recommendations?limit=${limit}&exclude=${encodeURIComponent(exclude)}`,
    );
  }, [exclude, fetcher, limit, loadKey]);

  const products = fetcher.data?.products ?? [];
  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-stone-400">
          You may also like
        </p>
        {layout === 'aside' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => swiper?.slidePrev()}
              disabled={!swiper || isBeginning}
              className="w-7 h-7 rounded-full border border-stone-300 text-stone-700 text-xs disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer hover:bg-stone-100 transition-colors"
              aria-label="Previous recommendations"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => swiper?.slideNext()}
              disabled={!swiper || isEnd}
              className="w-7 h-7 rounded-full border border-stone-300 text-stone-700 text-xs disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer hover:bg-stone-100 transition-colors"
              aria-label="Next recommendations"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {layout === 'aside' ? (
        <Swiper
          modules={[Navigation]}
          slidesPerView={1.25}
          spaceBetween={10}
          onSwiper={(instance) => {
            setSwiper(instance);
            setIsBeginning(instance.isBeginning);
            setIsEnd(instance.isEnd);
          }}
          onSlideChange={(instance) => {
            setIsBeginning(instance.isBeginning);
            setIsEnd(instance.isEnd);
          }}
          breakpoints={{
            540: {slidesPerView: 1.5, spaceBetween: 12},
            700: {slidesPerView: 2, spaceBetween: 12},
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
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {products.map((product) => (
            <RecommendationCard
              key={product.id}
              product={product}
              onNavigateAway={onNavigateAway}
            />
          ))}
        </div>
      )}
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
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col border border-neutral-200">
      <Link
        to={`/products/${product.handle}`}
        onClick={onNavigateAway}
        className="no-underline block"
        prefetch="intent"
      >
        <div className="aspect-square bg-neutral-100 overflow-hidden relative">
          {product.featuredImage?.url ? (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
              <span className="text-5xl opacity-20 text-black">*</span>
            </div>
          )}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-neutral-300 rounded-tl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-neutral-300 rounded-br pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-neutral-200 text-black text-[9px] font-bold tracking-wider uppercase rounded-full shadow-sm">
              Certified
            </span>
          </div>
        </div>
      </Link>

      <div className="p-3.5 flex flex-col flex-1">
        {badgeTag ? (
          <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 mb-1">
            {badgeTag}
          </p>
        ) : (
          <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 mb-1">
            Devasutra
          </p>
        )}

        <Link
          to={`/products/${product.handle}`}
          onClick={onNavigateAway}
          className="no-underline"
          prefetch="intent"
        >
          <h3 className="text-sm font-semibold text-black mb-2 leading-snug line-clamp-2">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto">
          <Money
            data={product.priceRange.minVariantPrice}
            className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-black`}
          />
        </div>
      </div>

      {canAdd ? (
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesAdd}
          inputs={{lines: [{merchandiseId: variantId!, quantity: 1}]}}
        >
          <button
            type="submit"
            className="w-full py-3 text-[10px] tracking-[0.18em] uppercase font-semibold bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Add
          </button>
        </CartForm>
      ) : (
        <div className="w-full py-3 text-center text-[10px] tracking-[0.18em] uppercase font-semibold text-stone-400 bg-white border-t border-stone-100">
          Sold out
        </div>
      )}
    </div>
  );
}

function CartEmpty({
  hidden = false,
  layout,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();
  return (
    <div hidden={hidden} className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-5">
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

      <p className="text-base font-semibold text-stone-900 mb-1">Your cart is empty</p>
      <p className="text-xs text-stone-400 mb-8 leading-relaxed">
        Looks like you have not added anything yet.
      </p>

      <Link
        to="/collections/all"
        onClick={close}
        prefetch="viewport"
        className="no-underline inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold tracking-widest uppercase rounded-xl hover:bg-stone-700 transition-colors duration-200"
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

