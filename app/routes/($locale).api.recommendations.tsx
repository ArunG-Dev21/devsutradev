import { data } from 'react-router';
import type { Route } from './+types/api.recommendations';

type RecommendedProduct = {
  id: string;
  handle: string;
  title: string;
  tags: string[];
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  variant?: { id: string; availableForSale: boolean } | null;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 4), 8));
  const exclude = (url.searchParams.get('exclude') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const excludeSet = new Set(exclude);

  const { storefront } = context;

  const resp: any = await storefront.query(RECOMMENDATIONS_QUERY, {
    cache: storefront.CacheShort(),
    variables: {
      collectionsFirst: 12,
      productsFirst: 8,
    },
  });

  const collections = resp?.collections?.nodes ?? [];

  const perCollection: RecommendedProduct[] = [];
  const remaining: RecommendedProduct[] = [];

  for (const collection of shuffle(collections)) {
    const products: RecommendedProduct[] = shuffle(
      (collection?.products?.nodes ?? []).map((p: any) => ({
        id: p.id,
        handle: p.handle,
        title: p.title,
        tags: p.tags ?? [],
        featuredImage: p.featuredImage ?? null,
        priceRange: p.priceRange,
        variant: p.variants?.nodes?.[0] ?? null,
      })),
    );

    const pick = products.find((p) => !excludeSet.has(p.id));
    if (pick) perCollection.push(pick);

    for (const p of products) {
      if (!excludeSet.has(p.id)) remaining.push(p);
    }
  }

  const picked: RecommendedProduct[] = [];
  const seen = new Set<string>();

  for (const p of shuffle(perCollection)) {
    if (picked.length >= limit) break;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    picked.push(p);
  }

  for (const p of shuffle(remaining)) {
    if (picked.length >= limit) break;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    picked.push(p);
  }

  return data({ products: picked }, { headers: { 'Cache-Control': 'no-store' } });
}

const RECOMMENDATIONS_QUERY = `#graphql
  fragment MoneyRecommendations on MoneyV2 {
    amount
    currencyCode
  }

  fragment RecommendedProduct on Product {
    id
    handle
    title
    tags
    featuredImage {
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyRecommendations
      }
    }
    variants(first: 1) {
      nodes {
        id
        availableForSale
      }
    }
  }

  query Recommendations(
    $country: CountryCode
    $language: LanguageCode
    $collectionsFirst: Int!
    $productsFirst: Int!
  ) @inContext(country: $country, language: $language) {
    collections(first: $collectionsFirst) {
      nodes {
        id
        handle
        products(first: $productsFirst) {
          nodes {
            ...RecommendedProduct
          }
        }
      }
    }
  }
` as const;
