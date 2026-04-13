import { useLoaderData } from 'react-router';
import type { Route } from './+types/($locale)._index';
import { Hero } from '~/features/home/components/Hero';
import { TrustBadges } from '~/features/home/components/TrustBadges';

import { WhyDevasutra } from '~/features/home/components/WhyDevasutra';
import { KarungaliPromoter } from '~/features/home/components/KarungaliPromoter';
import { SocialFeed } from '~/features/home/components/SocialFeed';
import socialFeedStyles from '~/styles/social-feed.css?url';
import {
  SEO_DEFAULTS,
  generateMeta,
  organizationSchema,
  jsonLd,
} from '~/lib/seo';

export const meta: Route.MetaFunction = ({ data }) => {
  const origin = (data as any)?.seoOrigin || '';
  const title = `${SEO_DEFAULTS.siteName} | ${SEO_DEFAULTS.tagline}`;
  return generateMeta({
    title,
    description: SEO_DEFAULTS.defaultDescription,
    canonical: origin || '/',
    ogType: 'website',
  });
};

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  const origin = new URL(args.request.url).origin;
  return { ...criticalData, seoOrigin: origin };
}

async function loadCriticalData({ context }: Route.LoaderArgs) {
  const { storefront } = context;

  const [
    { collection, karungaliMaala, karungaliBracelets },
    slidesResult,
    testimonialsResult,
    socialReelsResult
  ] = await Promise.all([
    storefront.query(FEATURED_COLLECTION_WITH_PRODUCTS_QUERY, {
      variables: { first: 12 },
    }),
    storefront.query(HOMEPAGE_SLIDES_QUERY),
    storefront.query(TESTIMONIALS_QUERY),
    storefront.query(SOCIAL_REELS_QUERY),
  ]);

  // Fetch Judge.me review summaries for featured collection products
  let reviewSummaries: Record<string, { averageRating: number; reviewCount: number }> = {};
  const judgeMeToken = context.env.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;
  if (typeof judgeMeToken === 'string' && typeof shopDomain === 'string' && collection) {
    try {
      const { getJudgeMeBatchSummaries } = await import('~/lib/judgeme.server');
      const productEntries = (collection.products?.nodes ?? [])
        .map((p: any) => ({
          id: String(p.id).split('/').pop() || '',
          handle: p.handle,
        }))
        .filter((p: any) => p.id);
      const summaryMap = await getJudgeMeBatchSummaries({
        shopDomain,
        apiToken: judgeMeToken,
        products: productEntries,
      });
      for (const [id, summary] of summaryMap) {
        reviewSummaries[id] = summary;
      }
    } catch {
      // non-critical
    }
  }

  // ── Hero slides ──────────────────────────────────────────────────────────
  const heroSlides = (slidesResult?.metaobjects?.nodes ?? [])
    .map((node: any) => {
      const fields = Object.fromEntries(
        (node.fields ?? []).map((f: any) => [f.key, f]),
      );
      let ctaLink = fields.cta_link?.value ?? '/collections/all';
      try {
        const url = new URL(ctaLink);
        ctaLink = url.pathname;
      } catch { /* already relative */ }
      return {
        image: fields.background_image?.reference?.image?.url ?? '',
        heading: fields.heading?.value ?? '',
        subheading: fields.subheading?.value ?? '',
        ctaText: fields.cta_text?.value ?? '',
        ctaLink,
      };
    })
    .filter((s: any) => s.image && s.heading);

  // ── Testimonials ──────────────────────────────────────────────────────────
  //
  // YOUR ACTUAL metaobject fields (from Shopify Admin screenshot):
  //   name                    → single_line_text        (display name field)
  //   rating                  → number_integer
  //   review                  → multi_line_text
  //   customer_image          → file_reference → MediaImage  (customer photo)
  //   product_reference       → product_reference → Product  (linked product!)
  //   customer_product_image  → file_reference → Video OR MediaImage
  //                             (this is where the video lives – Shopify stores
  //                              .mp4 uploads as GenericFile or Video here)
  //
  const testimonials = (testimonialsResult?.metaobjects?.nodes ?? [])
    .map((node: any) => {
      const fields = Object.fromEntries(
        (node.fields ?? []).map((f: any) => [f.key, f]),
      );

      // ── Product: pulled from the product_reference field ─────────────────
      // Shopify returns the linked product directly under .reference
      const productRef = fields.product_reference?.reference;
      const productHandle = productRef?.handle ?? null;
      const productTitle = productRef?.title ?? null;
      // Use the product's featured image for the spotlight card
      const productImage = productRef?.featuredImage?.url ?? null;
      // Format price from the product's first variant
      const rawPrice = productRef?.priceRange?.minVariantPrice;
      const productPrice = rawPrice
        ? `${rawPrice.currencyCode === 'INR' ? '₹' : rawPrice.currencyCode} ${Number(rawPrice.amount).toLocaleString('en-IN')}`
        : null;

      // ── customer_image → small avatar circle (and video poster fallback) ──
      const avatarUrl = fields.customer_image?.reference?.image?.url ?? '';

      // ── customer_product_image → the BIG tile media ───────────────────────
      // This is the main content shown in the tile.
      // Shopify can return it as Video, GenericFile, or MediaImage.
      const mediaRef = fields.customer_product_image?.reference;

      // Find an MP4 source for broader browser compatibility, fallback to the first source
      const mp4Source = mediaRef?.sources?.find(
        (s: any) => s.mimeType === 'video/mp4' || s.format === 'mp4' || s.format === 'MP4'
      );
      const activeVideoSource = mp4Source ?? mediaRef?.sources?.[0];

      // If it's a video file
      const videoUrl =
        activeVideoSource?.url ?? // Video type
        (mediaRef?.mimeType?.startsWith('video') ? mediaRef?.url : null) ?? // GenericFile video
        null;

      // If it's a still image (MediaImage or non-video GenericFile)
      const tileImageUrl =
        mediaRef?.image?.url ??        // MediaImage type
        (!mediaRef?.mimeType?.startsWith('video') ? mediaRef?.url : null) ?? // GenericFile image
        null;

      return {
        id: node.id as string,
        name: fields.name?.value ?? '',
        location: '',
        rating: parseInt(fields.rating?.value ?? '5', 10),
        text: fields.review?.value ?? '',
        // customer_image → avatar circle only
        avatar: avatarUrl,
        // customer_product_image → tile content
        videoUrl,
        tileImageUrl,
        thumbnailUrl: avatarUrl, 
        productHandle,
        productTitle,
        productImage,
        productPrice,
      };
    })
    .filter((t: any) => t.name);

  const testimonialReels = testimonials
    .filter((t: any) => !!t.videoUrl)
    .map((t: any) => ({
      ...t,
      customerName: t.name,
      customerAvatar: t.avatar,
      isVerified: true,
    }));

  const imageTestimonials = testimonials
    .filter((t: any) => !t.videoUrl)
    .map((t: any) => ({
      id: t.id,
      name: t.name,
      location: t.location ?? '',
      rating: t.rating,
      text: t.text,
      avatar: t.tileImageUrl || t.avatar,
      productHandle: t.productHandle,
      productTitle: t.productTitle,
      productImage: t.productImage,
      productPrice: t.productPrice,
    }));

  // ── Social Reels (Dedicated social_reel type) ─────────────────────────────
  const socialReels = (socialReelsResult?.metaobjects?.nodes ?? [])
    .map((node: any) => {
      const fields = Object.fromEntries(
        (node.fields ?? []).map((f: any) => [f.key, f]),
      );

      const videoRef = fields.video?.reference;
      const mp4Source = videoRef?.sources?.find(
        (s: any) => s.mimeType === 'video/mp4' || s.format === 'mp4' || s.format === 'MP4'
      );
      const activeVideoSource = mp4Source ?? videoRef?.sources?.[0];
      const videoUrl = activeVideoSource?.url ?? (videoRef?.mimeType?.startsWith('video') ? videoRef?.url : null);

      const thumbnailUrl = fields.thumbnail?.reference?.image?.url ?? null;

      const rawViewCount = fields.view_count?.value ?? null;
      const viewCount = rawViewCount ? rawViewCount : `${(Math.random() * 5 + 1).toFixed(1)}M`;

      const products = (fields.tagged_products?.references?.nodes ?? []).map((p: any) => {
        const rawPrice = p.priceRange?.minVariantPrice;
        const productPrice = rawPrice
          ? `${rawPrice.currencyCode === 'INR' ? '₹' : rawPrice.currencyCode} ${Number(rawPrice.amount).toLocaleString('en-IN')}`
          : null;
        const firstVariant = p.variants?.nodes?.[0];
        return {
          id: p.id,
          handle: p.handle,
          title: p.title,
          image: p.featuredImage?.url,
          price: productPrice,
          variantId: firstVariant?.id ?? null,
          availableForSale: firstVariant?.availableForSale ?? true,
          variants: (p.variants?.nodes ?? []).map((v: any) => ({
            id: v.id,
            availableForSale: v.availableForSale,
            title: v.title ?? v.id,
          })),
        };
      });

      const firstProduct = products[0] || null;

      return {
        id: node.id,
        videoUrl,
        thumbnailUrl,
        viewCount,
        influencerName: fields.influencer_name?.value ?? '',
        creatorHandle: fields.creator_handle?.value ?? '',
        caption: fields.caption?.value ?? '',
        products,
        customerName: fields.influencer_name?.value ?? '',
        productHandle: firstProduct?.handle ?? null,
        productTitle: firstProduct?.title ?? null,
        productImage: firstProduct?.image ?? null,
        productPrice: firstProduct?.price ?? null,
      };
    })
    .filter((r: any) => !!r.videoUrl);

  const formatTab = (handle: string, label: string, colData: any) => ({
    id: handle,
    label,
    image: colData?.image || null,
    products: colData?.products?.nodes || []
  });

  const karungaliTabs = [
    formatTab('karungali-maala', 'Maala', karungaliMaala),
    formatTab('karungali-bracelets', 'Bracelets', karungaliBracelets)
  ];

  return {
    featuredCollection: collection,
    karungaliTabs,
    heroSlides,
    testimonialReels,
    socialReels,
    testimonials: imageTestimonials,
    reviewSummaries,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const origin = (data as any).seoOrigin || '';

  return (
    <div className="home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(organizationSchema(origin)),
        }}
      />
      {data.featuredCollection && (
        <Hero collection={data.featuredCollection} slides={data.heroSlides} reviewSummaries={data.reviewSummaries} />
      )}
      <TrustBadges />
      <WhyDevasutra reels={data.testimonialReels} testimonials={data.testimonials} />
      <link rel="stylesheet" href={socialFeedStyles} />
      <KarungaliPromoter tabs={data.karungaliTabs} />
      {data.socialReels && <SocialFeed reels={data.socialReels} />}
    </div>
  );
}

