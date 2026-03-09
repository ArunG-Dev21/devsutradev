import { Link, redirect, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).collections.$handle';
import { getPaginationVariables, Analytics, Image, Money, CartForm } from '@shopify/hydrogen';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import type { ProductItemFragment } from 'storefrontapi.generated';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useCartNotification } from '~/components/CartNotification';

export const meta: Route.MetaFunction = ({ data }) => {
  return [{ title: `${data?.collection.title ?? ''} | Devasutra` }];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return { ...deferredData, ...criticalData };
}

async function loadCriticalData({ context, params, request }: Route.LoaderArgs) {
  const { handle } = params;
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, { pageBy: 8 });

  if (!handle) throw redirect('/collections');

  const [{ collection }] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: { handle, ...paginationVariables },
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, { status: 404 });
  }

  redirectIfHandleIsLocalized(request, { handle, data: collection });

  let relatedArticles: Array<{
    id: string;
    title: string;
    handle: string;
    publishedAt: string;
    excerpt?: string | null;
    image?: {
      id?: string | null;
      altText?: string | null;
      url: string;
      width?: number | null;
      height?: number | null;
    } | null;
    blog: { handle: string };
  }> = [];

  if (handle.toLowerCase() === 'rudraksha') {
    const blogData = await storefront.query(COLLECTION_BLOG_POSTS_QUERY, {
      variables: {},
    });

    const allArticles =
      blogData?.blogs?.nodes?.flatMap((blogNode: any) => blogNode.articles?.nodes ?? []) ?? [];

    const keyword = handle.toLowerCase();
    const filtered = allArticles.filter((article: any) => {
      const haystack = `${article.title ?? ''} ${article.handle ?? ''} ${article.excerpt ?? ''}`.toLowerCase();
      return haystack.includes(keyword);
    });

    const selected = filtered.length > 0 ? filtered : allArticles;
    const deduped = selected.filter(
      (article: any, index: number, self: any[]) =>
        index === self.findIndex((a: any) => a.id === article.id),
    );

    relatedArticles = deduped.slice(0, 4);
  }

  return { collection, relatedArticles };
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

const SORT_OPTIONS = [
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Best Selling', value: 'best-selling' },
];

const FILTER_GROUPS = [
  {
    label: 'Price Range',
    options: ['Under ₹500', '₹500 – ₹1,500', '₹1,500 – ₹5,000', 'Above ₹5,000'],
  },
  {
    label: 'Certification',
    options: ['Lab Certified', 'Energised', 'Premium'],
  },
];

/* ───────── Filter Sidebar ───────── */

