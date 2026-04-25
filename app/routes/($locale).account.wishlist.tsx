import { Link, useFetcher, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).account.wishlist';
import { Image, Money } from '@shopify/hydrogen';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';
import { CUSTOMER_WISHLIST_QUERY } from '~/graphql/customer-account/CustomerWishlistQueries';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Wishlist | Devasutra' }];
};

type WishlistMetafieldResult = {
  customer: {
    id: string;
    metafield: { value: string; type: string } | null;
  } | null;
};

type WishlistProduct = {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  featuredImage: {
    id: string | null;
    altText: string | null;
    url: string;
    width: number | null;
    height: number | null;
  } | null;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: CurrencyCode };
    maxVariantPrice: { amount: string; currencyCode: CurrencyCode };
  };
  variants: {
    nodes: Array<{
      id: string;
      availableForSale: boolean;
      compareAtPrice: { amount: string; currencyCode: CurrencyCode } | null;
    }>;
  };
};

type WishlistProductsResult = {
  nodes: Array<WishlistProduct | null>;
};

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function loader({ context }: Route.LoaderArgs) {
  const { customerAccount, storefront } = context;
  customerAccount.handleAuthStatus();

  const { data: customerData } =
    await customerAccount.query<WishlistMetafieldResult>(
      CUSTOMER_WISHLIST_QUERY,
    );
  const ids = parseList(customerData?.customer?.metafield?.value);

  if (ids.length === 0) {
    return { products: [] as WishlistProduct[] };
  }

  const { nodes } = await storefront.query<WishlistProductsResult>(
    WISHLIST_PRODUCTS_QUERY,
    { variables: { ids } },
  );
  const products = (nodes ?? []).filter(
    (n): n is WishlistProduct => n !== null,
  );

  return { products };
}

export default function Wishlist() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-8 pb-6 border-b border-border">
        <h2 className="text-2xl font-heading font-medium text-foreground tracking-tight text-center">
          Your Wishlist
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 text-center">
          Sacred items you have saved for later.
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {products.map((product) => (
            <li key={product.id}>
              <WishlistCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
      <svg
        className="mx-auto h-10 w-10 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
      <p className="mt-4 text-base font-medium text-foreground">
        Your wishlist is empty
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Tap the heart on any product to save it here.
      </p>
      <Link
        to="/collections/all"
        prefetch="intent"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-background hover:opacity-90 transition-opacity"
      >
        Explore products
      </Link>
    </div>
  );
}

function WishlistCard({ product }: { product: WishlistProduct }) {
  const fetcher = useFetcher({ key: 'wishlist:mutate' });
  const isRemoving =
    fetcher.state !== 'idle' &&
    fetcher.formData?.get('productId') === product.id;
  const compareAt = product.variants?.nodes?.[0]?.compareAtPrice;

  return (
    <div className="group/card relative rounded-2xl overflow-hidden bg-card ring-1 ring-border/50 transition-all duration-300 hover:-translate-y-0.5">
      <Link
        to={`/products/${product.handle}`}
        prefetch="intent"
        className="block no-underline"
      >
        <div className="relative aspect-square bg-muted overflow-hidden m-2 rounded-xl">
          {product.featuredImage ? (
            <Image
              data={product.featuredImage}
              aspectRatio="1/1"
              sizes="(min-width: 1024px) 280px, 50vw"
              className="w-full h-full object-cover rounded-xl transition-transform duration-500 ease-out group-hover/card:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-amber-50 via-orange-50 to-orange-100 dark:from-neutral-800 dark:to-neutral-700" />
          )}
        </div>
        <div className="px-3 sm:px-4 py-3">
          <p className="text-sm font-medium text-foreground line-clamp-1 leading-snug">
            {product.title}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <Money
              data={product.priceRange.minVariantPrice}
              withoutTrailingZeros
              className="text-base font-medium text-foreground font-montserrat"
            />
            {compareAt ? (
              <s className="text-xs text-muted-foreground">
                <Money
                  data={compareAt}
                  withoutTrailingZeros
                  className="font-montserrat"
                />
              </s>
            ) : null}
          </div>
        </div>
      </Link>

      <button
        type="button"
        disabled={isRemoving}
        onClick={() => {
          const fd = new FormData();
          fd.append('productId', product.id);
          fd.append('op', 'remove');
          fetcher.submit(fd, { method: 'post', action: '/api/wishlist' });
        }}
        aria-label="Remove from wishlist"
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-stone-200 flex items-center justify-center text-stone-500 hover:text-[#F14514] hover:border-stone-300 transition-all disabled:opacity-50"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

const WISHLIST_PRODUCTS_QUERY = `#graphql
  query WishlistProducts(
    $ids: [ID!]!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        vendor
        featuredImage {
          id
          altText
          url
          width
          height
        }
        priceRange {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        variants(first: 1) {
          nodes {
            id
            availableForSale
            compareAtPrice { amount currencyCode }
          }
        }
      }
    }
  }
` as const;
