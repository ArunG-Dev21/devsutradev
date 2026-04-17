import { useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).pages.$handle';
import { redirectIfHandleIsLocalized } from '~/lib/redirect';

import { generateMeta, truncate } from '~/lib/seo';
import { sanitizeHtml } from '~/lib/sanitizer';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';

export const meta: Route.MetaFunction = ({ data }) => {
  const page = (data as any)?.page;
  const origin = (data as any)?.seoOrigin || '';
  const title = `${page?.seo?.title || page?.title || 'Page'} | Devasutra`;
  const description = page?.seo?.description || `Learn more about Devasutra — ${page?.title || ''}.`;
  return generateMeta({
    title,
    description,
    canonical: `${origin}/pages/${page?.handle || ''}`,
  });
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  const origin = new URL(args.request.url).origin;
  return { ...deferredData, ...criticalData, seoOrigin: origin };
}

async function loadCriticalData({ context, request, params }: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{ page }] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
  ]);

  if (!page) {
    throw new Response('Not Found', { status: 404 });
  }

  redirectIfHandleIsLocalized(request, { handle: params.handle, data: page });

  return { page };
}

function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const { page } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70 bg-linear-to-b from-stone-100/75 via-background to-background dark:from-stone-950/40 dark:via-background dark:to-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(201,161,101,0.18),transparent_58%)]" />
        <RouteBreadcrumbBanner variant="light" className="relative z-10" />
        <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="mt-4 max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-amber-200/70 bg-amber-50/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
              Devasutra
            </span>
            <h1 className="mt-5 font-heading text-4xl font-medium uppercase leading-[1.05] tracking-[0.04em] text-foreground sm:text-5xl">
              {page.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="container mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <div className="overflow-hidden rounded-[30px] border border-border/70 bg-card/95 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.4)]">
          <div className="border-b border-border/70 px-5 py-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <span>Devasutra</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{page.title}</span>
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
              [&_hr]:my-8 [&_hr]:border-border/70
            "
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.body) }}
          />
        </div>
      </section>
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
