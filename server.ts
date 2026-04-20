import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self' https: data: blob:",
  "base-uri 'self'",
  "connect-src 'self' https: https://api.web3forms.com https://judge.me",
  "font-src 'self' https: data:",
  "form-action 'self' https://api.web3forms.com https://*.myshopify.com https://*.shopify.com",
  "frame-ancestors 'none'",
  "frame-src 'self' https: https://shop.app",
  "img-src 'self' https: data: blob:",
  "media-src 'self' https: data: blob:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "upgrade-insecure-requests",
].join('; ');

function applySecurityHeaders(response: Response) {
  response.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Robots-Tag', 'index, follow');
}

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      /**
       * Create a Hydrogen request handler that internally
       * delegates to React Router for routing and rendering.
       */
      const handleRequest = createRequestHandler({
        build: serverBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      if (hydrogenContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      applySecurityHeaders(response);

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        const redirectResponse = await storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
        applySecurityHeaders(redirectResponse);
        return redirectResponse;
      }

      return response;
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }

      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
