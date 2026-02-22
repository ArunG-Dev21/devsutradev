import { useState, useRef } from 'react';
import { Image, Money } from '@shopify/hydrogen';
import { Link } from 'react-router';
import { QuickViewModal } from '~/components/QuickViewModal';

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  availableForSale?: boolean;
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number;
    height?: number;
  } | null;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: any };
  };
  compareAtPriceRange?: {
    minVariantPrice: { amount: string; currencyCode: any };
  };
};

interface FeaturedCollectionProps {
  collection: {
    title: string;
    handle: string;
    products: {
      nodes: ProductNode[];
    };
  };
}

export function FeaturedCollectionComponent({
  collection,
}: FeaturedCollectionProps) {
  const [sortKey, setSortKey] = useState('featured');
  const [quickViewProduct, setQuickViewProduct] = useState<ProductNode | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sortDropdownPos, setSortDropdownPos] = useState({ top: 0, right: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  const products = [...collection.products.nodes];

  const sortedProducts = (() => {
    switch (sortKey) {
      case 'price-asc':
        return products.sort(
          (a, b) =>
            parseFloat(a.priceRange.minVariantPrice.amount) -
            parseFloat(b.priceRange.minVariantPrice.amount)
        );
      case 'price-desc':
        return products.sort(
          (a, b) =>
            parseFloat(b.priceRange.minVariantPrice.amount) -
            parseFloat(a.priceRange.minVariantPrice.amount)
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
    <div className="relative flex flex-col overflow-hidden bg-gradient-to-br from-black via-neutral-950 to-neutral-900">
      {/* Glow Trail */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl bg-white" />

      {/* HEADER */}
      <div className="flex-none px-6 md:px-10 lg:px-14 pt-10 pb-6 backdrop-blur-xl border-b border-white/10 bg-white/[0.02]">
        <h2
          className="text-5xl md:text-6xl font-semibold leading-tight mb-6 text-white"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {collection.title}
        </h2>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p
            className="text-xl text-white font-bold tracking-[0.22em] uppercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Discover What Calls You
          </p>

          {/* Sort Button */}
          <button
            ref={sortButtonRef}
            onClick={handleSortToggle}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wider text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="opacity-60"
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
              className={`transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* GRID */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-14 py-10"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedProducts.map((product) => {
            const isHovered = hoveredId === product.id;
            const isUnavailable = product.availableForSale === false;

            return (
              <div
                key={product.id}
                className="group relative rounded-2xl overflow-hidden transition-all duration-500 bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl"
                style={{
                  transform: isHovered ? 'translateY(-6px)' : 'none',
                }}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Link to={`/products/${product.handle}`}>
                  <div className="aspect-[4/5] overflow-hidden">
                    {product.featuredImage && (
                      <Image
                        data={product.featuredImage}
                        className="w-full h-full object-cover transition-transform duration-700"
                        style={{
                          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                        }}
                      />
                    )}
                  </div>

                  <div className="px-5 py-4">
                    <h3
                      className="text-[15px] font-semibold mb-1 transition-colors duration-200"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        color: isHovered ? '#dfdfdf' : 'white',
                      }}
                    >
                      {product.title}
                    </h3>

                    <span className="text-white/80 text-[14px] font-semibold">
                      <Money data={product.priceRange.minVariantPrice as any} />
                    </span>
                  </div>
                </Link>

                {/* Plus Icon — opens Quick View */}
                {!isUnavailable && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setQuickViewProduct(product);
                    }}
                    className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-white/20 backdrop-blur-md"
                    style={{
                      background: isHovered
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(255,255,255,0.1)',
                    }}
                    aria-label="Quick view"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 flex items-center justify-end border-t border-white/[0.08]">
          <Link
            to={`/collections/${collection.handle}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold tracking-[0.25em] uppercase border border-white/20 text-white hover:bg-white/5 hover:border-white/40 transition-all duration-200"
          >
            Explore Full Collection →
          </Link>
        </div>
      </div>

      {/* Sort Dropdown — fixed, renders above ALL stacking contexts including backdrop-blur cards */}
      {isSortOpen && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsSortOpen(false)}
          />
          <div
            className="fixed z-[101] w-56 py-1.5 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl shadow-black/60"
            style={{ top: sortDropdownPos.top, right: sortDropdownPos.right }}
          >
            <p className="px-5 py-2 text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold border-b border-white/5 mb-1">
              Sort By
            </p>
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortKey(option.value);
                  setIsSortOpen(false);
                }}
                className={`w-full text-left px-5 py-2.5 text-[13px] transition-colors duration-150 hover:bg-white/5 flex items-center justify-between ${sortKey === option.value
                    ? 'text-white font-semibold'
                    : 'text-white/80'
                  }`}
              >
                {option.label}
                {sortKey === option.value && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}