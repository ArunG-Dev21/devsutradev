import { useLoaderData } from 'react-router';
import type { Route } from './+types/($locale)._index';
import { Hero } from '~/components/Hero';
import { TrustBadges } from '~/components/TrustBadges';

import { WhyDevasutra } from '~/components/WhyDevasutra';
import { KarungaliPromoter } from '~/components/KarungaliPromoter';


export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Devasutra | Sacred Ornaments · Divine Energy' },
    {
      name: 'description',
      content:
        'Discover authentic devotional ornaments — Rudraksha, Karungali, Gemstone bracelets, Sacred Malas & more. Handcrafted, blessed & lab certified.',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const criticalData = await loadCriticalData(args);
  return { ...criticalData };
}

async function loadCriticalData({ context }: Route.LoaderArgs) {
  const { storefront } = context;

  const [
    { collection, karungaliMaala, karungaliBracelets },
    slidesResult,
    testimonialsResult
  ] = await Promise.all([
    storefront.query(FEATURED_COLLECTION_WITH_PRODUCTS_QUERY, {
      variables: { first: 12 },
    }),
    storefront.query(HOMEPAGE_SLIDES_QUERY),
    storefront.query(TESTIMONIALS_QUERY),
  ]);

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
        thumbnailUrl: avatarUrl, // use avatar as video poster
        // product data hydrated from product_reference
        productHandle,
        productTitle,
        productImage,
        productPrice,
      };
    })
    .filter((t: any) => t.name);

  // ── Split into reels (video entries) vs image-only testimonials ─────────
  const reels = testimonials
    .filter((t: any) => t.videoUrl)
    .map((t: any) => ({
      id: t.id,
      videoUrl: t.videoUrl,
      thumbnailUrl: t.thumbnailUrl,
      customerName: t.name,
      customerAvatar: t.avatar,
      caption: t.text,
      productHandle: t.productHandle,
      productTitle: t.productTitle,
      productImage: t.productImage,
      productPrice: t.productPrice,
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
    reels,
    testimonials: imageTestimonials,

  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="home">
      {data.featuredCollection && (
        <Hero collection={data.featuredCollection} slides={data.heroSlides} />
      )}
      <TrustBadges />
      <WhyDevasutra reels={data.reels} testimonials={data.testimonials} />
      <KarungaliPromoter tabs={data.karungaliTabs} />
    </div>
  );
}

// ─── GraphQL Queries ──────────────────────────────────────────────────────────

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
          variants(first: 1) {
            nodes { id availableForSale price { amount currencyCode } }
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

/**
 * TESTIMONIALS_QUERY — matches your real "testimonials" metaobject schema:
 *
 * Fields:
 *   name                   single_line_text
 *   rating                 number_integer
 *   review                 multi_line_text
 *   customer_image         file_reference  → MediaImage  (customer photo / video poster)
 *   product_reference      product_reference → Product   (DIRECT product link — no handle needed)
 *   customer_product_image file_reference  → Video | GenericFile | MediaImage
 *                          (.mp4 videos uploaded to Shopify Files land here)
 *
 * The product_reference fragment pulls handle, title, featuredImage and price
 * so we can render the spotlight card without a separate lookup.
 *
 * The customer_product_image fragment covers all three file types Shopify
 * might return for an .mp4 upload:
 *   • Video        → has sources[].url  (most common for uploaded videos)
 *   • GenericFile  → has url directly   (fallback for non-transcoded files)
 *   • MediaImage   → image.url          (in case a still image is uploaded instead)
 */
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
            # ── Customer photo ──────────────────────────────────────────────
            ... on MediaImage {
              image { url altText width height }
            }

            # ── Linked product (product_reference field) ─────────────────
            ... on Product {
              id
              handle
              title
              featuredImage { url altText width height }
              priceRange {
                minVariantPrice { amount currencyCode }
              }
            }

            # ── Video uploaded to Shopify Files (customer_product_image) ──
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

            # ── Fallback: non-transcoded upload stored as GenericFile ─────
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