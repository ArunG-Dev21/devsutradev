import { Link, useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).policies.$handle';
import { type Shop } from '@shopify/hydrogen/storefront-api-types';
import { sanitizeHtml } from '~/lib/sanitizer';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';
import { generateMeta, stripHtml, truncate } from '~/lib/seo';

type SelectedPolicies = keyof Pick<
  Shop,
  'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
>;

export const meta: Route.MetaFunction = ({ data }) => {
  const policy = (data as any)?.policy;
  const origin = (data as any)?.seoOrigin || '';
  return generateMeta({
    title: `${policy?.title ?? 'Policy'} | Devasutra`,
    description: truncate(stripHtml(policy?.body ?? ''), 155) || 'Read Devasutra policy details.',
    canonical: `${origin}/policies/${policy?.handle || ''}`,
  });
};

export async function loader({ params, context, request }: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No handle was passed in', { status: 404 });
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
    throw new Response('Could not find the policy', { status: 404 });
  }

  return { policy, seoOrigin: new URL(request.url).origin };
}

export default function Policy() {
  const { policy } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/70 bg-background">
        <RouteBreadcrumbBanner variant="light" className="relative z-10 !bg-transparent" />
        <div className="container mx-auto max-w-5xl px-3 py-12 sm:px-6 md:py-16 lg:px-8">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
            to="/policies"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Policies
          </Link>

          <div className="mt-8 max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Legal Document
            </span>
            <h1 className="mt-5 font-heading text-4xl font-medium uppercase leading-[1.05] tracking-[0.04em] text-foreground sm:text-5xl md:text-6xl">
              {policy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Please review this document carefully for the terms governing purchases, delivery, privacy, and service on Devasutra.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-3 py-10 sm:px-6 md:py-14 lg:px-8">
        <div className="overflow-hidden rounded-[30px] border border-border/70 bg-card/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_24px_60px_-42px_rgba(0,0,0,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_60px_-42px_rgba(0,0,0,0.7)]">
          <div className="border-b border-border/70 px-5 py-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <span>Devasutra</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>Policy Details</span>
            </div>
          </div>

          <div
            className="
              px-5 py-8 sm:px-8 md:px-10 md:py-10
              text-[15px] leading-8 text-muted-foreground
              [&_h1]:mt-0 [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-medium [&_h1]:uppercase [&_h1]:tracking-[0.04em] [&_h1]:text-foreground
              [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:uppercase [&_h2]:tracking-[0.04em] [&_h2]:text-foreground
              [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-[0.02em] [&_h3]:text-foreground
              [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-foreground
              [&_p]:my-5 [&_p]:leading-8 [&_p]:text-muted-foreground
              [&_strong]:font-semibold [&_strong]:text-foreground
              [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-4
              hover:[&_a]:text-foreground/75
              [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5
              [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5
              [&_li]:pl-1 [&_li]:text-muted-foreground
              [&_blockquote]:my-8 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-amber-700/70 [&_blockquote]:bg-amber-50/50 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:italic [&_blockquote]:text-foreground dark:[&_blockquote]:bg-amber-500/5
              [&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-2xl [&_table]:border [&_table]:border-border/70
              [&_thead]:bg-muted/60
              [&_th]:border-b [&_th]:border-border/70 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.18em] [&_th]:text-foreground
              [&_td]:border-b [&_td]:border-border/60 [&_td]:px-4 [&_td]:py-3 [&_td]:align-top
              [&_img]:my-8 [&_img]:w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/70
              [&_hr]:my-8 [&_hr]:border-border/70
            "
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.body) }}
          />
        </div>
      </section>
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
