import { defineConfig, defaultClientConditions, type Plugin } from 'vite';
import { hydrogen } from '@shopify/hydrogen/vite';
import { oxygen } from '@shopify/mini-oxygen/vite';
import { reactRouter } from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Node.js-based dev runtime replacing mini-oxygen/workerd.
 * Workerd crashes on this machine due to a Windows/workerd incompatibility.
 * This plugin handles SSR requests directly in Node.js using Vite's ssrLoadModule.
 */
function oxygenNode(): Plugin[] {
  let apiOptions: Record<string, any> = {};

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
                  body = await new Promise<Buffer>((resolve) => {
                    const chunks: Buffer[] = [];
                    req.on('data', (c: Buffer) => chunks.push(c));
                    req.on('end', () => resolve(Buffer.concat(chunks)));
                  });
                }

                const webReq = new Request(url, {
                  method: req.method,
                  headers: req.headers as Record<string, string>,
                  ...(body?.length ? { body, duplex: 'half' } : {}),
                } as RequestInit & { duplex?: string });

                // Build env: .env file vars come from apiOptions.env, rest from process.env
                const env = { ...process.env, ...apiOptions.env };

                const ctx = {
                  waitUntil: (_p: Promise<unknown>) => {},
                  passThroughOnException: () => {},
                };

                const webRes: Response = await handler.fetch(webReq, env, ctx);

                res.statusCode = webRes.status;
                webRes.headers.forEach((v: string, k: string) => res.setHeader(k, v));

                if (webRes.body) {
                  const reader = webRes.body.getReader();
                  const pump = async (): Promise<void> => {
                    const { done, value } = await reader.read();
                    if (done) { res.end(); return; }
                    res.write(Buffer.from(value));
                    return pump();
                  };
                  await pump();
                } else {
                  res.end();
                }
              } catch (err) {
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
        ],
      },
    },
  };
});
