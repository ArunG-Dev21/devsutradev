import { createHydrogenContext } from '@shopify/hydrogen';
import { AppSession } from '~/lib/session';
import { CART_QUERY_FRAGMENT } from '~/lib/fragments';
import { getLocaleFromRequest } from '~/lib/i18n';

// Define the additional context object
const additionalContext = {
  // Additional context for custom properties, CMS clients, 3P SDKs, etc.
  // These will be available as both context.propertyName and context.get(propertyContext)
  // Example of complex objects that could be added:
  // cms: await createCMSClient(env),
  // reviews: await createReviewsClient(env),
} as const;

// Automatically augment HydrogenAdditionalContext with the additional context type
type AdditionalContextType = typeof additionalContext;

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType { }
}

function getHeader(request: Request, name: string) {
  return request.headers.get(name);
}

function getBuyerIp(request: Request) {
  const forwardedFor = getHeader(request, 'x-forwarded-for')
    ?.split(',')[0]
    ?.trim();

  return (
    getHeader(request, 'oxygen-buyer-ip') ||
    getHeader(request, 'cf-connecting-ip') ||
    getHeader(request, 'x-real-ip') ||
    forwardedFor ||
    '127.0.0.1'
  );
}

function getStorefrontHeaders(request: Request) {
  return {
    requestGroupId: getHeader(request, 'request-id'),
    buyerIp: getBuyerIp(request),
    buyerIpSig: getHeader(request, 'X-Shopify-Client-IP-Sig'),
    cookie: getHeader(request, 'cookie'),
    purpose: getHeader(request, 'sec-purpose') || getHeader(request, 'purpose'),
  };
}

/**
 * Creates Hydrogen context for React Router 7.9.x
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 * */
export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      // Or detect from URL path based on locale subpath, cookies, or any other strategy
      i18n: getLocaleFromRequest(request),
      storefront: {
        headers: getStorefrontHeaders(request),
      },
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
    },
    additionalContext,
  );

  return hydrogenContext;
}
