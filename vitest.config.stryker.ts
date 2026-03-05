/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

/**
 * Minimal Vite/Vitest config for Stryker mutation testing.
 * Excludes storybook/browser projects that crash in Stryker's sandbox.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@/shared': path.resolve(dirname, './src/shared'),
      '@/features': path.resolve(dirname, './src/features'),
      '@/pages': path.resolve(dirname, './src/pages'),
      '@/data': path.resolve(dirname, './src/data'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || 'dev'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts', './src/test/a11y-setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',
      '**/.storybook/**',
      '**/storybook-static/**',
      '**/*.stories.{ts,tsx}',
    ],
  },
});
