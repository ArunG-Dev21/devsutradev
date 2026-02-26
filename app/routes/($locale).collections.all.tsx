import type {Route} from './+types/collections.all';
import {useLoaderData, useSearchParams} from 'react-router';
import {getPaginationVariables, Image, Money} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {useMemo, useState} from 'react';

type CategoryFilter = {
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
  {id: 'karingali', label: 'Karingali', handle: 'karingali'},
  {id: 'rudraksha', label: 'Rudraksha', handle: 'rudraksha'},
  {id: 'bracelets', label: 'Bracelets', handle: 'bracelets'},
];

const PRICE_FILTERS: PriceFilter[] = [
  {id: 'under-500', label: 'Under Rs 500', min: 0, max: 499.99},
  {id: '500-1500', label: 'Rs 500 - Rs 1,500', min: 500, max: 1500},
  {id: '1500-5000', label: 'Rs 1,500 - Rs 5,000', min: 1500, max: 5000},
  {id: 'above-5000', label: 'Above Rs 5,000', min: 5000.01, max: Number.MAX_SAFE_INTEGER},
];

const SORT_OPTIONS = [
  {label: 'Featured', value: 'featured'},
  {label: 'Price: Low to High', value: 'price-asc'},
  {label: 'Price: High to Low', value: 'price-desc'},
  {label: 'Newest First', value: 'newest'},
  {label: 'Best Selling', value: 'best-selling'},
];

const SORT_MAP: Record<
  string,
  {sortKey: 'BEST_SELLING' | 'PRICE' | 'CREATED_AT'; reverse: boolean}
> = {
  featured: {sortKey: 'BEST_SELLING', reverse: true},
  'best-selling': {sortKey: 'BEST_SELLING', reverse: true},
  'price-asc': {sortKey: 'PRICE', reverse: false},
  'price-desc': {sortKey: 'PRICE', reverse: true},
  newest: {sortKey: 'CREATED_AT', reverse: true},
};

const FILTER_GROUPS: Array<{id: 'category' | 'price'; label: string; options: FilterOption[]}> = [
  {
    id: 'category',
    label: 'Category',
    options: CATEGORY_FILTERS.map(({id, label}) => ({id, label})),
  },
  {
    id: 'price',
    label: 'Price Range',
    options: PRICE_FILTERS.map(({id, label}) => ({id, label})),
  },
];

const CATEGORY_BY_ID = new Map(CATEGORY_FILTERS.map((item) => [item.id, item]));
const PRICE_BY_ID = new Map(PRICE_FILTERS.map((item) => [item.id, item]));

export const meta: Route.MetaFunction = () => {
  return [{title: 'All Products | Devasutra - Sacred Living'}];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const url = new URL(request.url);
  const paginationVariables = getPaginationVariables(request, {pageBy: 8});
  const selectedCategoryIds = url.searchParams.getAll('category').filter(Boolean);
  const sort = url.searchParams.get('sort') || 'featured';
  const {sortKey, reverse} = SORT_MAP[sort] ?? SORT_MAP.featured;

  if (selectedCategoryIds.length > 0) {
    const selectedHandles = selectedCategoryIds
      .map((id) => CATEGORY_BY_ID.get(id)?.handle)
      .filter(Boolean) as string[];

    const categoryResults = await Promise.all(
      selectedHandles.map((handle) =>
        storefront.query(CATEGORY_COLLECTION_PRODUCTS_QUERY, {
          variables: {handle, first: 120},
        }),
      ),
    );

    const mergedProducts = new Map<string, CollectionItemFragment>();

    for (const result of categoryResults) {
      const nodes = result.collection?.products?.nodes ?? [];
      for (const node of nodes) mergedProducts.set(node.id, node);
    }

    const sortedNodes = sortProducts([...mergedProducts.values()], sort);

    return {
      products: {
        nodes: sortedNodes,
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          startCursor: null,
          endCursor: null,
        },
      },
    };
  }

  const {products} = await storefront.query(CATALOG_QUERY, {
    variables: {
      ...paginationVariables,
      sortKey,
      reverse,
    },
  });

  return {products};
}

function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

