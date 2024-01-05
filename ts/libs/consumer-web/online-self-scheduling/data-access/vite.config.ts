/// <reference types="vitest" />
import { defineConfig } from 'vite';

import viteTsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import { join } from 'path';

export default defineConfig({
  cacheDir:
    '../../../../../node_modules/.vite/consumer-web-online-self-scheduling-data-access',

  plugins: [
    dts({
      entryRoot: 'src',
      tsConfigFilePath: join(__dirname, 'tsconfig.lib.json'),
      skipDiagnostics: true,
    }),

    viteTsConfigPaths({
      root: '../../../../../',
    }),
  ],

  test: {
    globals: true,
    cache: {
      dir: '../../../../../node_modules/.vitest',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/testUtils/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['lcovonly'],
    },
  },
});