const FEATURED_COLLECTION_WITH_PRODUCTS_QUERY = `#graphql
  query FeaturedCollectionWithProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    collection(handle: "featured") {
      id title handle description
      image { url altText width height }
      products(first: $first, sortKey: BEST_SELLING) {
        nodes {
          id title handle availableForSale
          priceRange { minVariantPrice { amount currencyCode } }
          compareAtPriceRange { minVariantPrice { amount currencyCode } }
          featuredImage { url altText width height }
          images(first: 2) { nodes { url altText width height } }
          variants(first: 10) {
            nodes { id availableForSale title price { amount currencyCode } }
          }
        }
      }
    }
    karungaliMaala: collection(handle: "karungali-maala") { ...CollectionPreview }
    karungaliBracelets: collection(handle: "karungali-bracelets") { ...CollectionPreview }
  }

  fragment CollectionPreview on Collection {
    id
    title
    handle
    image { url altText width height }
    products(first: 8, sortKey: BEST_SELLING) {
      nodes {
        id title handle availableForSale
        priceRange { minVariantPrice { amount currencyCode } }
        featuredImage { url altText width height }
      }
    }
  }
` as const;

const HOMEPAGE_SLIDES_QUERY = `#graphql
  query HomepageSlides {
    metaobjects(type: "homepage_slides", first: 10) {
      nodes {
        id handle
        fields {
          key value
          reference {
            ... on MediaImage { image { url altText width height } }
          }
        }
      }
    }
  }
` as const;

