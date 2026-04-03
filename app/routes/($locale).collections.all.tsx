import type { Route } from './+types/($locale).collections.all';
import { useLoaderData, useSearchParams } from 'react-router';
import { getPaginationVariables, Image, Money, CartForm } from '@shopify/hydrogen';
import { PaginatedResourceSection } from '~/features/collection/components/PaginatedResourceSection';
import { CollectionHeroBanner } from '~/features/collection/components/CollectionHeroBanner';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useCartNotification } from '~/features/cart/components/CartNotification'; type CategoryFilter = {
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

const ALL_PRODUCTS_HERO = {
  eyebrow: 'One Sacred Catalogue',
  title: 'All Products',
  description:
    'View the full Devasutra world in one place - Rudraksha, Karungali, bracelets, malas, and sacred essentials chosen for authenticity and everyday spiritual use.',
  imageSrc: '/menu-all-collections.png',
  imageAlt: 'All Devasutra products',
  align: 'center' as const,
  highlights: ['Rudraksha', 'Karungali', 'Bracelets', 'All Products'],
};

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



// --- Unified FilterSidebar from collections.handle ---
function FilterSidebar({
  activeFilters,
  onToggleFilter,
  isMobile = false,
  onClearAll,
}: {
  activeFilters: string[];
  onToggleFilter: (f: string) => void;
  isMobile?: boolean;
  onClearAll?: () => void;
}) {
  return (
    <div className={`bg-card text-card-foreground ${isMobile ? 'p-4' : 'rounded-2xl p-6'}`}>
      <div className="flex items-center justify-between mb-4 lg:mb-6 pb-3 lg:pb-4 border-b border-border/40">
        <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
          Filters
        </h2>
        <div className="flex items-center gap-4">
          {activeFilters.length > 0 && (
            <button
              onClick={() => {
                if (onClearAll) onClearAll();
                else activeFilters.forEach(onToggleFilter);
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground tracking-wide hover:underline transition-all underline-offset-4"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6 lg:space-y-8">
        {FILTER_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs tracking-wider uppercase text-foreground font-semibold mb-3 lg:mb-4">
              {group.label}
            </p>
            <div className="space-y-2 lg:space-y-3">
              {group.options.map((opt) => {
                const isActive = activeFilters.includes(opt.label);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    className="flex items-center gap-3 cursor-pointer group w-full text-left"
                    onClick={() => onToggleFilter(opt.label)}
                    aria-pressed={isActive}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-lg border shrink-0 flex items-center justify-center transition-all duration-200 ${isActive
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
                      className={`text-xs lg:text-[13px] transition-colors ${isActive
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!isMobile && (
        <div className="mt-8 pt-6 border-t border-border/40">
          <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <p className="text-[11px] tracking-widest uppercase text-foreground font-bold mb-1.5 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                Free Shipping
              </p>
              <p className="text-xs text-muted-foreground">On all orders above ₹999</p>
            </div>
          </div>
        </div>
      )}
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
        className={`group flex items-center justify-between w-47.5 text-left text-[13px] border rounded-full px-5 py-3 bg-card text-foreground focus:outline-none cursor-pointer transition-all duration-200 select-none ${
          isOpen
            ? 'border-foreground/20 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.12)] bg-muted/40'
            : 'border-border hover:border-foreground/15'
        }`}
      >
        <span className="truncate block font-medium tracking-wide">Sort by</span>
        <svg
          className={`w-3.5 h-3.5 text-muted-foreground/70 transition-transform duration-300 ml-2 shrink-0 ${isOpen ? 'rotate-180' : 'group-hover:translate-y-px'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 w-52.5 mt-2.5 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="py-2 max-h-60 overflow-auto">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-all duration-150 ${sort === option.value
                  ? 'bg-foreground/5 font-semibold text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
              >
                <span>{option.label}</span>
                {sort === option.value && (
                  <svg className="w-3.5 h-3.5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m4.5 12.75 6 6 9-13.5" />
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

  const productFilterFn = useMemo(() => {
    const hasCategory = activeCategoryHandles.length > 0;
    const hasPrice = activePriceFilters.length > 0;
    if (!hasCategory && !hasPrice) return undefined;

    return (product: any): boolean => {
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
    };
  }, [activeCategoryHandles, activePriceFilters]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CollectionHeroBanner
        eyebrow={ALL_PRODUCTS_HERO.eyebrow}
        title={ALL_PRODUCTS_HERO.title}
        description={ALL_PRODUCTS_HERO.description}
        imageSrc={ALL_PRODUCTS_HERO.imageSrc}
        imageAlt={ALL_PRODUCTS_HERO.imageAlt}
        align={ALL_PRODUCTS_HERO.align}
        highlights={ALL_PRODUCTS_HERO.highlights}
        breadcrumb={<RouteBreadcrumbBanner variant="overlay" />}
        breadcrumbPlacement="inside-top"
      />

      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex gap-8 items-start">
          <aside className="hidden lg:block w-56 xl:w-64 shrink-0 sticky top-30 self-start">
            <FilterSidebar
              activeFilters={activeFilterIds.map(id => labelById[id] ?? id)}
              onToggleFilter={filterLabel => {
                // Map label back to id for toggling
                const id = Object.keys(labelById).find(key => labelById[key] === filterLabel) || filterLabel;
                toggleFilter(id);
              }}
              onClearAll={clearAllFilters}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
              <div className="flex items-center gap-3 relative">
                <button
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                  className={`lg:hidden group flex items-center gap-2 px-5 py-3 border rounded-full text-[13px] text-foreground bg-card cursor-pointer transition-all duration-200 select-none ${
                    mobileFiltersOpen
                      ? 'border-foreground/20 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.12)] bg-muted/40'
                      : 'border-border hover:border-foreground/15'
                  }`}
                >
                  <svg className="w-4 h-4 text-muted-foreground/70" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  <span className="font-medium tracking-wide">Filters</span>
                  {activeFilterIds.length > 0 && (
                    <span className="bg-foreground text-background w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold">
                      {activeFilterIds.length}
                    </span>
                  )}
                  <svg
                    className={`w-3.5 h-3.5 text-muted-foreground/70 transition-transform duration-300 ml-0.5 ${mobileFiltersOpen ? 'rotate-180' : 'group-hover:translate-y-px'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <p className="hidden lg:block text-xs text-muted-foreground tracking-wide">Browsing all products</p>

                {/* Mobile Filters Dropdown */}
                {mobileFiltersOpen && (
                  <div className="absolute top-full left-0 mt-2 w-70 sm:w-80 max-h-[70vh] overflow-y-auto bg-card rounded-2xl shadow-xl z-50 lg:hidden border border-gray-100">
                    <FilterSidebar
                      activeFilters={activeFilterIds.map(id => labelById[id] ?? id)}
                      onToggleFilter={filterLabel => {
                        const id = Object.keys(labelById).find(key => labelById[key] === filterLabel) || filterLabel;
                        toggleFilter(id);
                      }}
                      onClearAll={clearAllFilters}
                      isMobile={true}
                    />
                  </div>
                )}
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
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-foreground text-xs rounded-full border border-border"
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
              connection={products}
              resourcesClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
              filterFn={productFilterFn}
            >
              {({ node: product, index }) => (
                <div
                  key={product.id}
                  className="group bg-card text-card-foreground rounded-2xl overflow-hidden transition-all duration-300 flex flex-col border border-border/60"
                >
                  <a href={`/products/${product.handle}`} className="block p-2 pb-0">
                    <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                      {product.featuredImage ? (
                        <Image
                          data={product.featuredImage}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                          loading={index < 8 ? 'eager' : 'lazy'}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-5xl opacity-20 text-muted-foreground">✦</span>
                        </div>
                      )}
                    </div>
                  </a>

                  <div className="p-3 sm:p-3.5 flex flex-col flex-1 gap-1.5">
                    <a href={`/products/${product.handle}`} className="block">
                      <h3 className="text-sm sm:text-[15px] font-medium text-foreground leading-snug line-clamp-2 hover:underline">
                        {product.title}
                      </h3>
                    </a>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <div>
                        <Money
                          data={product.priceRange.minVariantPrice}
                          withoutTrailingZeros
                          className="text-lg sm:text-xl font-medium text-foreground block"
                        />
                        {product.priceRange.maxVariantPrice.amount !==
                          product.priceRange.minVariantPrice.amount && (
                            <span className="text-[10px] text-muted-foreground block">onwards</span>
                          )}
                      </div>

                      <CartForm
                        route="/cart"
                        inputs={{
                          lines: [
                            {
                              merchandiseId: product.variants?.nodes?.[0]?.id,
                              quantity: 1,
                              selectedVariant: product.variants?.nodes?.[0],
                            },
                          ],
                        }}
                        action={CartForm.ACTIONS.LinesAdd}
                      >
                        {(fetcher) => (
                          <CollectionAllAddButton
                            fetcher={fetcher}
                            availableForSale={product.variants?.nodes?.[0]?.availableForSale}
                            productTitle={product.title}
                          />
                        )}
                      </CartForm>
                    </div>
                  </div>
                </div>
              )}
            </PaginatedResourceSection>

            {productFilterFn && !(products?.nodes ?? []).some(productFilterFn) && (
              <div className="text-center py-24">
                <span className="text-6xl text-muted-foreground/30 block mb-4">*</span>
                <h3 className="text-xl font-bold text-foreground mb-2">No products found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Try adjusting your filters or browse all categories.
                </p>
                <a
                  href="/collections/all"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-semibold tracking-wider uppercase rounded-xl hover:bg-neutral-800 transition-colors"
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

function CollectionAllAddButton({
  fetcher,
  availableForSale,
  productTitle,
}: {
  fetcher: any;
  availableForSale?: boolean;
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
      disabled={!availableForSale || fetcher.state !== 'idle'}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[10px] font-medium tracking-wide uppercase rounded-full transition-colors hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      aria-label="Add to cart"
    >
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
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5h.008v.008h-.008v-.008Zm5.375 0h.008v.008h-.008v-.008Z"
        />
      </svg>
      {availableForSale ? 'Add' : 'Sold Out'}
    </button>
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
    variants(first: 1) {
      nodes {
        id
        availableForSale
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
