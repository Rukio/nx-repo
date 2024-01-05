/// <reference types="vitest" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig(() => ({
  cacheDir: '../../../node_modules/.vite/caremanager',

  build: {
    outDir: 'build',
  },

  server: {
    port: 3337,
    host: 'localhost',
    watch: {
      ignored: ['**/coverage/**', '**/cypress-coverage/**'],
    },
    fs: {
      strict: false,
    },
  },

  preview: {
    port: 3337,
    host: 'localhost',
  },

  plugins: [
    react(),
    tsconfigPaths({ root: '../../../' }),
    istanbul({ cypress: true }),
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    tsconfigPaths({
  //      root: '../../../',
  //    }),
  //  ],
  // },

  test: {
    singleThread: process.env.CI === 'true',
    cache: {
      dir: '../../../node_modules/.vitest',
    },
    environment: 'jsdom',
    globals: true,
    globalSetup: './ts/apps/caremanager/src/test/global-setup.js',
    setupFiles: ['./src/test/setup.ts', './src/test/mui-serializer.js'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      all: true,
      skipFull: true,
      reporter: ['lcov', 'json', 'text', 'text-summary', 'html'],
      exclude: [
        'src/main.tsx',
        'public/mockServiceWorker.js',
        'src/mocks/**',
        'src/__mocks__/**',
        'src/test/**',
        '**/__generated__/**',
        '**/*.d.ts',
      ],
    },
    alias: { '@auth0/auth0-react': 'src/__mocks__/@auth0/auth0-react' },
  },
}));
