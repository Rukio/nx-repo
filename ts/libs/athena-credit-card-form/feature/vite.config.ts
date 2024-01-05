/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import svgr from 'vite-plugin-svgr';
import { join } from 'path';

export default defineConfig({
  cacheDir: '../../../../node_modules/.vite/athena-credit-card-form-feature',

  plugins: [
    dts({
      entryRoot: 'src',
      tsConfigFilePath: join(__dirname, 'tsconfig.lib.json'),
      skipDiagnostics: true,
    }),
    react(),
    viteTsConfigPaths({
      root: '../../../../',
    }),
    svgr(),
  ],

  test: {
    globals: true,
    cache: {
      dir: '../../../../node_modules/.vitest',
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
