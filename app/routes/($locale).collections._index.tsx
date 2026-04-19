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
    pageBy: 8,
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

      <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <PaginatedResourceSection<CollectionFragment>
          connection={collections}
          resourcesClassName="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
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
      to={`/collections/${collection.handle}`}
      prefetch="intent"
      className="group flex flex-col bg-[#f6f6f6] dark:bg-card rounded-[22px] p-2 sm:p-2.5 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image — contained inside padding, never edge-to-edge */}
      <div className="relative aspect-square overflow-hidden rounded-[16px] sm:rounded-[18px] mb-2 sm:mb-2.5 bg-neutral-200 dark:bg-muted">
        {collection?.image ? (
          <Image
            alt={collection.image.altText || collection.title}
            data={collection.image}
            loading={index < 4 ? 'eager' : 'lazy'}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-muted/60">
            <span className="text-4xl opacity-20 text-muted-foreground">✦</span>
          </div>
        )}
      </div>

      {/* Content card */}
      <div className="bg-white dark:bg-background rounded-[16px] sm:rounded-[18px] px-3 py-3 sm:px-4 flex items-center justify-between border border-black/[0.06] dark:border-border gap-2">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight truncate">
            {collection.title}
          </h3>
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium mt-0.5">
            Explore
          </p>
        </div>
        <span className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-full border border-border text-foreground transition-all duration-300 group-hover:bg-foreground group-hover:text-background group-hover:border-foreground">
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
