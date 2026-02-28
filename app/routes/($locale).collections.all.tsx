import type { Route } from './+types/($locale).collections.all';
import { useLoaderData, useSearchParams } from 'react-router';
import { getPaginationVariables, Image, Money } from '@shopify/hydrogen';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';

import { useMemo, useState, useRef, useEffect } from 'react'; type CategoryFilter = {
  id: string;
  label: string;
  handle: string;
};

type PriceFilter = {
  id: string;
  label: string;
  min: number;
  max: number;
};

type FilterOption = {
  id: string;
  label: string;
};

const CATEGORY_FILTERS: CategoryFilter[] = [
  { id: 'karungali', label: 'Karungali', handle: 'karungali' },
  { id: 'Rudraksha', label: 'Rudraksha', handle: 'rudraksha' },
  { id: 'bracelets', label: 'Bracelets', handle: 'bracelets' },
];

const PRICE_FILTERS: PriceFilter[] = [
  { id: 'under-500', label: 'Under Rs 500', min: 0, max: 499.99 },
  { id: '500-1500', label: 'Rs 500 - Rs 1,500', min: 500, max: 1500 },
  { id: '1500-5000', label: 'Rs 1,500 - Rs 5,000', min: 1500, max: 5000 },
  { id: 'above-5000', label: 'Above Rs 5,000', min: 5000.01, max: Number.MAX_SAFE_INTEGER },
];

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Best Selling', value: 'best-selling' },
];

const SORT_MAP: Record<
  string,
  { sortKey: 'BEST_SELLING' | 'PRICE' | 'CREATED_AT'; reverse: boolean }
> = {
  featured: { sortKey: 'BEST_SELLING', reverse: true },
  'best-selling': { sortKey: 'BEST_SELLING', reverse: true },
  'price-asc': { sortKey: 'PRICE', reverse: false },
  'price-desc': { sortKey: 'PRICE', reverse: true },
  newest: { sortKey: 'CREATED_AT', reverse: true },
};

const FILTER_GROUPS: Array<{ id: 'category' | 'price'; label: string; options: FilterOption[] }> = [
  {
    id: 'category',
    label: 'Category',
    options: CATEGORY_FILTERS.map(({ id, label }) => ({ id, label })),
  },
  {
    id: 'price',
    label: 'Price Range',
    options: PRICE_FILTERS.map(({ id, label }) => ({ id, label })),
  },
];

const CATEGORY_BY_ID = new Map(CATEGORY_FILTERS.map((item) => [item.id, item]));
const PRICE_BY_ID = new Map(PRICE_FILTERS.map((item) => [item.id, item]));

export const meta: Route.MetaFunction = () => {
  return [{ title: 'All Products | Devasutra - Sacred Living' }];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return { ...deferredData, ...criticalData };
}

async function loadCriticalData({ context, request }: Route.LoaderArgs) {
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, { pageBy: 8 });
  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') || 'featured';
  const { sortKey, reverse } = SORT_MAP[sort] ?? SORT_MAP.featured;

  const { products } = await storefront.query(CATALOG_QUERY, {
    variables: {
      ...paginationVariables,
      sortKey,
      reverse,
    },
  });

  return { products };
}

function loadDeferredData({ context }: Route.LoaderArgs) {
  return {};
}



