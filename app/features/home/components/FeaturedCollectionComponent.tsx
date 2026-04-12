import { useState, useRef, useEffect } from 'react';
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

// ─── Add to Cart Button ───────────────────────────────────────────────────────
/**
 * Uses CartForm with a unique fetcherKey per product — exactly the same
 * pattern as QuickViewModal. This is why QuickViewModal works and raw
 * useFetcher posted to /cart does not: CartForm targets the cart route's
 * action internally via Hydrogen's cart handler, not the current page action.
 */
function AddToCartButton({ product }: { product: ProductNode }) {
  const firstVariant = product.variants?.nodes?.[0];
  const isAvailable =
    firstVariant?.availableForSale ?? product.availableForSale !== false;

  if (!firstVariant || !isAvailable) {
    return (
      <div className="mt-2.5 w-full py-2 text-center text-[9px] font-medium tracking-widest uppercase text-muted-foreground border border-border rounded-full select-none">
        Sold Out
      </div>
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
    <button
      type="submit"
      disabled={isAdding}
      onClick={() => {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1800);
      }}
      className={[
        'w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-full shrink-0',
        'bg-white border border-black transition-all duration-200 ease-out cursor-pointer select-none',
        'hover:bg-black group/atc',
        isAdding
          ? 'opacity-60 scale-[0.97] cursor-not-allowed'
          : justAdded
            ? 'scale-[0.97]'
            : 'active:scale-[0.96]',
      ].join(' ')}
      aria-label="Add to cart"
    >
      {isAdding ? (
        <svg
          className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4 text-black group-hover/atc:text-white"
          viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : justAdded ? (
        <svg
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black group-hover/atc:text-white"
          viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <img
          src="/icons/add-bag.png"
          alt="Add to cart"
          className="w-5 h-5 sm:w-7 sm:h-7 object-contain group-hover/atc:invert"
        />
      )}
    </button>
  );
}

export function FeaturedCollectionComponent({ collection, reviewSummaries }: FeaturedCollectionProps) {
  const [sortKey, setSortKey] = useState('price-asc');
  const [quickViewProduct, setQuickViewProduct] = useState<ProductNode | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);

  const sortButtonRef = useRef<HTMLDivElement>(null);
  const products = [...collection.products.nodes];

  const sortedProducts = (() => {
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
  })();

  const sortOptions = [
    { value: 'price-asc', label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
    { value: 'az', label: 'Name: A → Z' },
    { value: 'za', label: 'Name: Z → A' },
  ];

  const visibleProducts = sortedProducts.slice(0, visibleCount);

  return (
    <div className="relative bg-gray-50 bg-background text-foreground flex flex-col lg:h-full lg:overflow-hidden">

      {/* ── HEADER ── */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-8 xl:px-14 pt-8 lg:pt-10 xl:pt-12 pb-6 lg:pb-8 xl:pb-10 border-b border-border shrink-0">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl font-medium leading-tight uppercase tracking-tight mb-2 lg:mb-3 font-heading">
          {collection.title}
        </h2>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs sm:text-sm xl:text-xl uppercase font-medium tracking-wider text-gold-muted">
            Top Picks This Season
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
                setVisibleCount(6);
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

      {/* ── GRID ── */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-8 xl:px-14 py-4 sm:py-6 xl:py-8 flex-1 lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/*
          Mobile:  2 columns, compact cards, no horizontal scroll
          Tablet:  3 columns
          Desktop: 3 columns
        */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-3 xl:gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => {
            const isHovered = hoveredId === product.id;
            const isUnavailable = product.availableForSale === false;

            /**
             * IMAGE SWAP:
             * After adding images(first:2) to the query:
             *   images.nodes[0] === featuredImage  → primary (always shown)
             *   images.nodes[1]                    → secondary (shown on hover)
             *
             * We skip nodes[0] and grab nodes[1] directly.
             * If undefined, no swap happens — primary just zooms.
             */
            const secondaryImage = product.images?.nodes?.[1] ?? null;

            return (
              <div
                key={product.id}
                className="group/card relative bg-card text-card-foreground rounded-2xl overflow-hidden flex flex-col border hover:-translate-y-0.5 transition-all duration-300 ease-out"
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* ── IMAGE ── */}
                <Link to={`/products/${product.handle}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-stone-100 m-1.5 sm:m-2 xl:m-2.5 rounded-xl">

                    {/* Primary image — fades out when hovered + secondary exists */}
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

                    {/* Secondary image — always rendered, fades in on hover */}
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

                    {/* Gradient vignette */}
                    <div
                      className="absolute inset-0 bg-linear-to-t from-stone-900/15 to-transparent pointer-events-none"
                      style={{
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.4s ease',
                        zIndex: 3,
                      }}
                    />

                    {/* Sold out badge */}
                    {isUnavailable && (
                      <span
                        className="absolute top-2 left-2 text-[8px] sm:text-[9px] font-medium tracking-wider uppercase px-2 py-0.5 sm:px-3 sm:py-1 bg-card/90 text-muted-foreground border border-border rounded-full backdrop-blur-sm"
                        style={{ zIndex: 4 }}
                      >
                        Sold Out
                      </span>
                    )}

                    {/* Star Rating badge — top-right of image */}
                    {(() => {
                      const pid = String(product.id).split('/').pop();
                      const summary = pid ? reviewSummaries?.[pid] : undefined;
                      return summary ? (
                        <StarRating
                          rating={summary.averageRating}
                          count={summary.reviewCount}
                          className="absolute top-2 right-2 z-[4]"
                        />
                      ) : null;
                    })()}

                    {/* Eye / Quick View — bottom-right of image, slides up on hover */}
                    {!isUnavailable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuickViewProduct(product);
                        }}
                        aria-label="Quick view"
                        className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-border bg-card/85 hover:bg-foreground hover:text-background backdrop-blur-sm group/eye"
                        style={{
                          opacity: isHovered ? 1 : 0,
                          transform: isHovered ? 'translateY(0px)' : 'translateY(8px)',
                          transition: 'opacity 0.3s ease, transform 0.3s ease, background-color 0.2s ease',
                          zIndex: 4,
                        }}
                      >
                        <svg
                          width="14" height="14" viewBox="0 0 24 24"
                          fill="none" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round"
                          className="stroke-stone-800 dark:stroke-stone-200 group-hover/eye:stroke-white dark:group-hover/eye:stroke-stone-900 transition-colors duration-150"
                        >
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
                      <span className="block text-sm sm:text-base xl:text-lg font-medium text-foreground mt-0.5 leading-none">
                        <Money withoutTrailingZeros data={product.priceRange.minVariantPrice as any} />
                      </span>
                    </Link>
                  </div>

                  <div className="shrink-0 flex items-center justify-center">
                    <AddToCartButton product={product} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── VIEW MORE BUTTON ── */}
        {visibleCount < sortedProducts.length && (
          <div className="mt-8 sm:mt-10 flex justify-center">
            <button
              onClick={() => setVisibleCount(sortedProducts.length)}
              className="px-8 py-3 w-full sm:w-auto rounded-full text-[10px] font-medium tracking-widest uppercase text-foreground bg-transparent border border-border hover:bg-foreground hover:text-background transition-all duration-300 cursor-pointer"
            >
              View More ({sortedProducts.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div className="mt-8 sm:mt-10 pt-5 flex items-center justify-between border-t border-border">
          <span className="text-[10px] tracking-widest uppercase text-black">
            {sortedProducts.length} products
          </span>
          <Link
            to={`/collections/${collection.handle}`}
            className="group inline-flex items-center gap-2.5 rounded-full border border-foreground/12 bg-background/85 px-4 py-2.5 sm:px-5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/85 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.55)] transition-all duration-200 hover:border-foreground/20 hover:bg-muted/55 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:ring-offset-2"
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
