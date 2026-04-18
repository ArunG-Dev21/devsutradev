import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Image, Money, CartForm } from '@shopify/hydrogen';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';
import { Link } from 'react-router';
import { QuickViewModal } from '~/features/product/components/QuickViewModal';
import { useCartNotification } from '~/features/cart/components/CartNotification';
import { StarRating } from '~/shared/components/StarRating';

// ─── Types ────────────────────────────────────────────────────────────────────

type ImageNode = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

type ProductVariant = {
  id: string;
  availableForSale: boolean;
  title?: string;
  price?: { amount: string; currencyCode: CurrencyCode };
};

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  availableForSale?: boolean;
  featuredImage?: ImageNode | null;
  images?: { nodes: ImageNode[] };
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: CurrencyCode };
  };
  compareAtPriceRange?: {
    minVariantPrice: { amount: string; currencyCode: CurrencyCode };
  };
  variants?: { nodes: ProductVariant[] };
};

interface FeaturedCollectionProps {
  collection: {
    title: string;
    handle: string;
    products: { nodes: ProductNode[] };
  };
  reviewSummaries?: Record<string, { averageRating: number; reviewCount: number }>;
}

// ─── Shared ATC icon button style ────────────────────────────────────────────
function ATCIconButton({
  isAdding,
  justAdded,
  onClick,
  disabled,
  ariaLabel = 'Add to cart',
  size = 'md',
  buttonType = 'submit',
}: {
  isAdding: boolean;
  justAdded?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  buttonType?: 'submit' | 'button';
}) {
  const sizeClasses = size === 'sm'
    ? 'w-8 h-8 sm:w-9 sm:h-9'
    : 'w-8 h-8 sm:w-12 sm:h-12';
  const iconSize = size === 'sm'
    ? 'w-4 h-4 sm:w-5 sm:h-5'
    : 'w-5 h-5 sm:w-7 sm:h-7';

  return (
    <button
      type={buttonType}
      disabled={disabled || isAdding}
      onClick={onClick}
      className={[
        sizeClasses,
        'flex items-center justify-center rounded-full shrink-0',
        'bg-white border border-black transition-all duration-200 ease-out cursor-pointer select-none',
        'hover:bg-black group/atc',
        isAdding
          ? 'opacity-60 scale-[0.97] cursor-not-allowed'
          : justAdded
            ? 'scale-[0.97]'
            : 'active:scale-[0.96]',
      ].join(' ')}
      aria-label={ariaLabel}
    >
      {isAdding ? (
        <svg
          className={`animate-spin ${size === 'sm' ? 'w-3 h-3 sm:w-3.5 h-3.5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} text-black group-hover/atc:text-white`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : justAdded ? (
        <svg
          className={`${size === 'sm' ? 'w-3 h-3 sm:w-3.5 h-3.5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} text-black group-hover/atc:text-white`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <img
          src="/icons/add-bag.png"
          alt={ariaLabel}
          className={`${iconSize} object-contain group-hover/atc:invert`}
        />
      )}
    </button>
  );
}

// ─── Size pill inner — must be a real component so useEffect works ────────────
function SizePillInner({
  fetcher,
  variant,
  productTitle,
  productImage,
  onAdded,
}: {
  fetcher: any;
  variant: ProductVariant;
  productTitle: string;
  productImage?: ImageNode | null;
  onAdded: () => void;
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef<string>('idle');

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage || undefined);
      onAdded();
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle, productImage, onAdded]);

  const isAdding = fetcher.state !== 'idle';

  return (
    <button
      type="submit"
      disabled={!variant.availableForSale || isAdding}
      className={[
        'px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-medium tracking-wide uppercase border transition-all duration-150 cursor-pointer select-none',
        !variant.availableForSale
          ? 'border-border text-muted-foreground/40 line-through cursor-not-allowed'
          : isAdding
            ? 'border-foreground bg-foreground text-background opacity-70 cursor-not-allowed'
            : 'border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background active:scale-95',
      ].join(' ')}
      aria-label={`Add size ${variant.title ?? ''} to cart`}
    >
      {isAdding ? (
        <svg className="animate-spin w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
        </svg>
      ) : (
        variant.title ?? '—'
      )}
    </button>
  );
}

// ─── Size pill form wrapper ───────────────────────────────────────────────────
function SizePillForm({
  variant,
  productTitle,
  productImage,
  productId,
  onAdded,
}: {
  variant: ProductVariant;
  productTitle: string;
  productImage?: ImageNode | null;
  productId: string;
  onAdded: () => void;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{ lines: [{ merchandiseId: variant.id, quantity: 1 }] }}
      fetcherKey={`add-size-${productId}-${variant.id}`}
    >
      {(fetcher) => (
        <SizePillInner
          fetcher={fetcher}
          variant={variant}
          productTitle={productTitle}
          productImage={productImage}
          onAdded={onAdded}
        />
      )}
    </CartForm>
  );
}

