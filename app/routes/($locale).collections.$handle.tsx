import { Link, redirect, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).collections.$handle';
import { getPaginationVariables, Analytics, Image, Money, CartForm } from '@shopify/hydrogen';
import { PaginatedResourceSection } from '~/features/collection/components/PaginatedResourceSection';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';
import type { ProductItemFragment } from 'storefrontapi.generated';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useCartNotification } from '~/features/cart/components/CartNotification';
import { CollectionHeroBanner } from '~/features/collection/components/CollectionHeroBanner';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';
import { StarRating } from '~/shared/components/StarRating';
import {
  generateMeta,
  truncate,
  collectionSchema,
  breadcrumbSchema,
  jsonLd,
} from '~/lib/seo';

export const meta: Route.MetaFunction = ({ data }) => {
  const collection = (data as any)?.collection;
  const origin = (data as any)?.seoOrigin || '';
  const title = `${collection?.title ?? 'Collection'} — Sacred Collection | Devasutra`;
  const description = collection?.description
    ? truncate(collection.description, 155)
    : `Browse our ${collection?.title || ''} collection. Handpicked, blessed & lab certified. Shop now with free shipping above ₹999.`;
  const ogImage = collection?.image?.url || '';
  return generateMeta({
    title,
    description,
    canonical: `${origin}/collections/${collection?.handle || ''}`,
    ogType: 'website',
    ogImage,
  });
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  const origin = new URL(args.request.url).origin;
  return { ...deferredData, ...criticalData, seoOrigin: origin };
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

  // Fetch Judge.me review summaries for all products in the collection
  let reviewSummaries: Record<string, { averageRating: number; reviewCount: number }> = {};
  const judgeMeToken = context.env.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;
  console.log('[JudgeMe] Token exists:', !!judgeMeToken, 'Domain:', shopDomain);
  if (typeof judgeMeToken === 'string' && typeof shopDomain === 'string') {
    try {
      const { getJudgeMeBatchSummaries } = await import('~/lib/judgeme.server');
      const productEntries = collection.products.nodes
        .map((p: any) => ({
          id: String(p.id).split('/').pop() || '',
          handle: p.handle,
        }))
        .filter((p: any) => p.id);
      console.log('[JudgeMe] Product entries:', JSON.stringify(productEntries));
      const summaryMap = await getJudgeMeBatchSummaries({
        shopDomain,
        apiToken: judgeMeToken,
        products: productEntries,
      });
      console.log('[JudgeMe] Summary map size:', summaryMap.size);
      // Convert Map to a plain object so it serialises safely across the loader boundary
      for (const [id, summary] of summaryMap) {
        console.log('[JudgeMe] Found review:', id, summary);
        reviewSummaries[id] = summary;
      }
    } catch (err) {
      console.error('[JudgeMe] Batch fetch error:', err);
    }
  }

  console.log('[JudgeMe] Final reviewSummaries:', JSON.stringify(reviewSummaries));
  return { collection, relatedArticles, reviewSummaries };
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

const COLLECTION_HERO_CONTENT: Record<
  string,
  {
    eyebrow: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
    align: 'center' | 'right';
    highlights: string[];
  }
> = {
  rudraksha: {
    eyebrow: 'Handpicked and Energised',
    description:
      'Sacred Rudraksha beads chosen for devotion, focus, protection, and a deeper daily connection to sadhana.',
    imageSrc: '/bg-rudraksha.png',
    imageAlt: 'Rudraksha collection banner',
    align: 'right',
    highlights: ['Lab Selected', 'Sacred Seed', 'Daily Sadhana'],
  },
  karungali: {
    eyebrow: 'Protective Tamil Ebony',
    description:
      'Authentic Karungali pieces rooted in traditional use for grounding, steadiness, and shielding from heavy energies.',
    imageSrc: '/bg-karungali.png',
    imageAlt: 'Karungali collection banner',
    align: 'right',
    highlights: ['Grounding', 'Protective', 'Tamil Heritage'],
  },
  bracelets: {
    eyebrow: 'Wearable Sacred Energy',
    description:
      'Bracelets designed to carry intention beautifully - spiritual companions for protection, balance, and everyday ritual.',
    imageSrc: '/bg-bracelet.png',
    imageAlt: 'Bracelets collection banner',
    align: 'right',
    highlights: ['Everyday Wear', 'Intentional Design', 'Blessed Pieces'],
  },
};

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
    <div className={`bg-white border border-gray-200 overflow-hidden ${isMobile ? 'p-4 rounded-2xl' : 'rounded-[24px] p-5 sm:p-6'}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 tracking-wide">
          Filters
        </h2>
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => activeFilters.forEach(onToggleFilter)}
              className="text-[11px] text-gray-500 hover:text-black transition-colors underline-offset-4 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6 lg:space-y-8">
        {FILTER_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[13px] text-gray-900 font-medium mb-3">
              {group.label}
            </p>
            <div className="space-y-2 lg:space-y-3">
              {group.options.map((opt) => {
                const isActive = activeFilters.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    className="flex items-center gap-3 cursor-pointer group w-full text-left py-0.5"
                    onClick={() => onToggleFilter(opt)}
                    aria-pressed={isActive}
                  >
                    <div
                      className={`w-4 h-4 rounded-sm border shrink-0 flex items-center justify-center transition-all duration-200 ${isActive
                        ? 'bg-black border-black'
                        : 'border-gray-300 bg-white group-hover:border-black'
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
                        ? 'text-black font-medium'
                        : 'text-gray-600 group-hover:text-black'
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
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[11px] tracking-widest uppercase text-black font-bold mb-1.5 flex items-center justify-center gap-1.5">
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
        className="group flex items-center gap-1.5 sm:gap-2 text-left text-[11px] sm:text-[13px] border border-gray-300 rounded-full px-3 py-1.5 sm:px-5 sm:py-2.5 bg-white text-gray-800 focus:outline-none cursor-pointer transition-all duration-200 select-none hover:border-black"
      >
        <span className="truncate block">
          <span className="sm:hidden text-gray-500">Sort</span>
          <span className="hidden sm:inline"><span className="text-gray-500">Sort by:</span> {activeOption.label}</span>
        </span>
        <svg
          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 w-52 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="py-1 max-h-60 overflow-auto">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors ${sort === option.value
                  ? 'bg-gray-50 font-medium text-black'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                  }`}
              >
                <span>{option.label}</span>
                {sort === option.value && (
                  <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const { collection, relatedArticles, reviewSummaries } = useLoaderData<typeof loader>() as any;
  const seoOrigin = ((useLoaderData<typeof loader>()) as any).seoOrigin || '';
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sort, setSort] = useState('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const heroConfig =
    COLLECTION_HERO_CONTENT[collection.handle.toLowerCase()] || null;

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
    <div className="min-h-screen bg-white text-gray-900">
      {/* CollectionPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(collectionSchema(collection, seoOrigin)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', url: `${seoOrigin}/` },
              { name: 'Collections', url: `${seoOrigin}/collections` },
              { name: collection.title, url: `${seoOrigin}/collections/${collection.handle}` },
            ]),
          ),
        }}
      />
      <CollectionHeroBanner
        eyebrow={heroConfig?.eyebrow || 'Handpicked and Energised'}
        title={collection.title}
        description={
          heroConfig?.description ||
          collection.description ||
          `Explore the ${collection.title} collection from Devasutra.`
        }
        imageSrc={heroConfig?.imageSrc || '/bg-slug.jpg'}
        imageAlt={heroConfig?.imageAlt || `${collection.title} collection banner`}
        align={heroConfig?.align || 'center'}
        highlights={heroConfig?.highlights || ['Authentic', 'Energised', 'Sacred Living']}
        breadcrumb={<RouteBreadcrumbBanner variant="overlay" />}
        breadcrumbPlacement="inside-top"
      />

      {/* BODY */}
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 py-8 md:py-12 max-w-[1920px] mx-auto">
        <div className="flex gap-8 items-start">

          <aside className="hidden lg:block w-56 xl:w-64 shrink-0 sticky top-30 self-start">
            <FilterSidebar
              activeFilters={activeFilters}
              onToggleFilter={toggleFilter}
            />
          </aside>

          <div className="flex-1 min-w-0">

            <div className="flex items-center justify-between mb-5 gap-2">
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                  className={`lg:hidden group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 border rounded-full text-[11px] sm:text-[13px] text-gray-800 bg-white cursor-pointer transition-all duration-200 select-none ${
                    mobileFiltersOpen
                      ? 'border-gray-800 shadow-md bg-gray-50'
                      : 'border-gray-300 hover:border-black'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  <span className="font-medium tracking-wide">Filters</span>
                  {activeFilters.length > 0 && (
                    <span className="bg-black text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">
                      {activeFilters.length}
                    </span>
                  )}
                  <svg
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 transition-transform duration-300 shrink-0 ${mobileFiltersOpen ? 'rotate-180' : 'group-hover:translate-y-px'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <p className="hidden lg:block text-lg sm:text-3xl text-gray-900 tracking-tight">Explore Our {collection.title} Collection</p>

                {/* Mobile Filters Dropdown */}
                {mobileFiltersOpen && (
                  <div className="absolute top-full left-0 mt-2 w-70 sm:w-80 max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-xl z-50 lg:hidden border border-gray-100">
                    <FilterSidebar
                      activeFilters={activeFilters}
                      onToggleFilter={toggleFilter}
                      isMobile={true}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <CustomSortDropdown sort={sort} onSortChange={setSort} />
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeFilters.map((filter) => (
                  <span
                    key={filter}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-800 text-xs rounded-full"
                  >
                    {filter}
                    <button
                      onClick={() => toggleFilter(filter)}
                      className="text-gray-400 hover:text-black transition-colors leading-none"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}

            <PaginatedResourceSection<ProductItemFragment>
              connection={filteredConnection}
              resourcesClassName="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8"
            >
              {({ node: product, index }) => (
                <div
                  key={product.id}
                  className="group bg-[#f6f6f6] rounded-[24px] p-2 sm:p-2.5 flex flex-col transition-all h-full"
                >
                  <div className="relative aspect-square overflow-hidden rounded-3xl mb-2 sm:mb-3 bg-transparent shrink-0">
                    {product.tags && product.tags.includes('New') && (
                      <span className="absolute top-2.5 left-2.5 bg-green-200/90 text-green-800 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded shadow-inner z-10 transition-opacity">
                        New
                      </span>
                    )}

                    <a href={`/products/${product.handle}`} className="block w-full h-full">
                      {product.featuredImage ? (
                        <Image
                          data={product.featuredImage}
                          className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                          loading={index < 8 ? 'eager' : 'lazy'}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-transparent">
                          <span className="text-5xl opacity-20 text-gray-400">
                            ✦
                          </span>
                        </div>
                      )}
                    </a>

                    {/* Star Rating badge — top-right of image */}
                    {(() => {
                      const pid = String(product.id).split('/').pop();
                      const summary = pid ? (reviewSummaries as any)?.[pid] : null;
                      return summary ? (
                        <StarRating
                          rating={summary.averageRating}
                          count={summary.reviewCount}
                          className="absolute top-2 right-2 z-10"
                        />
                      ) : null;
                    })()}
                  </div>

                  <div className="bg-white rounded-3xl p-3 sm:p-4 flex flex-col flex-1 gap-2 border border-black/10 relative z-10">
                    <a href={`/products/${product.handle}`} className="block">
                      <h3 className="text-sm sm:text-lg leading-tight line-clamp-1 text-black">
                        {product.title}
                      </h3>
                    </a>

                    <div className="flex items-center gap-2">
                      <Money
                        data={product.priceRange.minVariantPrice}
                        withoutTrailingZeros
                        className="text-[16px] sm:text-[22px] border-none shadow-none font-medium text-black leading-none"
                      />
                      {product.variants?.nodes?.[0]?.compareAtPrice && (
                        <s 
                          className="text-[12px] sm:text-[16px] text-gray-400 font-medium whitespace-nowrap"
                        >
                          <Money withoutTrailingZeros data={product.variants.nodes[0].compareAtPrice} />
                        </s>
                      )}
                      {product.variants?.nodes?.[0]?.compareAtPrice && (
                        <span className="absolute top-0 right-0 ml-auto px-2 py-1 sm:py-2 text-[10px] sm:text-sm font-medium rounded-tr-2xl rounded-bl-2xl bg-lime-300 text-green-800">
                          −
                          {Math.round(
                            ((parseFloat(product.variants.nodes[0].compareAtPrice.amount) -
                              parseFloat(product.priceRange.minVariantPrice.amount)) /
                              parseFloat(product.variants.nodes[0].compareAtPrice.amount)) *
                            100,
                          )}
                          %
                        </span>
                      )}
                      {!product.variants?.nodes?.[0]?.compareAtPrice &&
                        product.priceRange.maxVariantPrice.amount !==
                          product.priceRange.minVariantPrice.amount && (
                          <span className="text-[10px] text-gray-400 block -ml-1">onwards</span>
                        )}
                    </div>

                    <div className="mt-auto pt-2">
                      <CollectionProductATC
                        product={product}
                      />
                    </div>
                  </div>
                </div>
              )}
            </PaginatedResourceSection>

            {filteredConnection.nodes.length === 0 && (
              <div className="text-center py-24 bg-gray-50 rounded-3xl mt-4 border border-gray-100">
                <span className="text-6xl text-gray-300 block mb-4">✦</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Try adjusting your filters or browse all categories.
                </p>
                <button
                  onClick={() => setActiveFilters([])}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-semibold tracking-wide rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {collection.handle.toLowerCase() === 'rudraksha' && relatedArticles.length > 0 && (
              <section className="mt-14 border-t border-gray-200 pt-10">
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-gray-500 mb-2">
                      Read and Learn
                    </p>
                    <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
                      Rudraksha Journal
                    </h2>
                  </div>
                  <Link
                    to="/blogs"
                    className="text-[11px] tracking-[0.18em] uppercase text-gray-500 hover:text-black transition-colors"
                  >
                    View all blogs
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
                  {relatedArticles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/blogs/${article.blog.handle}/${article.handle}`}
                      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                      prefetch="intent"
                    >
                      {article.image && (
                        <div className="aspect-16/10 overflow-hidden bg-gray-100">
                          <Image
                            data={article.image}
                            alt={article.image.altText || article.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <time className="text-[10px] tracking-[0.16em] uppercase text-gray-500">
                          {new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }).format(new Date(article.publishedAt))}
                        </time>
                        <h3 className="mt-2 text-base font-medium text-gray-900 leading-snug line-clamp-2">
                          {article.title}
                        </h3>
                        <span className="mt-3 inline-flex text-[10px] tracking-[0.16em] uppercase text-gray-500 group-hover:text-black transition-colors">
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
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-800 text-gray-800 text-xs sm:text-base rounded-full transition-colors group-hover:bg-black/90 group-hover:text-white disabled:cursor-not-allowed cursor-pointer group transition-all duration-300 ease-in-out"
      aria-label="Add to bag"
    >
      <img src="/icons/add-bag.png" alt="" className="w-4 h-4 md:w-6 md:h-6 shrink-0 group-hover:invert group-hover:brightness-0 transition-all" />
      {availableForSale ? 'Add to Bag' : 'Sold Out'}
    </button>
  );
}

// ─── Size pill inner — must be a proper component so useEffect works ─────────
function CollectionSizePillInner({
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
          ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
          : isAdding
            ? 'border-gray-900 bg-gray-900 text-white opacity-70 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white active:scale-95',
      ].join(' ')}
      aria-label={`Add size ${variant.title ?? ''}`}
    >
      {isAdding ? (
        <svg className="animate-spin inline-block w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
        </svg>
      ) : (
        variant.title ?? '—'
      )}
    </button>
  );
}

// ─── Size pill form wrapper for collection page ───────────────────────────────
function CollectionSizePill({
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
      inputs={{ lines: [{ merchandiseId: variant.id, quantity: 1 }] }}
      fetcherKey={`col-size-${productId}-${variant.id}`}
    >
      {(fetcher) => (
        <CollectionSizePillInner
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

// ─── Smart ATC for collection cards ──────────────────────────────────────────
function CollectionProductATC({ product }: { product: any }) {
  const [showSizes, setShowSizes] = useState(false);
  const variants: Array<{ id: string; availableForSale: boolean; title?: string }> = product.variants?.nodes ?? [];
  const firstVariant = variants[0];
  const isAvailable = firstVariant?.availableForSale ?? false;
  const hasMultiple = variants.length > 1;

  if (!isAvailable) {
    return (
      <button disabled className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-400 text-xs sm:text-base rounded-full cursor-not-allowed">
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
          <CollectionAddButton
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
              <CollectionSizePill
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
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border text-xs sm:text-base rounded-full transition-all duration-200 cursor-pointer group ${
          showSizes
            ? 'bg-gray-900 border-gray-900 text-white'
            : 'bg-white border-gray-800 text-gray-800 hover:bg-gray-900 hover:text-white'
        }`}
        aria-label="Select size"
      >
        <img
          src="/icons/add-bag.png"
          alt=""
          className={`w-4 h-4 md:w-6 md:h-6 shrink-0 transition-all ${showSizes ? 'invert brightness-0' : 'group-hover:invert group-hover:brightness-0'}`}
        />
        {showSizes ? 'Close' : 'Select Size'}
      </button>
    </div>
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
    variants(first: 10) {
      nodes {
        id
        availableForSale
        title
        price {
          ...MoneyProductItem
        }
        compareAtPrice {
          ...MoneyProductItem
        }
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
