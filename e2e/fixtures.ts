import {
  test as base,
  expect,
  type Page,
  type Locator,
} from '@playwright/test';
import { createMockAppData } from '../src/shared/utils/test/factories';
import {
  STORAGE_KEY,
  buildRootStorageFromAppData,
} from '../src/shared/utils/storage/localStorage';
import type { AppData } from '../src/shared/types';

/** Set localStorage to RootStorage built from AppData (for E2E fixtures). */
export async function setAppStorage(
  page: Page,
  appData: AppData,
): Promise<void> {
  const root = buildRootStorageFromAppData(appData);
  await page.evaluate(
    ({ root, key }) => {
      localStorage.setItem(key, JSON.stringify(root));
    },
    { root, key: STORAGE_KEY },
  );
}

// Helper to wait for element count to change
export async function waitForCountChange(
  locator: Locator,
  initialCount: number,
  options: { timeout?: number; decrease?: boolean } = {},
) {
  const { timeout = 5000, decrease = true } = options;
  const expectedCount = decrease ? initialCount - 1 : initialCount + 1;
  await expect(locator).toHaveCount(expectedCount, { timeout });
}

// Default app data with onboarding completed
export const defaultAppData = createMockAppData({
  settings: {
    onboardingCompleted: true,
    language: 'en',
    theme: 'light',
    highContrast: false,
    advancedFeatures: {
      calorieTracking: false,
      powerManagement: false,
      waterTracking: false,
    },
  },
  household: {
    adults: 2,
    children: 0,
    pets: 0,
    supplyDurationDays: 3,
    useFreezer: true,
  },
  items: [],
  customCategories: [],
});

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

  // Find and click the expand button
  // Use XPath to reliably locate the button following "Recommended:" label
  // This is equivalent to the pattern: .locator('button', { hasText: /Show \d+ recommended items/ })
  // but more reliable for e2e tests
  const expandButton = page
    .locator('text=Recommended:')
    .locator('xpath=following::button[1]');
  await expect(expandButton).toBeVisible({ timeout: 5000 });
  await expandButton.click();

  // Wait for the recommended items list to be visible after expanding
  await expect(page.locator('[class*="missingItemText"]').first()).toBeVisible({
    timeout: 5000,
  });
}

// Helper to close any open modals
// This ensures tests start with a clean state
async function closeAnyOpenModals(page: Page) {
  // Check if there's a modal open
  const dialog = page.locator('[role="dialog"]').first();
  const isOpen = await dialog.isVisible().catch(() => false);

  if (isOpen) {
    // Try pressing Escape to close
    await page.keyboard.press('Escape');
    // Wait for the dialog to be hidden
    await dialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});

    // If still open, try clicking the close button
    const stillOpen = await dialog.isVisible().catch(() => false);
    if (stillOpen) {
      const closeButton = page.locator('button[aria-label*="close" i]').first();
      const closeVisible = await closeButton.isVisible().catch(() => false);
      if (closeVisible) {
        await closeButton.click({ timeout: 1000 }).catch(() => {});
        await dialog
          .waitFor({ state: 'hidden', timeout: 2000 })
          .catch(() => {});
      }
    }
  }
}

// Helper to ensure no modals are blocking interactions
// More reliable than checking visibility + timeout
export async function ensureNoModals(page: Page) {
  const dialog = page.locator('[role="dialog"]').first();
  const isOpen = await dialog.isVisible().catch(() => false);
  if (isOpen) {
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }
}

// Extended test with setup helper
export const test = base.extend<{
  setupApp: () => Promise<void>;
}>({
  setupApp: async ({ page }, use) => {
    const setup = async () => {
      await page.goto('/');
      // Close any modals that might be open
      await closeAnyOpenModals(page);
      await setAppStorage(page, defaultAppData);
      await page.reload({ waitUntil: 'domcontentloaded' });
      // Close any modals after reload
      await closeAnyOpenModals(page);
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(setup);
  },
});

// Helper to navigate to a specific section in Settings page
// Settings page uses SideMenu with sections
export async function navigateToSettingsSection(page: Page, sectionId: string) {
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 768;

  // On mobile, we need to open the hamburger menu first
  if (isMobile) {
    const hamburger = page.getByTestId('sidemenu-hamburger');
    const isHamburgerVisible = await hamburger.isVisible().catch(() => false);
    if (isHamburgerVisible) {
      await hamburger.click();
      await page.waitForTimeout(300);
    }
  }

  // Scope selector to drawer (mobile) or sidebar (desktop) to avoid strict mode violations
  const menuContainer = isMobile
    ? page.getByTestId('sidemenu-drawer')
    : page.getByTestId('sidemenu-sidebar');
  const menuItem = menuContainer.getByTestId(`sidemenu-item-${sectionId}`);
  await expect(menuItem).toBeVisible({ timeout: 5000 });
  await menuItem.click();
  await page.waitForTimeout(100);
}

// Helper to select a category in Inventory page
// Inventory page uses SideMenu for category navigation
export async function selectInventoryCategory(page: Page, categoryId: string) {
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 768;

  // On mobile, we need to open the hamburger menu first
  if (isMobile) {
    const hamburger = page.getByTestId('sidemenu-hamburger');
    const isHamburgerVisible = await hamburger.isVisible().catch(() => false);
    if (isHamburgerVisible) {
      await hamburger.click();
      await page.waitForTimeout(300);
    }
  }

  // Scope selector to drawer (mobile) or sidebar (desktop) to avoid strict mode violations
  const menuContainer = isMobile
    ? page.getByTestId('sidemenu-drawer')
    : page.getByTestId('sidemenu-sidebar');
  const menuItem = menuContainer.getByTestId(`sidemenu-item-${categoryId}`);
  await expect(menuItem).toBeVisible({ timeout: 5000 });
  await menuItem.click();
  await page.waitForTimeout(100);
}

export { expect, type Page } from '@playwright/test';
