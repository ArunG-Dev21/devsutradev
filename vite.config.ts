import { defineConfig, defaultClientConditions, type Plugin } from 'vite';
import { hydrogen } from '@shopify/hydrogen/vite';
import { oxygen } from '@shopify/mini-oxygen/vite';
import { reactRouter } from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

function appendIncomingHeaders(
  target: Headers,
  source: IncomingMessage['headers'],
) {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'undefined') continue;
    if (Array.isArray(value)) {
      for (const item of value) target.append(key, item);
      continue;
    }
    target.set(key, value);
  }
}

function readIncomingBody(req: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
    req.on('aborted', () => reject(new Error('Request body stream aborted')));
  });
}

async function sendWebResponse(res: ServerResponse, webRes: Response) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value: string, key: string) => {
    res.setHeader(key, value);
  });

  if (!webRes.body) {
    res.end();
    return;
  }

  const reader = webRes.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } finally {
    res.end();
  }
}

function installFetchDuplexGuard() {
  const marker = Symbol.for('devasutra.fetch-duplex-guard');
  const globalWithMarker = globalThis as typeof globalThis & {
    [marker]?: true;
  };

  if (globalWithMarker[marker]) return;

  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.body && !('duplex' in init)) {
      const method =
        init.method ||
        (input instanceof Request ? input.method : undefined) ||
        'GET';

      if (method !== 'GET' && method !== 'HEAD') {
        init = {
          ...init,
          duplex: 'half',
        } as RequestInit & { duplex: 'half' };
      }
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  globalWithMarker[marker] = true;
}

/**
 * Node.js-based dev runtime replacing mini-oxygen/workerd.
 * Workerd crashes on this machine due to a Windows/workerd incompatibility.
 * This plugin handles SSR requests directly in Node.js using Vite's ssrLoadModule.
 */
function oxygenNode(): Plugin[] {
  let apiOptions: Record<string, any> = {};
  let installedRejectionGuard = false;

  return [
    {
      name: 'oxygen-node:config',
      config() {
        return {
          appType: 'custom' as const,
          resolve: {
            conditions: ['worker', 'workerd', ...defaultClientConditions],
          },
          ssr: {
            noExternal: true,
            target: 'webworker' as const,
            resolve: {
              conditions: ['worker', 'workerd', ...defaultClientConditions],
            },
          },
        };
      },
      api: {
        registerPluginOptions(newOptions: Record<string, any>) {
          apiOptions = {
            ...apiOptions,
            ...newOptions,
            env: { ...apiOptions.env, ...newOptions.env },
          };
        },
      },
    },
    {
      name: 'oxygen-node:server',
      configureServer: {
        order: 'pre' as const,
        handler(server) {
          return () => {
            installFetchDuplexGuard();

            if (!installedRejectionGuard) {
              installedRejectionGuard = true;
              process.on('unhandledRejection', (reason) => {
                if (reason instanceof Response) {
                  console.error(
                    `[oxygen-node] Unhandled response rejection: ${reason.status} ${reason.statusText}`,
                  );
                  return;
                }
                console.error('[oxygen-node] Unhandled promise rejection', reason);
              });
            }

            // Polyfill Workers globals missing in Node.js
            if (!globalThis.caches) {
              const noopCache = {
                match: () => Promise.resolve(undefined),
                put: () => Promise.resolve(),
                delete: () => Promise.resolve(false),
              };
              (globalThis as any).caches = {
                open: () => Promise.resolve(noopCache),
                default: noopCache,
                match: () => Promise.resolve(undefined),
                has: () => Promise.resolve(false),
                delete: () => Promise.resolve(false),
                keys: () => Promise.resolve([]),
              };
            }

            server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
              // Skip Vite internal requests
              if (req.url?.startsWith('/__vite') || req.url?.startsWith('/@')) {
                return next();
              }

              try {
                const mod = await server.ssrLoadModule('/server');
                const handler = mod.default;
                if (!handler?.fetch) return next();

                const host = req.headers.host || 'localhost:3000';
                const url = `http://${host}${req.url}`;

                // Read body for non-GET/HEAD requests
                let body: Buffer | null = null;
                if (req.method !== 'GET' && req.method !== 'HEAD') {
                  body = await readIncomingBody(req);
                }

                const headers = new Headers();
                appendIncomingHeaders(headers, req.headers);

                const webReq = new Request(url, {
                  method: req.method,
                  headers,
                  ...(body?.length ? { body, duplex: 'half' } : {}),
                } as RequestInit & { duplex?: string });

                // Build env: .env file vars come from apiOptions.env, rest from process.env
                const env = { ...process.env, ...apiOptions.env };

                const ctx = {
                  waitUntil: (promise: Promise<unknown>) => {
                    promise.catch((error) => {
                      if (error instanceof Response) {
                        console.error(
                          `[oxygen-node] waitUntil rejected with response: ${error.status} ${error.statusText}`,
                        );
                        return;
                      }
                      console.error('[oxygen-node] waitUntil rejected', error);
                    });
                  },
                  passThroughOnException: () => {},
                };

                const webRes: Response = await handler.fetch(webReq, env, ctx);
                await sendWebResponse(res, webRes);
              } catch (err) {
                if (err instanceof Response) {
                  await sendWebResponse(res, err);
                  return;
                }

                server.ssrFixStacktrace(err as Error);
                next(err);
              }
            });
          };
        },
      },
    },
  ];
}

export default defineConfig(({ command }) => {
  return {
    plugins: [
      tailwindcss(),
      hydrogen(),
      // Use your custom Node SSR for local dev to prevent workerd crashing on Windows.
      // Use official Shopify mini-oxygen compiler on Oxygen builds.
      command === 'serve' ? oxygenNode() : oxygen(),
      reactRouter(),
      tsconfigPaths(),
    ],
    build: {
      assetsInlineLimit: 0,
    },
    ssr: {
      optimizeDeps: {
        include: [
          'typographic-base',
          'xss',
        ],
      },
    },
  };
});
