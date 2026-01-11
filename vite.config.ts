/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@storybook/addon-vitest',
      '@storybook/react-vite',
      'storybook/internal/channels',
    ],
  },
  ssr: {
    noExternal: ['@storybook/addon-vitest'],
  },
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
  base:
    process.env.NODE_ENV === 'production'
      ? process.env.VITE_BASE_PATH || '/emergency-supply-tracker/'
      : '/',
  test: {
    globals: true,
    environment: 'jsdom',
    globalSetup: './src/test/globalSetup.ts',
    setupFiles: ['./src/test/setup.ts', './src/test/a11y-setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.tsx',
        '!src/main.tsx',
        '!src/test/**',
        '!src/i18n/config.ts',
        '!src/serviceWorker.ts',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    projects: [
      // Main test project - runs all unit/integration tests
      {
        extends: true,
        test: {
          name: 'unit',
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
      },
      // Storybook test project
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookUrl: 'http://localhost:6006',
          }),
        ],
        test: {
          name: 'storybook',
          exclude: [
            '**/node_modules/**',
            '**/e2e/**',
            '**/.storybook/**',
            '**/storybook-static/**',
            '**/*.{test,spec}.{ts,tsx}',
          ],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
