import type { Route } from './+types/collections.all';
import { useLoaderData } from 'react-router';
import { getPaginationVariables, Image, Money } from '@shopify/hydrogen';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import type { CollectionItemFragment } from 'storefrontapi.generated';
import { useState } from 'react';

export const meta: Route.MetaFunction = () => {
  return [{ title: `All Products | Devasutra — Sacred Living` }];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return { ...deferredData, ...criticalData };
}

async function loadCriticalData({ context, request }: Route.LoaderArgs) {
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, { pageBy: 8 });
  const [{ products }] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: { ...paginationVariables },
    }),
  ]);
  return { products };
}

function loadDeferredData({ context }: Route.LoaderArgs) {
  return {};
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Best Selling', value: 'best-selling' },
];

const FILTER_GROUPS = [
  {
    label: 'Category',
    options: ['Karingali', 'Rudraksha', 'Bracelets'],
  },
  {
    label: 'Price Range',
    options: ['Under ₹500', '₹500 – ₹1,500', '₹1,500 – ₹5,000', 'Above ₹5,000'],
  },
];

// ─── Filter Sidebar ───────────────────────────────────────────────────────────

function FilterSidebar({
  activeFilters,
  onToggleFilter,
}: {
  activeFilters: string[];
  onToggleFilter: (f: string) => void;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm sticky top-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400">Filters</h2>
        {activeFilters.length > 0 && (
          <button
            onClick={() => activeFilters.forEach(onToggleFilter)}
            className="text-[10px] text-white tracking-wide underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {FILTER_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 font-semibold mb-3">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.options.map((opt) => {
                const isActive = activeFilters.includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2.5 cursor-pointer group"
                    onClick={() => onToggleFilter(opt)}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${isActive
                          ? 'bg-white border-white'
                          : 'border-neutral-600 group-hover:border-white'
                        }`}
                    >
                      {isActive && (
                        <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs transition-colors ${isActive ? 'text-white font-medium' : 'text-neutral-400 group-hover:text-white'}`}>
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-neutral-800">
        <div className="bg-neutral-800 rounded-xl p-3 text-center">
          <p className="text-[10px] tracking-widest uppercase text-white font-semibold mb-1">Free Shipping</p>
          <p className="text-[11px] text-neutral-400">On all orders above ₹999</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Collection() {
  const { products } = useLoaderData<typeof loader>();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sort, setSort] = useState('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  function toggleFilter(f: string) {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-white">

      {/* ── Hero ── */}
      <div className="relative bg-neutral-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neutral-400 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="w-[500px] h-[500px] border border-white rounded-full" />
          <div className="absolute w-[320px] h-[320px] border border-white rounded-full" />
          <div className="absolute w-[160px] h-[160px] border border-white rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-neutral-400 mb-3">
            ✦ Handpicked & Energised ✦
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            All Products
          </h1>
          <p className="text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Discover our complete collection of authentic sacred items — each product carefully sourced, lab-certified, and energised with Vedic rituals.
          </p>
          <div className="flex items-center justify-center gap-2 mt-5 text-xs text-neutral-500">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span className="text-neutral-700">›</span>
            <span className="text-white">All Products</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex gap-8 items-start">

          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
            <FilterSidebar activeFilters={activeFilters} onToggleFilter={toggleFilter} />
          </aside>

          {/* Mobile filter drawer */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <div className="absolute left-0 top-0 h-full w-72 bg-neutral-900 shadow-xl overflow-y-auto p-5 border-r border-neutral-800">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400">Filters</h2>
                  <button onClick={() => setMobileFiltersOpen(false)} className="text-neutral-400 hover:text-white text-2xl leading-none">×</button>
                </div>
                <FilterSidebar activeFilters={activeFilters} onToggleFilter={toggleFilter} />
              </div>
            </div>
          )}

          {/* Main column */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-neutral-700 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5m6 3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5" />
                  </svg>
                  Filters
                </button>
                <p className="text-xs text-neutral-400 tracking-wide">Browsing all products</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest uppercase text-neutral-400 hidden sm:block">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="text-xs border border-neutral-800 rounded-xl px-3 py-2 bg-neutral-900 text-white focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter pills */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeFilters.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-800 text-white text-xs rounded-full border border-neutral-700"
                  >
                    {f}
                    <button onClick={() => toggleFilter(f)} className="hover:text-neutral-400 transition-colors leading-none">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Product grid */}
            <PaginatedResourceSection<CollectionItemFragment>
              connection={products}
              resourcesClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
            >
              {({ node: product, index }) => (
                <a
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="group bg-neutral-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
                >
                  {/* Image */}
                  <div className="aspect-square bg-neutral-800 overflow-hidden relative">
                    {product.featuredImage ? (
                      <Image
                        data={product.featuredImage}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                        loading={index < 8 ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        <span className="text-5xl opacity-20 text-white">✦</span>
                      </div>
                    )}
                    {/* Hover corner ornaments */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-neutral-400 rounded-tl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-neutral-400 rounded-br pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* Certified badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-black text-[9px] font-bold tracking-wider uppercase rounded-full">
                        ✓ Certified
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3.5 flex flex-col flex-1">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-400 mb-1">Devasutra</p>
                    <h3
                      className="text-sm font-semibold text-white mb-2 leading-snug line-clamp-2"
                    >
                      {product.title}
                    </h3>
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                        </svg>
                      ))}
                      <span className="text-[10px] text-neutral-400 ml-1">(4.9)</span>
                    </div>
                    {/* Price + arrow */}
                    <div className="mt-auto flex items-center justify-between">
                      <div>
                        <Money
                          data={product.priceRange.minVariantPrice}
                          className="text-sm font-bold text-white"
                        />
                        {product.priceRange.maxVariantPrice.amount !== product.priceRange.minVariantPrice.amount && (
                          <span className="text-[10px] text-neutral-400 ml-1">onwards</span>
                        )}
                      </div>
                      <span className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white transition-all duration-300 hover:bg-neutral-700">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </a>
              )}
            </PaginatedResourceSection>

            {/* Empty state */}
            {!products?.nodes?.length && (
              <div className="text-center py-24">
                <span className="text-6xl text-neutral-800 block mb-4">✦</span>
                <h3 className="text-xl font-bold text-white mb-2">
                  No products found
                </h3>
                <p className="text-sm text-neutral-400 mb-6">Try adjusting your filters or browse all categories.</p>
                <a
                  href="/collections/all"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-wider uppercase rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Browse All
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GraphQL ──────────────────────────────────────────────────────────────────

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyCollectionItem
      }
      maxVariantPrice {
        ...MoneyCollectionItem
      }
    }
  }
` as const;

const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...CollectionItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
` as const;