function FilterSidebar({
  activeFilters,
  onToggleFilter,
  isMobile = false,
}: {
  activeFilters: string[];
  onToggleFilter: (f: string) => void;
  isMobile?: boolean;
}) {
  return (
    <div className={`bg-card text-card-foreground ${isMobile ? 'p-4' : 'border border-border rounded-2xl p-6 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-4 lg:mb-6 pb-3 lg:pb-4 border-b border-border/40">
        <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
          Filters
        </h2>
        <div className="flex items-center gap-4">
          {activeFilters.length > 0 && (
            <button
              onClick={() => activeFilters.forEach(onToggleFilter)}
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
                const isActive = activeFilters.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    className="flex items-center gap-3 cursor-pointer group w-full text-left"
                    onClick={() => onToggleFilter(opt)}
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
                      {opt}
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

/* ───────── Page ───────── */

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
            : 'border-border hover:border-foreground/15 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]'
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
  const { collection, relatedArticles } = useLoaderData<typeof loader>();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sort, setSort] = useState('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  function toggleFilter(f: string) {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  }

  /* ───────── FILTER LOGIC ───────── */

  const filteredConnection = useMemo(() => {
    let filteredNodes = collection.products.nodes;

    if (activeFilters.length > 0) {
      filteredNodes = filteredNodes.filter((product) => {
        const price = Number(product.priceRange.minVariantPrice.amount);

        return activeFilters.every((filter) => {
          if (filter === 'Under ₹500') return price < 500;
          if (filter === '₹500 – ₹1,500')
            return price >= 500 && price <= 1500;
          if (filter === '₹1,500 – ₹5,000')
            return price >= 1500 && price <= 5000;
          if (filter === 'Above ₹5,000') return price > 5000;
          return true;
        });
      });
    }

    const sortedNodes = [...filteredNodes].sort((a, b) => {
      const priceA = Number(a.priceRange.minVariantPrice.amount);
      const priceB = Number(b.priceRange.minVariantPrice.amount);
      if (sort === 'price-asc') return priceA - priceB;
      if (sort === 'price-desc') return priceB - priceA;
      return 0;
    });

    return {
      ...collection.products,
      nodes: sortedNodes,
    };
  }, [activeFilters, collection.products, sort]);

  return (
    <div className="min-h-screen text-foreground">

      {/* BANNER */}
      <div className="relative bg-background border-b border-border overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-foreground rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-foreground rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
          <div className="w-125 h-125 border border-foreground rounded-full" />
          <div className="absolute w-80 h-80 border border-foreground rounded-full" />
          <div className="absolute w-40 h-40 border border-foreground rounded-full" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">
            Handpicked and Energised
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex gap-8 items-start">

          <aside className="hidden lg:block w-56 xl:w-64 shrink-0 sticky top-6 self-start">
            <FilterSidebar
              activeFilters={activeFilters}
              onToggleFilter={toggleFilter}
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
                      : 'border-border hover:border-foreground/15 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]'
                  }`}
                >
                  <svg className="w-4 h-4 text-muted-foreground/70" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  <span className="font-medium tracking-wide">Filters</span>
                  {activeFilters.length > 0 && (
                    <span className="bg-foreground text-background w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold">
                      {activeFilters.length}
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
                <p className="hidden lg:block text-xs text-muted-foreground tracking-wide">Browsing {collection.title}</p>

                {/* Mobile Filters Dropdown */}
                {mobileFiltersOpen && (
                  <div className="absolute top-full left-0 mt-2 w-70 sm:w-80 max-h-[70vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-xl z-50 lg:hidden ring-1 ring-black ring-opacity-5">
                    <FilterSidebar
                      activeFilters={activeFilters}
                      onToggleFilter={toggleFilter}
                      isMobile={true}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-widest uppercase text-muted-foreground hidden sm:block font-medium">
                  Sort by
                </span>
                <CustomSortDropdown sort={sort} onSortChange={setSort} />
              </div>
            </div>

            <PaginatedResourceSection<ProductItemFragment>
              connection={filteredConnection}
              resourcesClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
            >
              {({ node: product, index }) => (
                <div
                  key={product.id}
                  className="group bg-card text-card-foreground rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col border border-border"
                >
                  <a href={`/products/${product.handle}`} className="aspect-square bg-muted overflow-hidden relative block">
                    {product.featuredImage ? (
                      <Image
                        data={product.featuredImage}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading={index < 8 ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-5xl opacity-20 text-muted-foreground">
                          ✦
                        </span>
                      </div>
                    )}
                  </a>

                  <div className="p-3 sm:p-3.5 flex flex-col flex-1 gap-1.5">

                    <a href={`/products/${product.handle}`} className="block">
                      <h3 className="text-sm sm:text-[15px] font-medium text-foreground leading-snug line-clamp-2 hover:underline">
                        {product.title}
                      </h3>
                    </a>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <Money
                        data={product.priceRange.minVariantPrice}
                        withoutTrailingZeros
                        className="text-base sm:text-lg font-semibold text-foreground"
                      />

                      <CartForm
                        route="/cart"
                        inputs={{
                          lines: [
                            {
                              merchandiseId: product.variants?.nodes?.[0]?.id,
                              quantity: 1,
                            },
                          ],
                        }}
                        action={CartForm.ACTIONS.LinesAdd}
                      >
                        {(fetcher) => (
                          <CollectionAddButton
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

            {collection.handle.toLowerCase() === 'rudraksha' && relatedArticles.length > 0 && (
              <section className="mt-14 border-t border-border pt-10">
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                      Read and Learn
                    </p>
                    <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                      Rudraksha Journal
                    </h2>
                  </div>
                  <Link
                    to="/blogs"
                    className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all blogs
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
                  {relatedArticles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/blogs/${article.blog.handle}/${article.handle}`}
                      className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                      prefetch="intent"
                    >
                      {article.image && (
                        <div className="aspect-16/10 overflow-hidden bg-muted">
                          <Image
                            data={article.image}
                            alt={article.image.altText || article.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <time className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground">
                          {new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }).format(new Date(article.publishedAt))}
                        </time>
                        <h3 className="mt-2 text-base font-medium text-foreground leading-snug line-clamp-2">
                          {article.title}
                        </h3>
                        <span className="mt-3 inline-flex text-[10px] tracking-[0.16em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
                          Read more →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

function CollectionAddButton({
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
      className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[10px] font-medium tracking-wide uppercase rounded-full transition-colors hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
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

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    tags
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
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


const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;

const COLLECTION_BLOG_POSTS_QUERY = `#graphql
  query CollectionBlogPosts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    blogs(first: 8) {
      nodes {
        handle
        articles(first: 8, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            id
            title
            handle
            publishedAt
            excerpt: excerptHtml
            image {
              id
              altText
              url
              width
              height
            }
            blog {
              handle
            }
          }
        }
      }
    }
  }
` as const;