function FilterSidebar({
  activeFilterIds,
  onToggleFilter,
  onClearAll,
}: {
  activeFilterIds: string[];
  onToggleFilter: (filterId: string) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm sticky top-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
        <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
          Filters
        </h2>
        {activeFilterIds.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[10px] text-muted-foreground hover:text-foreground tracking-wide hover:underline transition-all underline-offset-4"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-8">
        {FILTER_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs tracking-wider uppercase text-foreground font-semibold mb-4">
              {group.label}
            </p>
            <div className="space-y-3">
              {group.options.map((option) => {
                const isActive = activeFilterIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className="flex items-center gap-3 cursor-pointer group w-full text-left"
                    onClick={() => onToggleFilter(option.id)}
                    aria-pressed={isActive}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${isActive
                        ? 'bg-foreground border-foreground'
                        : 'border-muted-foreground/40 group-hover:border-foreground bg-background'
                        }`}
                    >
                      {isActive && (
                        <svg
                          className="w-3 h-3 text-background"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-[13px] transition-colors ${isActive
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-border/40">
        <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <p className="text-[11px] tracking-widest uppercase text-foreground font-bold mb-1.5 flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
              Free Shipping
            </p>
            <p className="text-xs text-muted-foreground">On all orders above Rs 999</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomSortDropdown({ sort, onSortChange }: { sort: string; onSortChange: (nextSort: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeOption = SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0];
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-[180px] text-left text-xs border border-border rounded-xl px-4 py-2.5 bg-card text-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring cursor-pointer hover:bg-muted/50 transition-colors shadow-sm"
      >
        <span className="truncate block font-medium">{activeOption.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ml-2 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 w-[180px] mt-2 bg-card border border-border rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
          <div className="py-1.5 max-h-60 overflow-auto">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors hover:bg-muted ${sort === option.value ? 'bg-muted/50 font-medium text-foreground' : 'text-muted-foreground'
                  }`}
              >
                <span>{option.label}</span>
                {sort === option.value && (
                  <svg className="w-3.5 h-3.5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Collection() {
  const { products } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const sort = searchParams.get('sort') || 'featured';
  const activePriceIds = searchParams.getAll('price').filter(Boolean);
  const activeFilterIds = useMemo(
    () => [...activeCategoryIds, ...activePriceIds],
    [activeCategoryIds, activePriceIds],
  );

  const labelById = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const item of CATEGORY_FILTERS) labels[item.id] = item.label;
    for (const item of PRICE_FILTERS) labels[item.id] = item.label;
    return labels;
  }, []);

  function toggleFilter(filterId: string) {
    if (CATEGORY_BY_ID.has(filterId)) {
      setActiveCategoryIds((prev) =>
        prev.includes(filterId)
          ? prev.filter((id) => id !== filterId)
          : [...prev, filterId],
      );
      return;
    }

    const key = PRICE_BY_ID.has(filterId) ? 'price' : 'filter';
    const next = new URLSearchParams(searchParams);
    const values = next.getAll(key);

    next.delete(key);
    if (values.includes(filterId)) {
      values.filter((value) => value !== filterId).forEach((value) => next.append(key, value));
    } else {
      values.forEach((value) => next.append(key, value));
      next.append(key, filterId);
    }

    next.delete('cursor');
    next.delete('direction');
    setSearchParams(next);
  }

  function clearAllFilters() {
    setActiveCategoryIds([]);
    const next = new URLSearchParams(searchParams);
    next.delete('price');
    next.delete('filter');
    next.delete('cursor');
    next.delete('direction');
    setSearchParams(next);
  }

  function handleSortChange(nextSort: string) {
    const next = new URLSearchParams(searchParams);
    next.set('sort', nextSort);
    next.delete('cursor');
    next.delete('direction');
    setSearchParams(next);
  }

  const activePriceFilters = useMemo(
    () => activePriceIds.map((id) => PRICE_BY_ID.get(id)).filter(Boolean) as PriceFilter[],
    [activePriceIds],
  );

  const activeCategoryHandles = useMemo(
    () =>
      activeCategoryIds
        .map((id) => CATEGORY_BY_ID.get(id)?.handle)
        .filter(Boolean) as string[],
    [activeCategoryIds],
  );

  const filteredConnection = useMemo(() => {
    const hasCategory = activeCategoryHandles.length > 0;
    const hasPrice = activePriceFilters.length > 0;
    if (!hasCategory && !hasPrice) return products;

    const filteredNodes = (products?.nodes ?? []).filter((product: any) => {
      if (hasCategory) {
        const productCollections: string[] =
          product.collections?.nodes?.map((c: any) => c.handle) ?? [];
        const matchesCategory = activeCategoryHandles.some((h) =>
          productCollections.includes(h),
        );
        if (!matchesCategory) return false;
      }
      if (hasPrice) {
        const price = Number(product.priceRange.minVariantPrice.amount);
        if (!activePriceFilters.every((rule) => price >= rule.min && price <= rule.max))
          return false;
      }
      return true;
    });

    return {
      ...products,
      nodes: filteredNodes,
    };
  }, [activeCategoryHandles, activePriceFilters, products]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative bg-neutral-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/60 dark:bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neutral-400 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="w-[500px] h-[500px] border border-white rounded-full" />
          <div className="absolute w-[320px] h-[320px] border border-white rounded-full" />
          <div className="absolute w-[160px] h-[160px] border border-white rounded-full" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-neutral-400 mb-3">
            Handpicked and Energised
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            All Products
          </h1>
          <p className="text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Discover our complete collection of authentic sacred items.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex gap-8 items-start">
          <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
            <FilterSidebar
              activeFilterIds={activeFilterIds}
              onToggleFilter={toggleFilter}
              onClearAll={clearAllFilters}
            />
          </aside>

          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label="Close filters"
                className="absolute inset-0 bg-black/40 backdrop-blur-sm border-0 p-0"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <div className="absolute left-0 top-0 h-full w-72 bg-card text-card-foreground shadow-xl overflow-y-auto p-5 border-r border-border">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
                    Filters
                  </h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                  >
                    x
                  </button>
                </div>
                <FilterSidebar
                  activeFilterIds={activeFilterIds}
                  onToggleFilter={toggleFilter}
                  onClearAll={clearAllFilters}
                />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Filters
                </button>
                <p className="text-xs text-muted-foreground tracking-wide">Browsing all products</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-widest uppercase text-muted-foreground hidden sm:block font-medium">
                  Sort by
                </span>
                <CustomSortDropdown sort={sort} onSortChange={handleSortChange} />
              </div>
            </div>

            {activeFilterIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeFilterIds.map((filterId) => (
                  <span
                    key={filterId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-foreground text-xs rounded-full border border-border shadow-sm"
                  >
                    {labelById[filterId] ?? filterId}
                    <button
                      onClick={() => toggleFilter(filterId)}
                      className="text-muted-foreground hover:text-foreground transition-colors leading-none"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}

            <PaginatedResourceSection
              connection={filteredConnection}
              resourcesClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
            >
              {({ node: product, index }) => (
                <a
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="group bg-card text-card-foreground rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col border border-border"
                >
                  <div className="aspect-square bg-neutral-100 overflow-hidden relative">
                    {product.featuredImage ? (
                      <Image
                        data={product.featuredImage}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                        loading={index < 8 ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                        <span className="text-5xl opacity-20 text-muted-foreground">*</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-border rounded-tl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-border rounded-br pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-background border border-border text-foreground text-[9px] font-bold tracking-wider uppercase rounded-full shadow-sm">
                        Certified
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
                      Devasutra
                    </p>
                    <h3 className="text-base font-semibold text-foreground mb-2 leading-snug line-clamp-2">
                      {product.title}
                    </h3>

                    <div className="mt-auto flex items-center justify-between">
                      <div>
                        <Money
                          data={product.priceRange.minVariantPrice}
                          className="text-sm font-bold text-foreground"
                        />
                        {product.priceRange.maxVariantPrice.amount !==
                          product.priceRange.minVariantPrice.amount && (
                            <span className="text-[10px] text-muted-foreground ml-1">onwards</span>
                          )}
                      </div>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[10px] font-medium tracking-wide uppercase rounded-full transition-colors group-hover:bg-neutral-800">
                        Add
                      </span>
                    </div>
                  </div>
                </a>
              )}
            </PaginatedResourceSection>

            {!(filteredConnection?.nodes?.length > 0) && (
              <div className="text-center py-24">
                <span className="text-6xl text-muted-foreground/30 block mb-4">*</span>
                <h3 className="text-xl font-bold text-foreground mb-2">No products found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Try adjusting your filters or browse all categories.
                </p>
                <a
                  href="/collections/all"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-semibold tracking-wider uppercase rounded-xl hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  Browse all
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
    id
    handle
    title
    tags
    createdAt
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
    collections(first: 10) {
      nodes {
        handle
        title
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
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      sortKey: $sortKey
      reverse: $reverse
    ) {
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


