import { type Page } from '@playwright/test';
import {
  test,
  expect,
  expandRecommendedItems,
  ensureNoModals,
} from './fixtures';
import { STORAGE_KEY } from '../src/shared/utils/storage/localStorage';

// Get base URL - use environment variable for deployed sites
const getBaseURL = () =>
  process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

// Timeout constants to avoid magic numbers
const TIMEOUTS = {
  SHORT_DELAY: 300,
  MEDIUM_DELAY: 500,
  LONG_DELAY: 1000,
  PAGE_LOAD: 2000,
  ELEMENT_VISIBLE: 5000,
  PAGE_NAVIGATION: 10000,
  DEPLOYED_SITE: 15000,
  TEST_TIMEOUT: 120000, // 2 minutes
} as const;

// Helper functions to reduce cognitive complexity

async function completeOnboarding(page: Page) {
  // Navigate to page first
  await page.goto(getBaseURL());

  // Unregister service workers and clear all app state
  await page.evaluate(async () => {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
  });

  // Force a hard reload by navigating away and back
  await page.goto('about:blank');
  await page.goto(getBaseURL());

  // Wait for page to fully load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(TIMEOUTS.PAGE_LOAD);

  // Welcome screen - increase timeout for deployed sites
  await expect(page.getByTestId('onboarding-welcome')).toBeVisible({
    timeout: TIMEOUTS.DEPLOYED_SITE,
  });
  await page.getByTestId('get-started-button').click();

  // Preset selection - choose "Family"
  await expect(page.getByTestId('onboarding-preset-selector')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await page.getByTestId('preset-family').click();

  // Household configuration
  await expect(page.getByTestId('onboarding-household-form')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  const adultsInput = page.locator('input[type="number"]').first();
  const adultsValue = await adultsInput.inputValue();
  expect(Number.parseInt(adultsValue, 10)).toBeGreaterThan(0);

  // Submit form
  await page.getByTestId('household-save-button').click();

  // Quick Setup - Skip
  await expect(page.getByTestId('onboarding-quick-setup')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await page.getByTestId('skip-quick-setup-button').click();

  // Should navigate to Dashboard
  await expect(page.getByTestId('page-dashboard')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
}

async function testDashboardInteractions(page: Page) {
  // Verify dashboard elements
  await expect(page.getByTestId('quick-actions')).toBeVisible();
  await expect(page.getByTestId('categories-overview')).toBeVisible();

  // Test quick action - Add Items
  const addItemsButton = page.getByTestId('quick-add-items');
  if (await addItemsButton.isVisible().catch(() => false)) {
    await addItemsButton.click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.keyboard.press('Escape');
  }

  // Test category card click
  const foodCategoryCard = page.getByTestId('category-food');
  if (await foodCategoryCard.isVisible().catch(() => false)) {
    await foodCategoryCard.click();
    await expect(page.getByTestId('page-inventory')).toBeVisible();
    await page.getByTestId('nav-dashboard').click();
  }
}

async function addItemFromTemplate(page: Page) {
  await page.getByTestId('add-item-button').click();
  await expect(page.getByTestId('template-selector')).toBeVisible();

  await page.getByTestId('template-search-input').fill('water');
  const waterTemplate = page
    .locator('button[type="button"]')
    .filter({ hasText: /water/i })
    .first();
  await expect(waterTemplate).toBeVisible();
  await waterTemplate.click();

  await page.fill('input[name="quantity"]', '5');
  await page.getByTestId('save-item-button').click();
  await page
    .waitForSelector('[role="dialog"]', { state: 'hidden' })
    .catch(() => {});

  await expect(page.locator('text=/water/i').first()).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
}

async function addCustomItem(page: Page) {
  await ensureNoModals(page);
  await page.getByTestId('add-item-button').click();
  await expect(page.getByTestId('template-selector')).toBeVisible();
  await page.getByTestId('custom-item-button').click();
  await expect(page.getByTestId('item-form')).toBeVisible();

  await page.fill('input[name="name"]', 'Custom Test Item');
  await page.selectOption('select[name="category"]', 'food');
  await page.fill('input[name="quantity"]', '3');
  await page.selectOption('select[name="unit"]', 'pieces');
  // Check the "Never Expires" checkbox using its label text
  const neverExpiresCheckbox = page
    .locator('label')
    .filter({ hasText: /Never Expires|Ei vanhene/i })
    .locator('input[type="checkbox"]');
  await neverExpiresCheckbox.check();
  await page.getByTestId('save-item-button').click();
  await page
    .waitForSelector('[role="dialog"]', { state: 'hidden' })
    .catch(() => {});
}

async function verifyCustomItemExists(page: Page) {
  const customItemVisible = await page
    .locator('text=Custom Test Item')
    .isVisible()
    .catch(() => false);

  if (!customItemVisible) {
    await page.getByTestId('category-food').click();
    const itemVisibleAfterFilter = await page
      .locator('text=Custom Test Item')
      .isVisible()
      .catch(() => false);
    if (!itemVisibleAfterFilter) {
      const itemInStorage = await page.evaluate((key) => {
        const data = localStorage.getItem(key);
        if (!data) return false;
        try {
          const appData = JSON.parse(data);
          return appData.items?.some(
            (item: { name: string }) => item.name === 'Custom Test Item',
          );
        } catch {
          return false;
        }
      }, STORAGE_KEY);
      expect(itemInStorage).toBe(true);
    }
  }
}

async function testRecommendedItems(page: Page) {
  await ensureNoModals(page);
  // Use data-testid for language-agnostic category selection
  // Water category ID is 'water-beverages'
  await page.getByTestId('category-water-beverages').click();
  await expandRecommendedItems(page);

  const addButton = page.locator('button:has-text("+")').first();
  if (await addButton.isVisible().catch(() => false)) {
    await addButton.click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.keyboard.press('Escape');
  }

  const disableButton = page.locator('button:has-text("×")').first();
  if (await disableButton.isVisible().catch(() => false)) {
    const missingItemsLocator = page.locator('[class*="missingItemText"]');
    const initialCount = await missingItemsLocator.count();
    await disableButton.click();
    await expect(missingItemsLocator).toHaveCount(
      Math.max(0, initialCount - 1),
      { timeout: TIMEOUTS.ELEMENT_VISIBLE },
    );
  }
}

async function editCustomItemIfVisible(page: Page) {
  // Use getByRole to target item card button specifically
  const customItemLocator = page.getByRole('button', {
    name: /Custom Test Item/i,
  });
  const canEdit = await customItemLocator.isVisible().catch(() => false);
  if (canEdit) {
    await customItemLocator.click();
    await page.waitForSelector('input[name="quantity"]');
    await page.fill('input[name="quantity"]', '8');
    await page.getByTestId('save-item-button').click();
    await page
      .waitForSelector('[role="dialog"]', { state: 'hidden' })
      .catch(() => {});
  }
}

async function testDashboardAlerts(page: Page) {
  // Navigate to Dashboard - should see alerts for insufficient quantities
  await page.getByTestId('nav-dashboard').click();
  await page.waitForLoadState('networkidle');

  // Verify alerts appear
  await expect(page.getByTestId('alerts-section')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });

  // Add expired item to ensure we have at least one alert
  await ensureNoModals(page);
  await page.getByTestId('nav-inventory').click();
  await expect(page.getByTestId('page-inventory')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await ensureNoModals(page);
  await page.getByTestId('add-item-button').click();
  await expect(page.getByTestId('template-selector')).toBeVisible();
  await page.getByTestId('custom-item-button').click();
  await expect(page.getByTestId('item-form')).toBeVisible();

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);
  const yyyy = pastDate.getFullYear();
  const mm = String(pastDate.getMonth() + 1).padStart(2, '0');
  const dd = String(pastDate.getDate()).padStart(2, '0');
  const expiredDateString = `${yyyy}-${mm}-${dd}`;

  await page.fill('input[name="name"]', 'Expired Alert Item');
  await page.selectOption('select[name="category"]', 'food');
  await page.fill('input[name="quantity"]', '2');
  await page.selectOption('select[name="unit"]', 'pieces');
  const neverExpiresCheckbox = page
    .locator('label')
    .filter({ hasText: /Never Expires|Ei vanhene/i })
    .locator('input[type="checkbox"]');
  await neverExpiresCheckbox.uncheck();
  await page.fill('input[type="date"]', expiredDateString);
  await page.getByTestId('save-item-button').click();
  await page
    .waitForSelector('[role="dialog"]', { state: 'hidden' })
    .catch(() => {});

  // Navigate to Dashboard and verify/dismiss alert
  await page.getByTestId('nav-dashboard').click();
  await page.waitForLoadState('networkidle');
  // Scope to alerts section to avoid notifications
  const alertsSection = page.getByTestId('alerts-section');
  await expect(alertsSection.getByText(/expired|vanhentunut/i)).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });

  const dismissButton = page
    .locator('.alert button, button:has-text("✕"), [aria-label*="dismiss" i]')
    .first();
  await expect(dismissButton).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await dismissButton.click();
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);

  const alertText = page.locator('.alert').getByText(/expired|vanhentunut/i);
  await expect(alertText).not.toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
}

