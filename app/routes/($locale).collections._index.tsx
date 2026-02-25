import { useLoaderData, Link } from 'react-router';
import type { Route } from './+types/collections._index';
import { getPaginationVariables, Image } from '@shopify/hydrogen';
import type { CollectionFragment } from 'storefrontapi.generated';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return { ...deferredData, ...criticalData };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({ context, request }: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const [{ collections }] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return { collections };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: Route.LoaderArgs) {
  return {};
}

export default function Collections() {
  const { collections } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Hero Section */}
      <div className="relative bg-neutral-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neutral-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-neutral-400 mb-3">
            ✦ Sacred Offerings ✦
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Our Collections
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Discover our carefully curated ranges of authentic, energised spiritual tools and artifacts.
          </p>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <PaginatedResourceSection<CollectionFragment>
          connection={collections}
          resourcesClassName="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
        >
          {({ node: collection, index }) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              index={index}
            />
          )}
        </PaginatedResourceSection>
      </div>
    </div>
  );
}

function CollectionItem({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  return (
    <Link
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col border border-neutral-200"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      <div className="aspect-[2/1] bg-neutral-900 border-b border-neutral-200 overflow-hidden relative">
        {collection?.image ? (
          <Image
            alt={collection.image.altText || collection.title}
            data={collection.image}
            loading={index < 2 ? 'eager' : 'lazy'}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <span className="text-6xl opacity-20 text-black">✦</span>
          </div>
        )}

        {/* Hover corner ornaments */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/50 rounded-tl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/50 rounded-br pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between text-center sm:text-left gap-4">
        <div>
          <h3 className="text-2xl font-bold text-black tracking-tight mb-2">
            {collection.title}
          </h3>
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium">
            Explore Collection
          </p>
        </div>

        <span className="shrink-0 w-12 h-12 rounded-full border border-neutral-300 flex items-center justify-center transition-all duration-300 group-hover:bg-black group-hover:border-black group-hover:text-white text-black shadow-sm group-hover:shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
