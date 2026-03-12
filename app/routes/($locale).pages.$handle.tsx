import {useLoaderData} from 'react-router';
import type {Route} from './+types/($locale).pages.$handle';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

import { generateMeta, truncate } from '~/lib/seo';

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
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const origin = new URL(args.request.url).origin;
  return {...deferredData, ...criticalData, seoOrigin: origin};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.handle, data: page});

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="border-b border-border py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif tracking-wide uppercase">
          {page.title}
        </h1>

        <div className="mt-4 w-16 h-[2px] bg-foreground mx-auto" />
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div
          className="
            prose
            prose-neutral
            max-w-none
            dark:prose-invert
            prose-headings:font-serif
            prose-headings:tracking-wide
            prose-p:text-muted-foreground
            prose-p:leading-relaxed
            prose-strong:text-foreground
            prose-a:text-foreground
            prose-a:no-underline
            hover:prose-a:underline
          "
          dangerouslySetInnerHTML={{__html: page.body}}
        />
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
