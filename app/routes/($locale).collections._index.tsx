import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/($locale).collections._index';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/features/collection/components/PaginatedResourceSection';
import {CollectionHeroBanner} from '~/features/collection/components/CollectionHeroBanner';
import {RouteBreadcrumbBanner} from '~/shared/components/RouteBreadcrumbBanner';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Sacred Collections - Rudraksha, Karungali & More | Devasutra'},
    {
      name: 'description',
      content:
        'Discover our curated collections of authentic, energised spiritual products - Rudraksha, Karungali, gemstone bracelets and more.',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
  ]);

  return {collections};
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CollectionHeroBanner
        eyebrow="Sacred Offerings"
        title="Our Collections"
        description="From Rudraksha to Karungali and spiritual bracelets, each collection is arranged to help you discover the material, meaning, and energy that best fits your practice."
        imageSrc="/menu-all-collections.png"
        imageAlt="Devasutra sacred collections"
        align="right"
        highlights={['Rudraksha', 'Karungali', 'Bracelets', 'Sacred Living']}
        breadcrumb={<RouteBreadcrumbBanner variant="overlay" />}
        breadcrumbPlacement="inside-top"
      />

      <div className="container mx-auto px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <PaginatedResourceSection<CollectionFragment>
          connection={collections}
          resourcesClassName="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12"
        >
          {({node: collection, index}) => (
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
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground transition-all duration-300 hover:-translate-y-1.5"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      <div className="relative aspect-[2/1] overflow-hidden border-b border-border bg-neutral-900">
        {collection?.image ? (
          <Image
            alt={collection.image.altText || collection.title}
            data={collection.image}
            loading={index < 2 ? 'eager' : 'lazy'}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100">
            <span className="text-6xl text-muted-foreground/20">*</span>
          </div>
        )}

        <div className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-tl border-l-2 border-t-2 border-white/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 rounded-br border-b-2 border-r-2 border-white/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-col items-center justify-between gap-4 p-6 text-center sm:flex-row sm:items-start sm:text-left md:p-8">
        <div>
          <h3 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
            {collection.title}
          </h3>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Explore Collection
          </p>
        </div>

        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-all duration-300 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
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
