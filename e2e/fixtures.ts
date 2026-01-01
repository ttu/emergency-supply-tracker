import { test as base, expect, type Page } from '@playwright/test';

// Default app data with onboarding completed
export const defaultAppData = {
  version: '1.0.0',
  settings: {
    onboardingCompleted: true,
    language: 'en',
    theme: 'light',
  },
  household: {
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: true,
    freezerHoldTime: 48,
  },
  items: [],
  categories: [],
  lastModified: new Date().toISOString(),
};

// Helper function to expand recommended items
// Uses consistent locator pattern to find button with text matching "Show X recommended items"
// The button text is generated from translation: "Show {{count}} recommended items"
//
// Implementation note: We use XPath to find the button that follows "Recommended:" in the DOM
// rather than text matching, as it's more reliable across different rendering scenarios.
// The button text pattern is "Show X recommended items" where X is a number.
export async function expandRecommendedItems(page: Page) {
  // Wait for recommended items section to appear
  await expect(page.locator('text=Recommended:')).toBeVisible();

  // Wait for the component to fully render
  await page.waitForTimeout(500);

  // Find and click the expand button
  // Use XPath to reliably locate the button following "Recommended:" label
  // This is equivalent to the pattern: .locator('button', { hasText: /Show \d+ recommended items/ })
  // but more reliable for e2e tests
  const expandButton = page
    .locator('text=Recommended:')
    .locator('xpath=following::button[1]');
  await expect(expandButton).toBeVisible({ timeout: 5000 });
  await expandButton.click();
}

// Extended test with setup helper
export const test = base.extend<{
  setupApp: () => Promise<void>;
}>({
  setupApp: async ({ page }, use) => {
    const setup = async () => {
      await page.goto('/');
      await page.evaluate((data) => {
        localStorage.setItem('emergencySupplyTracker', JSON.stringify(data));
      }, defaultAppData);
      await page.reload({ waitUntil: 'domcontentloaded' });
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(setup);
  },
});

export { expect };
