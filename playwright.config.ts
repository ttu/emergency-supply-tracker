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
/**
 * Where the app under test lives.
 *
 * Both the readiness probe and the tests read this, so pointing
 * PLAYWRIGHT_BASE_URL at another port moves the whole run. Without that, a
 * stray listener on 5173 — an editor's port forwarding, say — is silently
 * "reused" by webServer and every test hangs waiting for an app that is not
 * there.
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

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
    baseURL: BASE_URL,
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
    url: BASE_URL,
    reuseExistingServer: true,
  },
});
