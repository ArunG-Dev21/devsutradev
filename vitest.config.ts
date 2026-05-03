import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    server: {
      deps: {
        inline: [/@shopify\/hydrogen/],
      },
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['app/**/*.{ts,tsx}'],
      exclude: [
        'app/**/*.d.ts',
        'app/**/*.generated.*',
        'app/graphql/**',
        'app/entry.client.tsx',
        'app/entry.server.tsx',
        'app/routes.ts',
      ],
    },
  },
});