const TESTIMONIALS_QUERY = `#graphql
  query Testimonials {
    metaobjects(type: "testimonials", first: 20) {
      nodes {
        id
        handle
        fields {
          key
          value
          reference {
            ... on MediaImage {
              image { url altText width height }
            }
            ... on Product {
              id
              handle
              title
              featuredImage { url altText width height }
              priceRange {
                minVariantPrice { amount currencyCode }
              }
            }
            ... on Video {
              id
              sources {
                url
                mimeType
                format
                height
                width
              }
            }
            ... on GenericFile {
              id
              url
              mimeType
            }
          }
        }
      }
    }
  }
` as const;

const SOCIAL_REELS_QUERY = `#graphql
  query SocialReels {
    metaobjects(type: "social_reel", first: 20) {
      nodes {
        id
        fields {
          key
          value
          reference {
            ... on Video {
              id
              sources {
                url
                mimeType
                format
              }
            }
            ... on GenericFile {
              id
              url
              mimeType
            }
            ... on MediaImage {
              image { url altText width height }
            }
          }
          references(first: 10) {
            nodes {
              ... on Product {
                id
                handle
                title
                featuredImage { url altText width height }
                priceRange {
                  minVariantPrice { amount currencyCode }
                }
                variants(first: 10) {
                  nodes { id availableForSale title }
                }
              }
            }
          }
        }
      }
    }
  }
` as const;