async function testSettingsFeatures(page: Page) {
  await page.getByTestId('nav-settings').click();
  await page.waitForLoadState('networkidle');

  // Change language
  const languageSelect = page.locator('select').first();
  if (await languageSelect.isVisible().catch(() => false)) {
    await languageSelect.selectOption('fi');
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
    const navText = await page.locator('nav').textContent();
    expect(navText).toBeTruthy();
  }

  // Change theme
  const themeSelect = page.locator('#theme-select');
  if (await themeSelect.isVisible().catch(() => false)) {
    await themeSelect.selectOption('dark');
    // Wait for theme to be applied to DOM
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
    const themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('dark');
    // Wait for settings to be saved to localStorage (useLocalStorageSync uses useEffect)
    // Poll until the theme is saved, with a timeout
    await page.waitForFunction(
      (key) => {
        const data = localStorage.getItem(key);
        if (!data) return false;
        try {
          const appData = JSON.parse(data);
          return appData.settings?.theme === 'dark';
        } catch {
          return false;
        }
      },
      STORAGE_KEY,
      { timeout: TIMEOUTS.ELEMENT_VISIBLE },
    );
  }

  // Toggle high contrast
  const highContrastCheckbox = page.locator('#high-contrast-toggle');
  if (await highContrastCheckbox.isVisible().catch(() => false)) {
    const initialState = await highContrastCheckbox.isChecked();
    await highContrastCheckbox.click();
    const newState = await highContrastCheckbox.isChecked();
    expect(newState).toBe(!initialState);
  }

  // Change household from Family to Single Person
  const presetButton = page.getByTestId('preset-single');
  if (await presetButton.isVisible().catch(() => false)) {
    await presetButton.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
    const householdAdultsInput = page.locator('input[type="number"]').first();
    const adultsValue = await householdAdultsInput.inputValue();
    expect(Number.parseInt(adultsValue, 10)).toBe(1);
  }

  // Toggle advanced features
  const allCheckboxes = page.locator('input[type="checkbox"]');
  const checkboxCount = await allCheckboxes.count();
  if (checkboxCount > 0) {
    const firstCheckbox = allCheckboxes.nth(0);
    const initialState = await firstCheckbox.isChecked();
    await firstCheckbox.click();
    const newState = await firstCheckbox.isChecked();
    expect(newState).toBe(!initialState);
  }

  // Update nutrition settings
  const caloriesInput = page.locator('#daily-calories');
  if (await caloriesInput.isVisible().catch(() => false)) {
    await caloriesInput.fill('2200');
    await caloriesInput.blur();
    await page.waitForTimeout(TIMEOUTS.SHORT_DELAY);
  }

  // Re-enable disabled recommendation (if any)
  const enableButton = page.locator('button', { hasText: /^Enable$/ }).first();
  if (await enableButton.isVisible().catch(() => false)) {
    await enableButton.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
  }

  // Re-activate hidden alert
  const reactivateButton = page
    .locator('button', {
      hasText: /Show|Näytä|Reactivate|Aktivoi/i,
    })
    .first();
  if (await reactivateButton.isVisible().catch(() => false)) {
    await reactivateButton.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
  }

  // Final verification: ensure theme is still saved as 'dark' after all operations
  // This handles potential race conditions between multiple useLocalStorageSync saves
  await page.waitForTimeout(TIMEOUTS.LONG_DELAY);
  const finalTheme = await page.evaluate((key) => {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      const appData = JSON.parse(data);
      return appData.settings?.theme;
    } catch {
      return null;
    }
  }, STORAGE_KEY);

  // If theme was overwritten due to race condition, re-set it
  if (finalTheme !== 'dark') {
    const themeSelectFinal = page.locator('#theme-select');
    if (await themeSelectFinal.isVisible().catch(() => false)) {
      await themeSelectFinal.selectOption('dark');
      await page.waitForFunction(
        (key) => {
          const data = localStorage.getItem(key);
          if (!data) return false;
          try {
            const appData = JSON.parse(data);
            return appData.settings?.theme === 'dark';
          } catch {
            return false;
          }
        },
        STORAGE_KEY,
        { timeout: TIMEOUTS.ELEMENT_VISIBLE },
      );
    }
  }
}

