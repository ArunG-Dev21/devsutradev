import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).account.wishlist';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';
import { CUSTOMER_WISHLIST_QUERY } from '~/graphql/customer-account/CustomerWishlistQueries';
import { ProductCard } from '~/features/product/components/ProductCard';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Wishlist | Devasutra' }];
};

type WishlistMetafieldResult = {
  customer: {
    id: string;
    metafield: { value: string; type: string } | null;
  } | null;
};

type Money = { amount: string; currencyCode: CurrencyCode };

type WishlistImage = {
  id: string | null;
  altText: string | null;
  url: string;
  width: number | null;
  height: number | null;
};

type WishlistProduct = {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  tags: string[];
  featuredImage: WishlistImage | null;
  images: { nodes: WishlistImage[] };
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      availableForSale: boolean;
      price: Money;
      compareAtPrice: Money | null;
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
  await customerAccount.handleAuthStatus();

  const { data: customerData } =
    await customerAccount.query<WishlistMetafieldResult>(
      CUSTOMER_WISHLIST_QUERY,
    );
  const ids = parseList(customerData?.customer?.metafield?.value);

  if (ids.length === 0) {
    return {
      products: [] as WishlistProduct[],
      reviewSummaries: {} as Record<
        string,
        { averageRating: number; reviewCount: number }
      >,
    };
  }

  const { nodes } = await storefront.query<WishlistProductsResult>(
    WISHLIST_PRODUCTS_QUERY,
    { variables: { ids } },
  );
  const products = (nodes ?? []).filter(
    (n): n is WishlistProduct => n !== null,
  );

  // Best-effort Judge.me review summary enrichment (matches collection page).
  const reviewSummaries: Record<
    string,
    { averageRating: number; reviewCount: number }
  > = {};
  const judgeMeToken = context.env.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;
  if (typeof judgeMeToken === 'string' && typeof shopDomain === 'string') {
    try {
      const { getJudgeMeBatchSummaries } = await import('~/lib/judgeme.server');
      const productEntries = products
        .map((p) => ({
          id: String(p.id).split('/').pop() || '',
          handle: p.handle,
        }))
        .filter((p) => p.id);
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
      // Non-critical: render the page without review stars.
    }
  }

  return { products, reviewSummaries };
}

export default function Wishlist() {
  const { products, reviewSummaries } = useLoaderData<typeof loader>();

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
        <ul className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
          {products.map((product, index) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                index={index}
                reviewSummaries={reviewSummaries}
              />
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
        tags
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
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        variants(first: 10) {
          nodes {
            id
            title
            availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
          }
        }
      }
    }
  }
` as const;
