import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain:
        context.env.PUBLIC_CHECKOUT_DOMAIN || context.env.PUBLIC_STORE_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    baseUri: ["'self'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'", 'https://*.shopify.com', 'https://*.myshopify.com'],
    styleSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://fonts.googleapis.com',
      "'unsafe-inline'",
    ],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: [
      "'self'",
      'data:',
      'https://cdn.shopify.com',
      'https://images.unsplash.com',
      'https://*.myshopify.com',
      'https://pub-images.judge.me',
      'https://cdn.judge.me',
    ],
    mediaSrc: ["'self'", 'https://cdn.shopify.com', 'https://*.myshopify.com'],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter context={reactRouterContext} url={request.url} nonce={nonce} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);
  responseHeaders.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );
  responseHeaders.set('X-Frame-Options', 'DENY');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  responseHeaders.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()',
  );

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
