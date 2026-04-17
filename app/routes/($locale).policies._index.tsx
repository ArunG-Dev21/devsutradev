import { useLoaderData, Link } from 'react-router';
import type { Route } from './+types/($locale).policies._index';
import type { PoliciesQuery, PolicyItemFragment } from 'storefrontapi.generated';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';

export async function loader({ context }: Route.LoaderArgs) {
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
    throw new Response('No policies found', { status: 404 });
  }

  return { policies };
}

export default function Policies() {
  const { policies } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/70 bg-linear-to-b from-stone-100/80 via-background to-background dark:from-stone-950/40 dark:via-background dark:to-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(201,161,101,0.16),transparent_58%)]" />
        <RouteBreadcrumbBanner variant="light" className="relative z-10" />
        <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-amber-200/70 bg-amber-50/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
              Devasutra Policies
            </span>
            <h1 className="mt-5 font-heading text-4xl font-medium uppercase tracking-[0.04em] text-foreground sm:text-5xl md:text-6xl">
              Legal & Policies
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Privacy, shipping, refunds, and service terms presented in one calm, readable place.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {policies.map((policy, index) => (
              <Link
                className="group relative overflow-hidden rounded-[26px] border border-border/70 bg-card/95 p-6 text-card-foreground shadow-[0_18px_45px_-32px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25"
                key={policy.id}
                to={`/policies/${policy.handle}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-br from-amber-500/10 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="mt-1 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>

                  <div>
                    <h2 className="text-xl font-medium uppercase tracking-[0.05em] text-foreground">
                      {policy.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Read the full {policy.title.toLowerCase()} for orders, returns, privacy, and customer care.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    <span>Open policy</span>
                    <span className="h-px flex-1 bg-border/80 transition-colors duration-300 group-hover:bg-foreground/30" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
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
