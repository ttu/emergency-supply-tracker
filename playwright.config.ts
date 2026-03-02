import { defineConfig, devices } from '@playwright/test';

/**
 * Determine testMatch/testIgnore based on which test suite is being run.
 * Each special test suite (a11y, visual) uses its own env var.
 * Default run excludes both via testIgnore.
 */
function getTestFilterConfig() {
  if (process.env.RUN_A11Y_TESTS) {
    return { testMatch: ['**/a11y.spec.ts'] };
  }
  if (process.env.RUN_VISUAL_TESTS) {
    return { testMatch: ['**/visual-regression.spec.ts'] };
  }
  return {
    testMatch: ['**/*.spec.ts'],
    testIgnore: ['**/a11y.spec.ts', '**/visual-regression.spec.ts'],
  };
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000, // 60 seconds for comprehensive smoke test
  ...getTestFilterConfig(),
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 50,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
