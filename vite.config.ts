import { defineConfig, defaultClientConditions, type Plugin } from 'vite';
import { hydrogen } from '@shopify/hydrogen/vite';
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

export default defineConfig({
  plugins: [
    tailwindcss(),
    hydrogen(),
    oxygenNode(),
    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    // Allow a strict Content-Security-Policy
    // withtout inlining assets as base64:
    assetsInlineLimit: 0,
  },
  ssr: {
    noExternal: ['xss'],
    optimizeDeps: {
      /**
       * Include dependencies here if they throw CJS<>ESM errors.
       * For example, for the following error:
       *
       * > ReferenceError: module is not defined
       * >   at /Users/.../node_modules/example-dep/index.js:1:1
       *
       * Include 'example-dep' in the array below.
       * @see https://vitejs.dev/config/dep-optimization-options
       */
      include: ['set-cookie-parser', 'cookie', 'react-router', 'xss'],
    },
  },
  server: {
    allowedHosts: ['.tryhydrogen.dev', '.ngrok-free.dev'],
  },
});
