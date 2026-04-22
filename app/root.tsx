import { Analytics, getShopAnalytics, useNonce } from '@shopify/hydrogen';
import { useEffect } from 'react';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  Link,
} from 'react-router';
import type { Route } from './+types/root';
import favicon from '~/assets/favicon.svg';
import { FOOTER_QUERY, HEADER_QUERY } from '~/lib/fragments';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import lenisStyles from 'lenis/dist/lenis.css?url';
import { PageLayout } from './shared/components/PageLayout';
import { ThemeProvider, ThemeScript } from '~/context/theme';
import { generateMeta, SEO_DEFAULTS } from '~/lib/seo';

export type RootLoader = typeof loader;

export const meta: Route.MetaFunction = ({ data }) => {
  const origin = (data as any)?.seoOrigin || '';
  return generateMeta({
    title: `${SEO_DEFAULTS.siteName} | ${SEO_DEFAULTS.tagline}`,
    description: SEO_DEFAULTS.defaultDescription,
    canonical: origin || '/',
    ogType: 'website',
    ogImage: origin ? `${origin}/logo-branding.png` : undefined,
  });
};

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
{ rel: 'icon', type: 'image/svg+xml', href: favicon },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const { storefront, env } = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    seoOrigin: new URL(args.request.url).origin,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN || env.PUBLIC_STORE_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({ context }: Route.LoaderArgs) {
  const { storefront } = context;

  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return { header };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: Route.LoaderArgs) {
  const { storefront, customerAccount, cart } = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer', // Adjust to your footer menu handle
      },
    })
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

export function Layout({ children }: { children?: React.ReactNode }) {
  const nonce = useNonce();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="format-detection" content="telephone=no" />
        <ThemeScript nonce={nonce} />
        <link rel="stylesheet" href={tailwindCss} />
        <link rel="stylesheet" href={resetStyles} />
        <link rel="stylesheet" href={appStyles} />
        <link rel="stylesheet" href={lenisStyles} />
        <Meta />
        <Links />
      </head>
      <body className="font-body antialiased text-stone-900">
        <ThemeProvider>{children}</ThemeProvider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

function LenisInit() {
  useEffect(() => {
    // Honor reduced-motion: skip smooth-scroll entirely so the browser's
    // native (instant) scroll is used.
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let lenis: any;
    let cancelled = false;

    async function init() {
      const { default: Lenis } = await import('lenis');
      if (cancelled) return;
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.1,
        wheelMultiplier: 1,
        // Native touch scroll is smoother than synthesised on mobile.
        syncTouch: false,
        // Lenis already auto-skips elements with [data-lenis-prevent], but be
        // explicit so internal scroll containers (modals, search results,
        // social-feed snap rails) never get hijacked by the page-level loop.
        prevent: (node) =>
          node.closest('[data-lenis-prevent]') !== null,
      });
      // Expose for modals that need to stop()/start() while open so their
      // internal scroll containers receive wheel/touch events natively.
      (window as any).__lenis = lenis;
    }

    init();

    return () => {
      cancelled = true;
      if (lenis) lenis.destroy();
      if ((window as any).__lenis === lenis) {
        delete (window as any).__lenis;
      }
    };
  }, []);

  return null;
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return null;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <LenisInit />
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    const data: unknown = error.data;
    if (data && typeof data === 'object' && 'message' in data && typeof (data as {message?: unknown}).message === 'string') {
      errorMessage = (data as {message: string}).message;
    } else if (typeof data === 'string') {
      errorMessage = data;
    } else if (data != null) {
      try {
        errorMessage = JSON.stringify(data);
      } catch {
        errorMessage = String(data);
      }
    }
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const isNotFound = errorStatus === 404;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative bg-neutral-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neutral-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-xs tracking-[0.35em] uppercase text-neutral-400 mb-4">
            {isNotFound ? 'Page Not Found' : 'Application Error'}
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-none mb-4">
            {errorStatus}
          </h1>
          <p className="text-sm md:text-base text-neutral-300 max-w-2xl mx-auto">
            {isNotFound
              ? 'The page you requested does not exist or has moved.'
              : 'Something went wrong while loading this page.'}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card text-card-foreground border border-border rounded-3xl p-6 md:p-8">
          <div className="flex flex-wrap gap-3 mb-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 text-xs tracking-[0.16em] uppercase font-semibold rounded-xl bg-black text-white hover:bg-neutral-800 transition-colors no-underline"
            >
              Go Home
            </Link>
            <Link
              to="/collections/all"
              className="inline-flex items-center justify-center px-6 py-3 text-xs tracking-[0.16em] uppercase font-semibold rounded-xl border border-border text-foreground hover:bg-muted transition-colors no-underline"
            >
              Shop All
            </Link>
          </div>
          <p className="text-xs text-neutral-500">
            {errorMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
