import type { Route } from './+types/($locale).collections.all';
import { Link, useLoaderData, useSearchParams } from 'react-router';
import { getPaginationVariables, Image, Money, CartForm } from '@shopify/hydrogen';
import { PaginatedResourceSection } from '~/features/collection/components/PaginatedResourceSection';
import { CollectionHeroBanner } from '~/features/collection/components/CollectionHeroBanner';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';
import { StarRating } from '~/shared/components/StarRating';

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

  // Fetch Judge.me review summaries for all products
  let reviewSummaries: Record<string, { averageRating: number; reviewCount: number }> = {};
  const judgeMeToken = context.env.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;
  if (typeof judgeMeToken === 'string' && typeof shopDomain === 'string') {
    try {
      const { getJudgeMeBatchSummaries } = await import('~/lib/judgeme.server');
      const productEntries = products.nodes
        .map((p: any) => ({
          id: String(p.id).split('/').pop() || '',
          handle: p.handle,
        }))
        .filter((p: any) => p.id);
      const summaryMap = await getJudgeMeBatchSummaries({
        shopDomain,
        apiToken: judgeMeToken,
        products: productEntries,
        timeoutMs: 800,
      });
      for (const [id, summary] of summaryMap) {
        reviewSummaries[id] = summary;
      }
    } catch {
      // non-critical
    }
  }

  return { products, reviewSummaries };
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
    <div className={`bg-card border border-border overflow-hidden ${isMobile ? 'p-4 rounded-2xl' : 'rounded-[24px] p-5 sm:p-6'}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
        <h2 className="text-sm font-semibold text-foreground tracking-wide">
          Filters
        </h2>
        {activeFilters.length > 0 && (
          <button
            onClick={() => {
              if (onClearAll) onClearAll();
              else activeFilters.forEach(onToggleFilter);
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6 lg:space-y-8">
        {FILTER_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[13px] text-foreground font-medium mb-3">
              {group.label}
            </p>
            <div className="space-y-2 lg:space-y-3">
              {group.options.map((opt) => {
                const isActive = activeFilters.includes(opt.label);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    className="flex items-center gap-3 cursor-pointer group w-full text-left py-0.5"
                    onClick={() => onToggleFilter(opt.label)}
                    aria-pressed={isActive}
                  >
                    <div
                      className={`w-4 h-4 rounded-sm border shrink-0 flex items-center justify-center transition-all duration-200 ${isActive
                        ? 'bg-foreground border-foreground'
                        : 'border-border bg-background group-hover:border-foreground'
                        }`}
                    >
                      {isActive && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
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
        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="bg-muted/50 rounded-xl p-4 text-center border border-border/50 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[11px] tracking-widest uppercase text-foreground font-bold mb-1.5 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                Free Shipping
              </p>
              <p className="text-xs text-gray-500">On all orders above ₹999</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomSortDropdown({ sort, onSortChange, variant = 'default' }: { sort: string; onSortChange: (nextSort: string) => void; variant?: 'default' | 'mobile' }) {
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
    <div className={variant === 'mobile' ? 'flex-1 min-w-0 relative' : 'relative'} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={variant === 'mobile'
          ? `w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium cursor-pointer select-none rounded-r-2xl transition-colors ${isOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`
          : 'group flex items-center gap-1.5 sm:gap-2 text-left text-[11px] sm:text-[13px] border border-border rounded-full px-3 py-1.5 sm:px-5 sm:py-2.5 bg-background text-foreground focus:outline-none cursor-pointer transition-all duration-200 select-none hover:border-foreground'
        }
      >
        {variant === 'mobile' ? (
          <>
            <svg className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            <span>Sort</span>
            {sort !== 'featured' && <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />}
            <svg className={`w-3 h-3 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </>
        ) : (
          <>
            <span className="truncate block"><span className="text-gray-500">Sort by:</span> {activeOption.label}</span>
            <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 w-52 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="py-1 max-h-60 overflow-auto">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors ${sort === option.value
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
  const { products, reviewSummaries } = useLoaderData<typeof loader>() as any;
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

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 md:py-12 max-w-480 mx-auto">
        <div className="flex gap-8 items-start">
          <aside className="hidden lg:block w-56 xl:w-64 shrink-0 sticky top-30 self-start">
            <FilterSidebar
              activeFilters={activeFilterIds.map(id => labelById[id] ?? id)}
              onToggleFilter={filterLabel => {
                const id = Object.keys(labelById).find(key => labelById[key] === filterLabel) || filterLabel;
                toggleFilter(id);
              }}
              onClearAll={clearAllFilters}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="mb-5">
              {/* Row 1: heading + sort (sort hidden on mobile) */}
              <div className="flex items-center justify-between gap-3 mb-8 sm:mb-3 lg:mb-0">
                <p className="text-xl lg:text-3xl text-center mx-auto sm:mx-0 sm:text-left text-foreground tracking-tight">Browsing all products</p>
                <div className="hidden lg:block shrink-0">
                  <CustomSortDropdown sort={sort} onSortChange={handleSortChange} />
                </div>
              </div>

              {/* Row 2: unified filter+sort pill — mobile only */}
              <div className="flex lg:hidden items-stretch border border-border rounded-2xl bg-card shadow-sm overflow-visible">
                <div className="relative flex-1 min-w-0">
                  <button
                    onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium cursor-pointer select-none rounded-l-2xl transition-colors ${mobileFiltersOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                    <span>Filters</span>
                    {activeFilterIds.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center shrink-0">{activeFilterIds.length}</span>
                    )}
                  </button>
                  {mobileFiltersOpen && (
                    <div className="absolute top-full left-0 mt-2 w-70 sm:w-80 max-h-[70vh] overflow-y-auto bg-card rounded-2xl z-50 border border-border">
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
                <span className="w-px bg-border self-stretch my-2" aria-hidden />
                <CustomSortDropdown sort={sort} onSortChange={handleSortChange} variant="mobile" />
              </div>
            </div>

            {activeFilterIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeFilterIds.map((filterId) => (
                  <span
                    key={filterId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted border border-border text-foreground text-xs rounded-full"
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
              resourcesClassName="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8"
              filterFn={productFilterFn}
            >
              {({ node: product, index }) => (
                <CollectionAllCard
                  key={product.id}
                  product={product}
                  index={index}
                  reviewSummaries={reviewSummaries}
                />
              )}
            </PaginatedResourceSection>

            {productFilterFn && !(products?.nodes ?? []).some(productFilterFn) && (
              <div className="text-center py-24 bg-muted/50 rounded-3xl mt-4 border border-border">
                <span className="text-6xl text-muted-foreground block mb-4">✦</span>
                <h3 className="text-xl font-bold text-foreground mb-2">No products found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Try adjusting your filters or browse all categories.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs font-semibold tracking-wide rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CollectionAllCard({
  product,
  index,
  reviewSummaries,
}: {
  product: any;
  index: number;
  reviewSummaries: any;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const secondaryImage = product.images?.nodes?.[1] ?? null;

  return (
    <div
      className="group bg-muted rounded-[24px] p-2 sm:p-2.5 flex flex-col transition-all hover h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden rounded-3xl mb-2 sm:mb-3 bg-transparent shrink-0">
        {product.tags && product.tags.includes('New') && (
          <span className="absolute top-2.5 left-2.5 bg-green-200/90 text-green-800 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded z-10 transition-opacity">
            New
          </span>
        )}

        <Link to={`/products/${product.handle}`} prefetch="intent" className="absolute inset-0 block">
          {product.featuredImage && (
            <Image
              data={product.featuredImage}
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              loading={index < 8 ? 'eager' : 'lazy'}
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
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              loading="lazy"
              style={{
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'scale(1.02)' : 'scale(1.07)',
                transition: 'opacity 0.55s ease, transform 0.65s ease',
                willChange: 'opacity, transform',
                zIndex: 2,
              }}
            />
          )}
          {!product.featuredImage && (
            <div className="w-full h-full flex items-center justify-center bg-transparent">
              <span className="text-5xl opacity-20 text-gray-400">✦</span>
            </div>
          )}
        </Link>

        {(() => {
          const pid = String(product.id).split('/').pop();
          const summary = pid ? reviewSummaries?.[pid] : null;
          return summary ? (
            <StarRating
              rating={summary.averageRating}
              count={summary.reviewCount}
              className="absolute top-2 right-2 z-10"
            />
          ) : null;
        })()}
      </div>

      <div className="bg-card rounded-3xl p-3 sm:p-4 flex flex-col flex-1 gap-2 border border-border/40 relative z-10">
        {product.variants?.nodes?.[0]?.compareAtPrice && (
          <span className="absolute top-0 right-0 px-2 py-1 sm:py-2 text-[10px] sm:text-sm font-medium rounded-tr-2xl rounded-bl-2xl bg-linear-to-br from-[#f14514] to-[#d4370d] text-white">
            {Math.round(
              ((parseFloat(product.variants.nodes[0].compareAtPrice.amount) -
                parseFloat(product.priceRange.minVariantPrice.amount)) /
                parseFloat(product.variants.nodes[0].compareAtPrice.amount)) *
              100,
            )}% Off
          </span>
        )}
        <Link to={`/products/${product.handle}`} prefetch="intent" className="block">
          <h3 className="text-sm sm:text-lg leading-tight line-clamp-1 text-foreground">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2">
          <Money
            data={product.priceRange.minVariantPrice}
            withoutTrailingZeros
            className="text-[16px] sm:text-[22px] border-none shadow-none font-medium text-foreground leading-none"
          />
          {product.variants?.nodes?.[0]?.compareAtPrice && (
            <s
              className="text-[12px] sm:text-[16px] text-gray-400 font-medium whitespace-nowrap"
            >
              <Money withoutTrailingZeros data={product.variants.nodes[0].compareAtPrice} />
            </s>
          )}
          {!product.variants?.nodes?.[0]?.compareAtPrice &&
            product.priceRange.maxVariantPrice.amount !==
              product.priceRange.minVariantPrice.amount && (
              <span className="text-[10px] text-gray-400 block -ml-1">onwards</span>
            )}
        </div>

        <div className="mt-auto pt-2">
          <CollectionAllProductATC product={product} />
        </div>
      </div>
    </div>
  );
}

function CollectionAllAddButton({
  fetcher,
  availableForSale,
  productTitle,
  productImage,
}: {
  fetcher: any;
  availableForSale?: boolean;
  productTitle: string;
  productImage?: { url: string; altText?: string | null };
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage);
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle, productImage]);

  return (
    <button
      type="submit"
      disabled={!availableForSale || fetcher.state !== 'idle'}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground text-xs sm:text-base rounded-full group-hover:bg-foreground group-hover:text-background disabled:cursor-not-allowed cursor-pointer group transition-all duration-300 ease-in-out"
      aria-label="Add to bag"
    >
      <img src="/icons/add-bag.png" alt="" className="w-4 h-4 md:w-6 md:h-6 shrink-0 dark:invert group-hover:invert group-hover:brightness-0 dark:group-hover:brightness-100 transition-all" />
      {availableForSale ? 'Add to Bag' : 'Sold Out'}
    </button>
  );
}

// ─── Size pill inner — proper component so useEffect works ───────────────────
function CollectionAllSizePillInner({
  fetcher,
  variant,
  productTitle,
  productImage,
  onAdded,
}: {
  fetcher: any;
  variant: { id: string; availableForSale: boolean; title?: string };
  productTitle: string;
  productImage?: { url: string; altText?: string | null };
  onAdded: () => void;
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef<string>('idle');

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage);
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
        'px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium tracking-wide uppercase border transition-all duration-150 cursor-pointer select-none',
        !variant.availableForSale
          ? 'border-border text-muted-foreground/40 line-through cursor-not-allowed'
          : isAdding
            ? 'border-foreground bg-foreground text-background opacity-70 cursor-not-allowed'
            : 'border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background active:scale-95',
      ].join(' ')}
      aria-label={`Add size ${variant.title ?? ''}`}
    >
      {isAdding ? (
        <svg className="animate-spin inline-block w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        variant.title ?? '—'
      )}
    </button>
  );
}

// ─── Size pill form wrapper ───────────────────────────────────────────────────
function CollectionAllSizePill({
  variant,
  productTitle,
  productImage,
  productId,
  onAdded,
}: {
  variant: { id: string; availableForSale: boolean; title?: string };
  productTitle: string;
  productImage?: { url: string; altText?: string | null };
  productId: string;
  onAdded: () => void;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{ lines: [{ merchandiseId: variant.id, quantity: 1, selectedVariant: variant as any }] }}
      fetcherKey={`all-size-${productId}-${variant.id}`}
    >
      {(fetcher) => (
        <CollectionAllSizePillInner
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

// ─── Smart ATC for all-products collection cards ──────────────────────────────
function CollectionAllProductATC({ product }: { product: any }) {
  const [showSizes, setShowSizes] = useState(false);
  const variants: Array<{ id: string; availableForSale: boolean; title?: string }> = product.variants?.nodes ?? [];
  const firstVariant = variants[0];
  const isAvailable = firstVariant?.availableForSale ?? false;
  const hasMultiple = variants.length > 1;

  if (!isAvailable) {
    return (
      <button disabled className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-border text-muted-foreground text-xs sm:text-base rounded-full cursor-not-allowed">
        Sold Out
      </button>
    );
  }

  if (!hasMultiple) {
    return (
      <CartForm
        route="/cart"
        inputs={{ lines: [{ merchandiseId: firstVariant.id, quantity: 1, selectedVariant: firstVariant }] }}
        action={CartForm.ACTIONS.LinesAdd}
      >
        {(fetcher) => (
          <CollectionAllAddButton
            fetcher={fetcher}
            availableForSale={isAvailable}
            productTitle={product.title}
            productImage={product.featuredImage ?? undefined}
          />
        )}
      </CartForm>
    );
  }

  return (
    <div>
      {showSizes && (
        <div className="mb-2">
          <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1.5">Select Size</p>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => (
              <CollectionAllSizePill
                key={v.id}
                variant={v}
                productTitle={product.title}
                productImage={product.featuredImage ?? undefined}
                productId={product.id}
                onAdded={() => setShowSizes(false)}
              />
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setShowSizes((s) => !s)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-base rounded-full disabled:cursor-not-allowed cursor-pointer group transition-all duration-300 ease-in-out ${
          showSizes
            ? 'bg-foreground border-foreground text-background'
            : 'bg-card border border-border text-foreground hover:bg-foreground hover:text-background'
        }`}
        aria-label="Select size"
      >
        <img
          src="/icons/add-bag.png"
          alt=""
          className={`w-4 h-4 md:w-6 md:h-6 shrink-0 transition-all dark:invert ${showSizes ? '' : 'group-hover:invert group-hover:brightness-0 dark:group-hover:brightness-100'}`}
        />
        {showSizes ? 'Close' : 'Select Size'}
      </button>
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
    images(first: 2) {
      nodes {
        id
        altText
        url
        width
        height
      }
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
    variants(first: 10) {
      nodes {
        id
        availableForSale
        title
        price {
          ...MoneyCollectionItem
        }
        compareAtPrice {
          ...MoneyCollectionItem
        }
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
