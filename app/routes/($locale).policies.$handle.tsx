import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/($locale).policies.$handle';
import {type Shop} from '@shopify/hydrogen/storefront-api-types';
import { sanitizeHtml } from '~/lib/sanitizer';

type SelectedPolicies = keyof Pick<
  Shop,
  'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
>;

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Hydrogen | ${data?.policy.title ?? ''}`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No handle was passed in', {status: 404});
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response('Could not find the policy', {status: 404});
  }

  return {policy};
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background py-16 md:py-24">
      <div className="container max-w-4xl mx-auto px-6 lg:px-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mb-8 md:mb-12"
          to="/policies"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Policies
        </Link>
        
        <h1 className="text-3xl md:text-5xl font-light leading-tight mb-10 text-foreground" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {policy.title}
        </h1>
        
        <div 
          className="prose prose-sm md:prose-base dark:prose-invert prose-stone max-w-none 
          prose-headings:font-light prose-headings:text-foreground prose-headings:font-['Cormorant_Garamond',_Georgia,_serif]
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-a:text-foreground prose-a:underline-offset-4 hover:prose-a:text-foreground/80
          prose-strong:text-foreground prose-strong:font-semibold
          prose-li:text-muted-foreground"
          dangerouslySetInnerHTML={{__html: sanitizeHtml(policy.body)}} 
        />
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
` as const;