// ─── Add to Cart Button ───────────────────────────────────────────────────────
/**
 * If the product has >1 variant, shows an inline size picker row on first click.
 * Single-variant products add to cart directly.
 */
function AddToCartButton({
  product,
  showSizePicker,
  onToggleSizePicker,
}: {
  product: ProductNode;
  showSizePicker: boolean;
  onToggleSizePicker: () => void;
}) {
  const variants = product.variants?.nodes ?? [];
  const firstVariant = variants[0];
  const isAvailable =
    firstVariant?.availableForSale ?? product.availableForSale !== false;
  const hasMultipleVariants = variants.length > 1;

  if (!firstVariant || !isAvailable) {
    return (
      <div className="mt-2.5 w-full py-2 text-center text-[9px] font-medium tracking-widest uppercase text-muted-foreground border border-border rounded-full select-none">
        Sold Out
      </div>
    );
  }

  if (hasMultipleVariants) {
    return (
      <button
        type="button"
        onClick={onToggleSizePicker}
        className={[
          'w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-full shrink-0',
          'border transition-all duration-200 ease-out cursor-pointer select-none group/atc',
          showSizePicker
            ? 'bg-foreground border-foreground text-background'
            : 'bg-white border-black hover:bg-black hover:text-white',
        ].join(' ')}
        aria-label={showSizePicker ? 'Close size picker' : 'Select size'}
      >
        {showSizePicker ? (
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <img
            src="/icons/add-bag.png"
            alt="Select size"
            className="w-5 h-5 sm:w-7 sm:h-7 object-contain group-hover/atc:invert"
          />
        )}
      </button>
    );
  }

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{
        lines: [{ merchandiseId: firstVariant.id, quantity: 1, selectedVariant: firstVariant }],
      }}
      fetcherKey={`add-to-cart-${product.id}`}
    >
      {(fetcher) => (
        <AddToCartInner fetcher={fetcher} productTitle={product.title} productImage={product.featuredImage} />
      )}
    </CartForm>
  );
}

function AddToCartInner({
  fetcher,
  productTitle,
  productImage,
}: {
  fetcher: any;
  productTitle: string;
  productImage?: ImageNode | null;
}) {
  const [justAdded, setJustAdded] = useState(false);
  const { showNotification } = useCartNotification();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage || undefined);
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle, productImage]);

  const isAdding = fetcher.state !== 'idle';

  return (
    <ATCIconButton
      isAdding={isAdding}
      justAdded={justAdded}
      onClick={() => {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1800);
      }}
    />
  );
}

