import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/($locale).policies._index';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy): policy is PolicyItemFragment => policy != null);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background py-16 md:py-24">
      <div className="container max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <h1 className="text-3xl md:text-5xl font-light leading-tight mb-12 text-foreground" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Legal & Policies
        </h1>
        <div className="grid gap-4 max-w-md mx-auto">
          {policies.map((policy) => (
            <Link
              className="px-6 py-5 rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-foreground/30 transition-all duration-300 flex items-center justify-between group"
              key={policy.id}
              to={`/policies/${policy.handle}`}
            >
              <span className="font-medium tracking-wide">{policy.title}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1 duration-300">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
` as const;
