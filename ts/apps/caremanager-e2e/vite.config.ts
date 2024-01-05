/// <reference types="vitest" />

import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ root: '../../../' })],
  resolve: {
    alias: {
      path: 'path-browserify',
    },
  },
});
