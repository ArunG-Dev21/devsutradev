import { useLoaderData } from 'react-router';
import type { Route } from './+types/_index';
import { Hero } from '~/components/Hero';
import { TrustBadges } from '~/components/TrustBadges';
import { Testimonials } from '~/components/Testimonials';
import { ContactForm } from '~/components/ContactForm';

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

/**
 * Load featured collection, homepage slides, and testimonials from Shopify.
 */
async function loadCriticalData({ context }: Route.LoaderArgs) {
  const { storefront } = context;

  const [{ collection }, slidesResult, testimonialsResult] = await Promise.all([
    storefront.query(FEATURED_COLLECTION_WITH_PRODUCTS_QUERY, {
      variables: { first: 12 },
    }),
    storefront.query(HOMEPAGE_SLIDES_QUERY),
    storefront.query(TESTIMONIALS_QUERY),
  ]);

  // Transform metaobject nodes into clean slide objects
  const heroSlides = (slidesResult?.metaobjects?.nodes ?? [])
    .map((node: any) => {
      const fields = Object.fromEntries(
        (node.fields ?? []).map((f: any) => [f.key, f]),
      );
      // Convert full Shopify URLs to relative paths
      let ctaLink = fields.cta_link?.value ?? '/collections/all';
      try {
        const url = new URL(ctaLink);
        ctaLink = url.pathname;
      } catch {
        // already a relative path
      }
      return {
        image: fields.background_image?.reference?.image?.url ?? '',
        heading: fields.heading?.value ?? '',
        subheading: fields.subheading?.value ?? '',
        ctaText: fields.cta_text?.value ?? '',
        ctaLink,
      };
    })
    .filter((slide: any) => slide.image && slide.heading);

  // Transform testimonial metaobjects
  // Field keys from Shopify: name, review, rating, customer_image, product_reference
  const testimonials = (testimonialsResult?.metaobjects?.nodes ?? [])
    .map((node: any) => {
      const fields = Object.fromEntries(
        (node.fields ?? []).map((f: any) => [f.key, f]),
      );
      return {
        name: fields.name?.value ?? '',
        location: fields.location?.value ?? '',
        rating: parseInt(fields.rating?.value ?? '5', 10),
        text: fields.review?.value ?? fields.text?.value ?? '',
        avatar: fields.customer_image?.reference?.image?.url ?? '',
      };
    })
    .filter((t: any) => t.name && t.text);

  return {
    featuredCollection: collection,
    heroSlides,
    testimonials,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="home">
      {/* Hero Section — Swiper + Featured Collection */}
      {data.featuredCollection && (
        <Hero
          collection={data.featuredCollection}
          slides={data.heroSlides}
        />
      )}

      {/* Trust & Promise Section */}
      <TrustBadges />

      {/* Testimonials + Contact Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left — Testimonials */}
            <Testimonials items={data.testimonials} />
            {/* Right — Contact Form */}
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── GraphQL Queries ─────────────────────────────────────────────────────────

const FEATURED_COLLECTION_WITH_PRODUCTS_QUERY = `#graphql
  query FeaturedCollectionWithProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    collection(handle: "featured") {
      id
      title
      handle
      description
      image {
        url
        altText
        width
        height
      }
      products(first: $first, sortKey: BEST_SELLING) {
        nodes {
          id
          title
          handle
          availableForSale
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
            width
            height
          }
          variants(first: 1) {
            nodes {
              id
              availableForSale
            }
          }
        }
      }
    }
  }
` as const;

/**
 * Fetch Homepage Slides metaobjects.
 * Metaobject type: homepage_slides
 * Fields: background_image (file_reference), heading, subheading, cta_text, cta_link
 */
const HOMEPAGE_SLIDES_QUERY = `#graphql
  query HomepageSlides {
    metaobjects(type: "homepage_slides", first: 10) {
      nodes {
        id
        handle
        fields {
          key
          value
          reference {
            ... on MediaImage {
              image {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  }
` as const;

/**
 * Fetch Testimonials metaobjects.
 * Metaobject type: testimonials
 * Fields discovered dynamically via key-value pairs.
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
            ... on MediaImage {
              image {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  }
` as const;