// ─── Product Card (own size-picker state) ─────────────────────────────────────
function ProductCard({
  product,
  reviewSummary,
  onQuickView,
}: {
  product: ProductNode;
  reviewSummary?: { averageRating: number; reviewCount: number };
  onQuickView: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const isUnavailable = product.availableForSale === false;
  const secondaryImage = product.images?.nodes?.[1] ?? null;
  const variants = product.variants?.nodes ?? [];

  const closeSizePicker = useCallback(() => setShowSizePicker(false), []);

  return (
    <div
      className="group/card relative bg-card text-card-foreground rounded-2xl overflow-hidden flex flex-col border hover:-translate-y-0.5 transition-all duration-300 ease-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── IMAGE ── */}
      <Link to={`/products/${product.handle}`} className="block">
        <div className="relative aspect-[1/0.90] overflow-hidden bg-stone-100 m-1.5 sm:m-2 xl:m-2.5 rounded-lg">
          {product.featuredImage && (
            <Image
              data={product.featuredImage}
              className="absolute inset-0 w-full h-full object-cover"
              sizes="(min-width: 1024px) 33vw, 50vw"
              style={{
                opacity: isHovered && secondaryImage ? 0 : 1,
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'opacity 0.55s ease, transform 0.65s ease',
                willChange: 'opacity, transform',
                zIndex: 1,
              }}
            />
          )}
          {secondaryImage && (
            <Image
              data={secondaryImage}
              className="absolute inset-0 w-full h-full object-cover"
              sizes="(min-width: 1024px) 33vw, 50vw"
              style={{
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'scale(1.02)' : 'scale(1.07)',
                transition: 'opacity 0.55s ease, transform 0.65s ease',
                willChange: 'opacity, transform',
                zIndex: 2,
              }}
            />
          )}
          <div
            className="absolute inset-0 bg-linear-to-t from-stone-900/15 to-transparent pointer-events-none"
            style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s ease', zIndex: 3 }}
          />
          {isUnavailable && (
            <span
              className="absolute top-2 left-2 text-[8px] sm:text-[9px] font-medium tracking-wider uppercase px-2 py-0.5 sm:px-3 sm:py-1 bg-card/90 text-muted-foreground border border-border rounded-full backdrop-blur-sm"
              style={{ zIndex: 4 }}
            >
              Sold Out
            </span>
          )}
          {reviewSummary && (
            <StarRating
              rating={reviewSummary.averageRating}
              count={reviewSummary.reviewCount}
              className="absolute top-2 right-2 z-[4]"
            />
          )}
          {!isUnavailable && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(); }}
              aria-label="Quick view"
              className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-border bg-card/85 hover:bg-foreground hover:text-background backdrop-blur-sm group/eye"
              style={{
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'translateY(0px)' : 'translateY(8px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease, background-color 0.2s ease',
                zIndex: 4,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-stone-800 dark:stroke-stone-200 group-hover/eye:stroke-white dark:group-hover/eye:stroke-stone-900 transition-colors duration-150">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          )}
        </div>
      </Link>

      {/* ── INFO + ADD TO CART ── */}
      <div className="relative px-2 sm:px-3 xl:px-4 pb-2 sm:pb-3 xl:pb-4 mt-1 flex items-center gap-1.5 sm:gap-2">
        <div className="min-w-0 flex-1">
          <Link to={`/products/${product.handle}`} className="block">
            <p className="text-xs sm:text-sm xl:text-base font-medium text-foreground line-clamp-2 leading-snug">
              {product.title}
            </p>
            <span className="block text-sm sm:text-base xl:text-lg font-medium text-foreground mt-1.5 leading-none">
              <Money withoutTrailingZeros data={product.priceRange.minVariantPrice as any} />
            </span>
          </Link>
        </div>
        <div className="shrink-0 flex items-center justify-center">
          <AddToCartButton
            product={product}
            showSizePicker={showSizePicker}
            onToggleSizePicker={() => setShowSizePicker((p) => !p)}
          />
        </div>
      </div>

      {/* ── INLINE SIZE PICKER ── */}
      {showSizePicker && variants.length > 1 && (
        <div className="px-2 sm:px-3 xl:px-4 pb-3 sm:pb-4 border-t border-border/40 pt-2.5">
          <p className="text-[8px] sm:text-[9px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-2">
            Select Size
          </p>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((variant) => (
              <SizePillForm
                key={variant.id}
                variant={variant}
                productTitle={product.title}
                productImage={product.featuredImage}
                productId={product.id}
                onAdded={closeSizePicker}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FeaturedCollectionComponent({ collection, reviewSummaries }: FeaturedCollectionProps) {
  const [sortKey, setSortKey] = useState('price-asc');
  const [quickViewProduct, setQuickViewProduct] = useState<ProductNode | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  // hoveredId removed — hover state is now per-card inside ProductCard

  const sortButtonRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const sortedProducts = useMemo(() => {
    const products = [...collection.products.nodes];
    switch (sortKey) {
      case 'price-asc':
        return products.sort((a, b) =>
          parseFloat(a.priceRange.minVariantPrice.amount) -
          parseFloat(b.priceRange.minVariantPrice.amount),
        );
      case 'price-desc':
        return products.sort((a, b) =>
          parseFloat(b.priceRange.minVariantPrice.amount) -
          parseFloat(a.priceRange.minVariantPrice.amount),
        );
      case 'az':
        return products.sort((a, b) => a.title.localeCompare(b.title));
      case 'za':
        return products.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return products;
    }
  }, [collection.products.nodes, sortKey]);

  const sortOptions = [
    { value: 'price-asc', label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
    { value: 'az', label: 'Name: A → Z' },
    { value: 'za', label: 'Name: Z → A' },
  ];

  const getProductScrollStep = useCallback(() => {
    const scroller = scrollerRef.current;
    const firstCard = scroller?.querySelector<HTMLElement>('[data-featured-product-card]');
    const gap = scroller ? parseFloat(window.getComputedStyle(scroller).columnGap || '0') : 0;

    return firstCard && scroller
      ? firstCard.offsetWidth + gap
      : Math.max(240, (scroller?.clientWidth ?? 320) * 0.75);
  }, []);

  const scrollProductsRight = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({ left: getProductScrollStep(), behavior });
  }, [getProductScrollStep]);

  const scrollProductsLeft = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({ left: -getProductScrollStep(), behavior: 'smooth' });
  }, [getProductScrollStep]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollLeft = 0;
  }, [sortKey]);

  return (
    <div className="relative bg-background text-foreground flex flex-col">

      {/* ── HEADER ── */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-6 2xl:px-14 pt-8 lg:pt-6 2xl:pt-12 bg-background lg:sticky lg:top-0 z-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl font-medium leading-tight uppercase tracking-tight mb-2 lg:mb-3 font-heading">
          {collection.title}
        </h2>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs sm:text-sm xl:text-xl uppercase font-medium tracking-wider text-[#F14514]">
            PICK FROM OUR BEST
          </span>

<div className="relative" ref={sortButtonRef}>
  <button
    onClick={() => setIsSortOpen((prev) => !prev)}
    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium tracking-wide uppercase
    text-foreground bg-background border border-border
    hover:bg-muted hover:border-foreground/20
    transition-all duration-200 cursor-pointer"
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="opacity-70"
    >
      <path d="M3 6h18M7 12h10M11 18h2" />
    </svg>

    Sort

    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`transition-transform duration-200 opacity-70 ${
        isSortOpen ? "rotate-180" : ""
      }`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  </button>

  {/* ── SORT DROPDOWN ── */}
  {isSortOpen && (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 w-full h-full cursor-default"
        aria-label="Close sort dropdown"
        onClick={() => setIsSortOpen(false)}
      />

      <div
        className="absolute top-full right-0 mt-3 z-50 w-56 rounded-xl overflow-hidden
        bg-card border border-border shadow-2xl"
      >
        <p
          className="px-5 pt-3 pb-2 text-[10px] tracking-widest uppercase
          font-semibold text-muted-foreground border-b border-border"
        >
          Sort By
        </p>

        <div className="py-1">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSortKey(option.value);
                setIsSortOpen(false);
              }}
              className={`
                w-full text-left px-5 py-3 text-sm flex items-center justify-between
                transition-all duration-150 cursor-pointer rounded-none

                ${
                  sortKey === option.value
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )}
</div>

        </div>
      </div>

      {/* ── HORIZONTAL PRODUCT RAIL ── */}
      <div className="px-3 sm:px-6 md:px-8 lg:px-6 2xl:px-14 py-4 sm:py-6 2xl:py-8">
        <div
          ref={scrollerRef}
          className="grid grid-flow-col grid-rows-2 auto-cols-[calc((100%_-_0.75rem)/2)] xl:auto-cols-[calc((100%_-_2.5rem)/3)] gap-3 sm:gap-4 2xl:gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
          aria-label={`${collection.title} products`}
        >
          {sortedProducts.map((product) => {
            const pid = String(product.id).split('/').pop();
            const summary = pid ? reviewSummaries?.[pid] : undefined;
            return (
              <div
                key={product.id}
                data-featured-product-card
                className="min-w-0 snap-start"
              >
                <ProductCard
                  product={product}
                  reviewSummary={summary}
                  onQuickView={() => setQuickViewProduct(product)}
                />
              </div>
            );
          })}
        </div>

        {/* ── FOOTER ── */}
        <div className="mt-4 flex items-center gap-2 sm:gap-3">
          <Link
            to={`/collections/${collection.handle}`}
            className="group inline-flex min-w-0 flex-1 items-center justify-center gap-2.5 rounded-full border border-foreground/12 bg-background/85 px-4 py-2.5 sm:px-5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/85 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.55)] transition-all duration-200 hover:border-foreground/20 hover:bg-muted/55 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:ring-offset-2"
          >
            <span className="truncate">Explore Full Collection</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              className="w-3.5 h-3.5 text-foreground/55 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          {sortedProducts.length > 2 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={scrollProductsLeft}
                className="w-10 h-10 rounded-full border border-border bg-background text-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors duration-200"
                aria-label="Show previous products"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollProductsRight()}
                className="w-10 h-10 rounded-full border border-foreground bg-foreground text-background flex items-center justify-center hover:bg-background hover:text-foreground transition-colors duration-200"
                aria-label="Show two more products"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK VIEW MODAL ── */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          reviewSummary={(() => {
            const pid = String(quickViewProduct.id).split('/').pop();
            return pid ? reviewSummaries?.[pid] : undefined;
          })()}
        />
      )}
    </div>
  );
}
