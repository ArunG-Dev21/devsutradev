import { useState, useRef } from 'react';
import { Image, Money, CartForm } from '@shopify/hydrogen';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';
import { Link } from 'react-router';
import { QuickViewModal } from '~/components/QuickViewModal';

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
}

// ─── Add to Cart Button ───────────────────────────────────────────────────────
/**
 * Uses CartForm with a unique fetcherKey per product — exactly the same
 * pattern as QuickViewModal. This is why QuickViewModal works and raw
 * useFetcher posted to /cart does not: CartForm targets the cart route's
 * action internally via Hydrogen's cart handler, not the current page action.
 */
function AddToCartButton({ product }: { product: ProductNode }) {
  const [justAdded, setJustAdded] = useState(false);

  const firstVariant = product.variants?.nodes?.[0];
  const isAvailable =
    firstVariant?.availableForSale ?? product.availableForSale !== false;

  if (!firstVariant || !isAvailable) {
    return (
      <div className="mt-3 w-full py-2.5 text-center text-[10px] font-medium tracking-widest uppercase text-muted-foreground border border-border rounded-full select-none">
        Sold Out
      </div>
    );
  }

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{
        lines: [{ merchandiseId: firstVariant.id, quantity: 1 }],
      }}
      // Unique key per product so multiple cards don't share fetcher state
      fetcherKey={`add-to-cart-${product.id}`}
    >
      {(fetcher) => {
        const isAdding = fetcher.state !== 'idle';

        // After fetcher returns to idle with data, flash "Added" for 1.8s
        if (!isAdding && fetcher.data && !justAdded) {
          // no-op: justAdded is set on click, cleared by timeout
        }

        return (
          <button
            type="submit"
            disabled={isAdding}
            onClick={() => {
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1800);
            }}
            className={[
              'mt-3 w-full py-2.5 rounded-full',
              'text-[10px] font-medium tracking-widest uppercase',
              'flex items-center justify-center gap-1.5',
              'border transition-all duration-300 cursor-pointer select-none',
              isAdding
                ? 'bg-muted border-border text-muted-foreground scale-[0.97] cursor-not-allowed'
                : justAdded
                  ? 'bg-foreground border-foreground text-background scale-[0.97]'
                  : 'bg-foreground border-foreground text-background hover:bg-background hover:border-foreground hover:text-foreground active:scale-[0.96]',
            ].join(' ')}
          >
            {isAdding ? (
              <>
                <svg
                  className="animate-spin"
                  width="11" height="11" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Adding…
              </>
            ) : justAdded ? (
              <>
                <svg
                  width="11" height="11" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Added
              </>
            ) : (
              'Add to Cart'
            )}
          </button>
        );
      }}
    </CartForm>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FeaturedCollectionComponent({ collection }: FeaturedCollectionProps) {
  const [sortKey, setSortKey] = useState('featured');
  const [quickViewProduct, setQuickViewProduct] = useState<ProductNode | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sortDropdownPos, setSortDropdownPos] = useState({ top: 0, right: 0 });
  const [visibleCount, setVisibleCount] = useState(6);

  const sortButtonRef = useRef<HTMLButtonElement>(null);
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
    { value: 'featured', label: 'Featured' },
    { value: 'price-asc', label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
    { value: 'az', label: 'Name: A → Z' },
    { value: 'za', label: 'Name: Z → A' },
  ];

  const visibleProducts = sortedProducts.slice(0, visibleCount);

  const handleSortToggle = () => {
    if (sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      setSortDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsSortOpen((prev) => !prev);
  };

  return (
    <div className="relative bg-background text-foreground flex flex-col lg:h-full lg:overflow-hidden">

      {/* ── HEADER ── */}
      <div className="px-6 md:px-10 lg:px-14 pt-16 pb-6 border-b border-border flex-shrink-0">
        <h2
          className="text-5xl md:text-6xl lg:text-5xl font-medium leading-tight tracking-tight mb-3 font-heading"
        >
          {collection.title}
        </h2>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="text-xl uppercase font-light tracking-wider">
            Top Picks This Season
          </span>

          <button
            ref={sortButtonRef}
            onClick={handleSortToggle}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-medium tracking-wider uppercase text-foreground bg-transparent border border-border hover:bg-foreground hover:text-background transition-all duration-200 cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            {sortOptions.find((o) => o.value === sortKey)?.label ?? 'Sort'}
            <svg
              width="11" height="11" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="px-6 md:px-10 lg:px-14 py-8 flex-1 lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-x-visible md:snap-none md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                className="relative bg-card text-card-foreground rounded-2xl overflow-hidden flex flex-col border border-border shadow-sm hover:shadow-md transition-shadow duration-300 min-w-[280px] w-[80vw] flex-shrink-0 snap-center md:w-auto md:min-w-0"
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* ── IMAGE ── */}
                <Link to={`/products/${product.handle}`} className="block">
                  <div className="relative aspect-[1/1] overflow-hidden bg-stone-100">

                    {/* Primary image — fades out when hovered + secondary exists */}
                    {product.featuredImage && (
                      <Image
                        data={product.featuredImage}
                        className="absolute inset-0 w-full h-full object-cover"
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
                      className="absolute inset-0 bg-gradient-to-t from-stone-900/15 to-transparent pointer-events-none"
                      style={{
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.4s ease',
                        zIndex: 3,
                      }}
                    />

                    {/* Sold out badge */}
                    {isUnavailable && (
                      <span
                        className="absolute top-3 left-3 text-[9px] font-medium tracking-wider uppercase px-3 py-1 bg-card/90 text-muted-foreground border border-border rounded-full backdrop-blur-sm"
                        style={{ zIndex: 4 }}
                      >
                        Sold Out
                      </span>
                    )}

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
                        className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center border border-border bg-card/85 hover:bg-foreground hover:text-background backdrop-blur-sm group/eye"
                        style={{
                          opacity: isHovered ? 1 : 0,
                          transform: isHovered ? 'translateY(0px)' : 'translateY(8px)',
                          transition: 'opacity 0.3s ease, transform 0.3s ease, background-color 0.2s ease',
                          zIndex: 4,
                        }}
                      >
                        <svg
                          width="16" height="16" viewBox="0 0 24 24"
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
                <div className="px-4 pt-3 pb-5 flex flex-col">
                  <Link to={`/products/${product.handle}`} className="flex flex-col gap-0.5">
                    <p
                      className="text-[1rem] font-normal leading-snug text-foreground tracking-wide"
                    >
                      {product.title}
                    </p>
                    <span className="text-sm text-muted-foreground">
                      <Money data={product.priceRange.minVariantPrice as any} />
                    </span>
                  </Link>

                  <AddToCartButton product={product} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── VIEW MORE BUTTON ── */}
        {visibleCount < sortedProducts.length && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="px-8 py-3 w-full sm:w-auto rounded-full text-[10px] font-medium tracking-widest uppercase text-foreground bg-transparent border border-border hover:bg-foreground hover:text-background transition-all duration-300 cursor-pointer"
            >
              View More
            </button>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div className="mt-10 pt-6 flex items-center justify-between border-t border-border">
          <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
            {sortedProducts.length} products
          </span>
          <Link
            to={`/collections/${collection.handle}`}
            className="inline-flex items-center gap-2 text-[10px] font-medium tracking-widest uppercase text-muted-foreground border-b border-border pb-0.5 hover:text-foreground hover:border-foreground transition-all duration-200"
          >
            Explore Full Collection
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── SORT DROPDOWN ── */}
      {/* ── SORT DROPDOWN ── */}
      {isSortOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close sort dropdown"
            onClick={() => setIsSortOpen(false)}
          />

          <div
            className="
        fixed z-50 w-52 rounded-xl overflow-hidden
        bg-card
        border border-border
        shadow-xl
      "
            style={{ top: sortDropdownPos.top, right: sortDropdownPos.right }}
          >
            <p className="
        px-5 pt-3 pb-2 text-[9px] tracking-widest uppercase font-medium
        text-muted-foreground
        border-b border-border
      ">
              Sort By
            </p>

            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortKey(option.value);
                  setVisibleCount(6);
                  setIsSortOpen(false);
                }}
                className={`
            w-full text-left px-5 py-2.5 text-xs flex items-center justify-between
            transition-colors duration-150 cursor-pointer
            hover:bg-muted
            ${sortKey === option.value
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                  }
          `}
              >
                {option.label}

                {sortKey === option.value && (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-foreground"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── QUICK VIEW MODAL ── */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
