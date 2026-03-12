/**
 * Reusable SEO utilities for Devasutra Hydrogen storefront.
 *
 * All metadata is generated programmatically from Shopify data —
 * nothing is hardcoded except the brand name and default descriptions.
 */

// ── Brand constants ──────────────────────────────────────────────────────────
export const SEO_DEFAULTS = {
  siteName: 'Devasutra',
  tagline: 'Sacred Ornaments · Divine Energy',
  defaultDescription:
    'Discover authentic devotional ornaments — Rudraksha, Karungali, Gemstone bracelets, Sacred Malas & more. Handcrafted, blessed & lab certified.',
  twitterHandle: '@devasutra',
  locale: 'en_IN',
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Truncate text to a maximum length, ending at a word boundary. */
export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).replace(/\s\S*$/, '') + '…';
}

/** Strip HTML tags from a string. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/** Build an absolute URL from a relative path. */
export function canonicalUrl(origin: string, path: string): string {
  // Remove query params and hash for canonical
  const clean = path.split('?')[0].split('#')[0];
  return `${origin}${clean}`;
}

// ── Meta Tag Generators ──────────────────────────────────────────────────────

export interface SeoMeta {
  title: string;
  description: string;
  canonical: string;
  noIndex?: boolean;
  ogImage?: string;
  ogType?: string;
}

/**
 * Generate a full array of meta descriptors (compatible with React-Router meta export)
 * including Open Graph and Twitter Card tags.
 */
export function generateMeta(seo: SeoMeta) {
  const metas: Array<Record<string, string>> = [
    { title: seo.title },
    { name: 'description', content: seo.description },
  ];

  if (seo.noIndex) {
    metas.push({ name: 'robots', content: 'noindex, nofollow' });
  }

  // Open Graph
  metas.push(
    { property: 'og:title', content: seo.title },
    { property: 'og:description', content: seo.description },
    { property: 'og:url', content: seo.canonical },
    { property: 'og:site_name', content: SEO_DEFAULTS.siteName },
    { property: 'og:locale', content: SEO_DEFAULTS.locale },
    { property: 'og:type', content: seo.ogType || 'website' },
  );

  if (seo.ogImage) {
    metas.push(
      { property: 'og:image', content: seo.ogImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
    );
  }

  // Twitter Card
  metas.push(
    { name: 'twitter:card', content: seo.ogImage ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: seo.title },
    { name: 'twitter:description', content: seo.description },
  );

  if (seo.ogImage) {
    metas.push({ name: 'twitter:image', content: seo.ogImage });
  }

  return metas;
}

/** Generate a canonical link descriptor for the `links` export. */
export function generateCanonicalLink(url: string) {
  return { rel: 'canonical', href: url };
}

// ── Structured Data (JSON-LD) Generators ─────────────────────────────────────

/** Wrap any schema object in a JSON-LD script tag string for use with dangerouslySetInnerHTML. */
export function jsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema);
}

/** Organization + WebSite schema for the homepage. */
export function organizationSchema(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: SEO_DEFAULTS.siteName,
        url: origin,
        description: SEO_DEFAULTS.defaultDescription,
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: SEO_DEFAULTS.siteName,
        publisher: { '@id': `${origin}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${origin}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

/** Product + Offer schema. */
export function productSchema(
  product: {
    title: string;
    description?: string;
    handle: string;
    images?: { nodes?: Array<{ url: string; altText?: string | null }> };
    selectedOrFirstAvailableVariant?: {
      price?: { amount: string; currencyCode: string };
      availableForSale?: boolean;
      sku?: string;
    };
  },
  origin: string,
  rating?: { value: number; count: number },
) {
  const variant = product.selectedOrFirstAvailableVariant;
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description
      ? truncate(stripHtml(product.description), 300)
      : undefined,
    url: `${origin}/products/${product.handle}`,
    image: product.images?.nodes?.map((img) => img.url) || [],
    brand: {
      '@type': 'Brand',
      name: SEO_DEFAULTS.siteName,
    },
  };

  if (variant?.sku) {
    schema.sku = variant.sku;
  }

  if (variant?.price) {
    schema.offers = {
      '@type': 'Offer',
      url: `${origin}/products/${product.handle}`,
      priceCurrency: variant.price.currencyCode,
      price: variant.price.amount,
      availability: variant.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SEO_DEFAULTS.siteName,
      },
    };
  }

  if (rating && rating.count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.value.toFixed(1),
      reviewCount: rating.count,
    };
  }

  return schema;
}

/** CollectionPage schema. */
export function collectionSchema(
  collection: { title: string; description?: string; handle: string },
  origin: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.title,
    description: collection.description || undefined,
    url: `${origin}/collections/${collection.handle}`,
  };
}

/** Article schema. */
export function articleSchema(
  article: {
    title: string;
    publishedAt: string;
    excerpt?: string | null;
    author?: { name?: string } | null;
    image?: { url: string } | null;
  },
  blogHandle: string,
  articleHandle: string,
  origin: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    datePublished: article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author?.name || SEO_DEFAULTS.siteName,
    },
    publisher: {
      '@type': 'Organization',
      name: SEO_DEFAULTS.siteName,
    },
    image: article.image?.url || undefined,
    description: article.excerpt
      ? truncate(stripHtml(article.excerpt), 200)
      : undefined,
    mainEntityOfPage: `${origin}/blogs/${blogHandle}/${articleHandle}`,
  };
}

/** BreadcrumbList schema from an array of crumbs. */
export function breadcrumbSchema(
  crumbs: Array<{ name: string; url: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
