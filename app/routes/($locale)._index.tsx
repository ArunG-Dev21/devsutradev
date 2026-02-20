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
 * Load the featured collection with its products for the hero section.
 */
async function loadCriticalData({ context }: Route.LoaderArgs) {
  const { storefront } = context;

  const { collection } = await storefront.query(
    FEATURED_COLLECTION_WITH_PRODUCTS_QUERY,
    {
      variables: {
        first: 12,
      },
    },
  );

  return {
    featuredCollection: collection,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="home">
      {/* Hero Section — Swiper + Featured Collection */}
      {data.featuredCollection && (
        <Hero collection={data.featuredCollection} />
      )}

      {/* Trust & Promise Section */}
      <TrustBadges />

      {/* Testimonials + Contact Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left — Testimonials */}
            <Testimonials />
            {/* Right — Contact Form */}
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Query: fetch the first collection (most recently updated) with its products.
 * The user should set a "Featured" or "Sacred Collection" as their primary collection.
 */
const FEATURED_COLLECTION_WITH_PRODUCTS_QUERY = `#graphql
  query FeaturedCollectionWithProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    collection(handle: "frontpage") {
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