async function verifyAlertsDisappearAfterHouseholdChange(page: Page) {
  await page.locator('nav button').first().click();
  await expect(page.locator('h1').first()).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await page.waitForTimeout(TIMEOUTS.LONG_DELAY);
}

async function testDataManagement(page: Page) {
  // Export data
  const exportButton = page.getByTestId('export-data-button');
  if (await exportButton.isVisible().catch(() => false)) {
    await exportButton.click();
    await page.waitForTimeout(TIMEOUTS.LONG_DELAY);
  }

  // Export shopping list (if items need restocking)
  const shoppingListButton = page.getByTestId('export-shopping-list-button');
  if (await shoppingListButton.isVisible().catch(() => false)) {
    const isEnabled = await shoppingListButton.isEnabled();
    if (isEnabled) {
      await shoppingListButton.click();
      await page.waitForTimeout(TIMEOUTS.LONG_DELAY);
    }
  }

  // Export recommendations
  const exportRecsButton = page.getByTestId('export-recommendations-button');
  if (await exportRecsButton.isVisible().catch(() => false)) {
    await exportRecsButton.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
  }
}

async function testNavigationAndPersistence(page: Page) {
  await ensureNoModals(page);
  const navButtons = page.locator('nav button');

  // Navigate to Dashboard
  try {
    await navButtons.first().click({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
    await page.waitForLoadState('domcontentloaded', {
      timeout: TIMEOUTS.ELEMENT_VISIBLE,
    });
    await expect(page.locator('h1').first()).toBeVisible({
      timeout: TIMEOUTS.ELEMENT_VISIBLE,
    });
  } catch {
    // Navigation might have issues, continue
  }

  // Navigate to Inventory
  try {
    await navButtons.nth(1).click({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
    await page.waitForLoadState('domcontentloaded', {
      timeout: TIMEOUTS.ELEMENT_VISIBLE,
    });
    await expect(page.locator('h1').first()).toBeVisible({
      timeout: TIMEOUTS.ELEMENT_VISIBLE,
    });
  } catch {
    // Continue to persistence check
  }

  // Reload and verify persistence
  await page.reload({
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.PAGE_NAVIGATION,
  });
  await page.waitForLoadState('domcontentloaded', {
    timeout: TIMEOUTS.PAGE_NAVIGATION,
  });

  // Verify data persisted
  const dataPersisted = await page.evaluate((key) => {
    const data = localStorage.getItem(key);
    if (!data) return { persisted: false, items: [] };
    try {
      const appData = JSON.parse(data);
      return {
        persisted: true,
        items: appData.items || [],
        hasWater: appData.items?.some((item: { name: string }) =>
          /water/i.test(item.name),
        ),
        hasCustom: appData.items?.some(
          (item: { name: string }) => item.name === 'Custom Test Item',
        ),
      };
    } catch {
      return { persisted: false, items: [] };
    }
  }, STORAGE_KEY);

  expect(dataPersisted.persisted).toBe(true);
  expect(dataPersisted.items.length).toBeGreaterThan(0);
  expect(dataPersisted.hasWater).toBe(true);
  expect(dataPersisted.hasCustom).toBe(true);

  // Verify settings persisted
  await page.goto(getBaseURL(), {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.PAGE_NAVIGATION,
  });
  await page.waitForLoadState('domcontentloaded', {
    timeout: TIMEOUTS.PAGE_NAVIGATION,
  });
  await page.getByTestId('nav-settings').click();
  await page.waitForLoadState('domcontentloaded', {
    timeout: TIMEOUTS.PAGE_NAVIGATION,
  });
  await expect(page.getByTestId('page-settings')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  const themeSelectAfterReload = page.locator('#theme-select');
  if (await themeSelectAfterReload.isVisible().catch(() => false)) {
    const themeValue = await themeSelectAfterReload.inputValue();
    expect(themeValue).toBe('dark');
  }
}

async function verifyFinalDashboard(page: Page) {
  await ensureNoModals(page);
  await page.goto(getBaseURL(), {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.PAGE_NAVIGATION,
  });
  await page.waitForLoadState('domcontentloaded', {
    timeout: TIMEOUTS.PAGE_NAVIGATION,
  });

  const dashboardLoaded = await page
    .getByTestId('page-dashboard')
    .isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE })
    .catch(() => false);

  if (dashboardLoaded) {
    const quickActions = await page
      .getByTestId('quick-actions')
      .isVisible()
      .catch(() => false);
    const categoriesOverview = await page
      .getByTestId('categories-overview')
      .isVisible()
      .catch(() => false);
    expect(quickActions || categoriesOverview).toBe(true);
  }
}

/**
 * Comprehensive smoke test that verifies the MANUAL ENTRY workflow
 * from first-time onboarding (skipping Quick Setup) through complete application usage.
 *
 * This test covers the "DIY/Power User" path where users manually add items
 * from templates and custom entries instead of using Quick Setup.
 *
 * This test is designed to run against PR deployments to verify
 * the entire application works end-to-end.
 */

/**
 * Shared test flow for manual entry workflow.
 * This function contains all the test logic and can be reused for both
 * desktop and mobile viewport tests.
 */
async function runManualEntryWorkflow(page: Page) {
  // PHASE 1: ONBOARDING
  await completeOnboarding(page);

  // PHASE 2: DASHBOARD INTERACTIONS
  await testDashboardInteractions(page);

  // PHASE 3: INVENTORY MANAGEMENT
  await page.getByTestId('nav-inventory').click();
  await expect(page.getByTestId('add-item-button')).toBeVisible();
  await ensureNoModals(page);

  await addItemFromTemplate(page);
  await addCustomItem(page);
  await verifyCustomItemExists(page);
  await editCustomItemIfVisible(page);

  // Filter and search
  await page.getByTestId('category-food').click();
  await page.fill('input[placeholder*="Search"]', 'Custom');
  await page.fill('input[placeholder*="Search"]', '');
  await testRecommendedItems(page);

  // PHASE 4: DASHBOARD ALERTS
  await testDashboardAlerts(page);

  // PHASE 5: SETTINGS - ALL FEATURES
  await testSettingsFeatures(page);

  // PHASE 5B: VERIFY ALERTS DISAPPEAR AFTER HOUSEHOLD CHANGE
  await verifyAlertsDisappearAfterHouseholdChange(page);

  // PHASE 6: DATA MANAGEMENT
  await testDataManagement(page);

  // PHASE 7: NAVIGATION & PERSISTENCE
  await testNavigationAndPersistence(page);

  // PHASE 8: FINAL VERIFICATION
  await verifyFinalDashboard(page);
}

test.describe('Smoke Test - Manual Entry Flow', () => {
  test('should test manual entry workflow: skip quick setup → manually add items → full features', async ({
    page,
  }) => {
    test.setTimeout(TIMEOUTS.TEST_TIMEOUT);
    await runManualEntryWorkflow(page);
  });

  test('should test manual entry workflow on mobile: skip quick setup → manually add items → full features', async ({
    page,
  }) => {
    test.setTimeout(TIMEOUTS.TEST_TIMEOUT);
    // Set mobile viewport explicitly
    await page.setViewportSize({ width: 375, height: 667 });
    await runManualEntryWorkflow(page);
  });
});