function sortProducts(products: CollectionItemFragment[], sort: string) {
  const sorted = [...products];
  if (sort === 'price-asc') {
    sorted.sort(
      (a, b) =>
        Number(a.priceRange.minVariantPrice.amount) -
        Number(b.priceRange.minVariantPrice.amount),
    );
  } else if (sort === 'price-desc') {
    sorted.sort(
      (a, b) =>
        Number(b.priceRange.minVariantPrice.amount) -
        Number(a.priceRange.minVariantPrice.amount),
    );
  } else if (sort === 'newest') {
    sorted.sort(
      (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)),
    );
  }
  return sorted;
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
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm sticky top-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
          Filters
        </h2>
        {activeFilterIds.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[10px] text-black tracking-wide underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {FILTER_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-semibold mb-3">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.options.map((option) => {
                const isActive = activeFilterIds.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                    onClick={() => onToggleFilter(option.id)}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? 'bg-black border-black'
                          : 'border-neutral-300 group-hover:border-black'
                      }`}
                    >
                      {isActive && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
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
                      className={`text-xs transition-colors ${
                        isActive
                          ? 'text-black font-medium'
                          : 'text-neutral-500 group-hover:text-black'
                      }`}
                    >
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-neutral-200">
        <div className="bg-neutral-50 rounded-xl p-3 text-center border border-neutral-100">
          <p className="text-[10px] tracking-widest uppercase text-black font-semibold mb-1">
            Free Shipping
          </p>
          <p className="text-[11px] text-neutral-500">On all orders above Rs 999</p>
        </div>
      </div>
    </div>
  );
}

export default function Collection() {
  const {products} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const sort = searchParams.get('sort') || 'featured';
  const activeCategoryIds = searchParams.getAll('category').filter(Boolean);
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
    const key = CATEGORY_BY_ID.has(filterId)
      ? 'category'
      : PRICE_BY_ID.has(filterId)
        ? 'price'
        : 'filter';
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
    const next = new URLSearchParams(searchParams);
    next.delete('category');
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

  const filteredConnection = useMemo(() => {
    if (activePriceFilters.length === 0) return products;

    const filteredNodes = (products?.nodes ?? []).filter((product) => {
      const price = Number(product.priceRange.minVariantPrice.amount);
      return activePriceFilters.every((rule) => price >= rule.min && price <= rule.max);
    });

    return {
      ...products,
      nodes: filteredNodes,
    };
  }, [activePriceFilters, products]);

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
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
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl overflow-y-auto p-5 border-r border-neutral-200">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">
                    Filters
                  </h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="text-neutral-500 hover:text-black text-2xl leading-none"
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
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded-xl text-xs text-neutral-600 hover:bg-neutral-100 hover:text-black transition-colors"
                >
                  Filters
                </button>
                <p className="text-xs text-neutral-500 tracking-wide">Browsing all products</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest uppercase text-neutral-500 hidden sm:block">
                  Sort by
                </span>
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white text-black focus:outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 cursor-pointer"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeFilterIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeFilterIds.map((filterId) => (
                  <span
                    key={filterId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-black text-xs rounded-full border border-neutral-200 shadow-sm"
                  >
                    {labelById[filterId] ?? filterId}
                    <button
                      onClick={() => toggleFilter(filterId)}
                      className="text-neutral-500 hover:text-black transition-colors leading-none"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}

            <PaginatedResourceSection<CollectionItemFragment>
              connection={filteredConnection}
              resourcesClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
            >
              {({node: product, index}) => (
                <a
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col border border-neutral-200"
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
                        <span className="text-5xl opacity-20 text-black">*</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-neutral-300 rounded-tl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-neutral-300 rounded-br pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-neutral-200 text-black text-[9px] font-bold tracking-wider uppercase rounded-full shadow-sm">
                        Certified
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 mb-1">
                      Devasutra
                    </p>
                    <h3 className="text-base font-semibold text-black mb-2 leading-snug line-clamp-2">
                      {product.title}
                    </h3>

                    <div className="mt-auto flex items-center justify-between">
                      <div>
                        <Money
                          data={product.priceRange.minVariantPrice}
                          className="text-sm font-bold text-black"
                        />
                        {product.priceRange.maxVariantPrice.amount !==
                          product.priceRange.minVariantPrice.amount && (
                          <span className="text-[10px] text-neutral-500 ml-1">onwards</span>
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
                <span className="text-6xl text-neutral-200 block mb-4">*</span>
                <h3 className="text-xl font-bold text-black mb-2">No products found</h3>
                <p className="text-sm text-neutral-500 mb-6">
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

const CATEGORY_COLLECTION_PRODUCTS_QUERY = `#graphql
  query CollectionProducts(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $first) {
        nodes {
          ...CollectionItem
        }
      }
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
` as const;

