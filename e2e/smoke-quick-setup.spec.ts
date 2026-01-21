import { type Page } from '@playwright/test';
import {
  test,
  expect,
  expandRecommendedItems,
  ensureNoModals,
  selectInventoryCategory,
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

async function completeQuickSetupOnboarding(page: Page) {
  await page.goto(getBaseURL());

  // Unregister service workers and clear all app state
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.goto('about:blank');
  await page.goto(getBaseURL());
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(TIMEOUTS.PAGE_LOAD);

  await expect(page.getByTestId('onboarding-welcome')).toBeVisible({
    timeout: TIMEOUTS.DEPLOYED_SITE,
  });
  await page.getByTestId('get-started-button').click();

  await expect(page.getByTestId('onboarding-preset-selector')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await page.getByTestId('preset-family').click();

  await expect(page.getByTestId('onboarding-household-form')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  const adultsInput = page.locator('input[type="number"]').first();
  const adultsValue = await adultsInput.inputValue();
  expect(Number.parseInt(adultsValue, 10)).toBeGreaterThan(0);

  await page.getByTestId('household-save-button').click();

  // Kit Selection step
  await expect(
    page.getByTestId('onboarding-recommendation-kit-step'),
  ).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  // Explicitly select the default kit to ensure it's selected
  const defaultKitCard = page.getByTestId('kit-card-72tuntia-standard');
  await expect(defaultKitCard).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await defaultKitCard.click();
  // Wait a moment for selection to register
  await page.waitForTimeout(TIMEOUTS.SHORT_DELAY);
  // Now continue button should be enabled
  const continueButton = page.getByTestId('kit-step-continue-button');
  await expect(continueButton).toBeEnabled({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await continueButton.click();

  await expect(page.getByTestId('onboarding-quick-setup')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await expect(page.getByTestId('add-items-button')).toBeVisible();

  // Select items first (button is disabled when no items selected)
  // Show details to access item checkboxes
  const showDetailsButton = page.getByRole('button', {
    name: /Show item details|Näytä tuotetiedot/i,
  });
  await showDetailsButton.click({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

  // Wait for checkboxes to appear and select first item
  const firstCheckbox = page
    .locator('input[type="checkbox"][id^="item-"]')
    .first();
  await firstCheckbox.waitFor({
    state: 'visible',
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await firstCheckbox.click();

  // Now click Add Selected Items (button should be enabled)
  await page.getByTestId('add-items-button').click();

  await expect(page.getByTestId('page-dashboard')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
}

async function verifyRecommendedItemsAdded(page: Page) {
  await page.getByTestId('nav-inventory').click();
  await expect(page.getByTestId('add-item-button')).toBeVisible();
  await expect(page.getByTestId('sidemenu-item-water-beverages')).toBeVisible();

  const itemsAdded = await page.evaluate((key) => {
    const data = localStorage.getItem(key);
    if (!data) return false;
    try {
      const appData = JSON.parse(data);
      return appData.items && appData.items.length > 0;
    } catch {
      return false;
    }
  }, STORAGE_KEY);
  expect(itemsAdded).toBe(true);
}

async function editItemInCategory(
  page: Page,
  categoryId: string,
  quantity: string,
) {
  await ensureNoModals(page);
  await selectInventoryCategory(page, categoryId);
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);

  const items = page.locator(
    '[class*="itemCard"], [data-testid^="item-card-"]',
  );
  if ((await items.count()) > 0) {
    await items.first().click();
    await expect(page.getByTestId('item-form')).toBeVisible({
      timeout: TIMEOUTS.ELEMENT_VISIBLE,
    });
    await page.fill('input[name="quantity"]', quantity);
    await page.getByTestId('save-item-button').click();
    await page
      .waitForSelector('[role="dialog"]', { state: 'hidden' })
      .catch(() => {});
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
  }
}

async function editFoodItemAndDisableRecommendation(page: Page) {
  await ensureNoModals(page);
  await selectInventoryCategory(page, 'food');
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);

  const foodItems = page.locator(
    '[class*="itemCard"], [data-testid^="item-card-"]',
  );
  if ((await foodItems.count()) > 0) {
    await foodItems.first().click();
    await expect(page.getByTestId('item-form')).toBeVisible({
      timeout: TIMEOUTS.ELEMENT_VISIBLE,
    });
    await page.fill('input[name="quantity"]', '2');
    await page.getByTestId('save-item-button').click();
    await page
      .waitForSelector('[role="dialog"]', { state: 'hidden' })
      .catch(() => {});
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);

    await expandRecommendedItems(page);
    const disableButton = page.locator('button:has-text("×")').first();
    if (await disableButton.isVisible().catch(() => false)) {
      await disableButton.click();
      await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
    }
  }
}

async function testCopyItem(page: Page) {
  await ensureNoModals(page);
  await selectInventoryCategory(page, 'water-beverages');
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);

  const waterItems = page.locator(
    '[class*="itemCard"], [data-testid^="item-card-"]',
  );
  if ((await waterItems.count()) > 0) {
    await waterItems.first().click();
    await expect(page.getByTestId('item-form')).toBeVisible({
      timeout: TIMEOUTS.ELEMENT_VISIBLE,
    });

    const copyButton = page.getByTestId('copy-item-button');
    if (await copyButton.isVisible().catch(() => false)) {
      await copyButton.click();
      await expect(page.getByTestId('item-form')).toBeVisible({
        timeout: TIMEOUTS.ELEMENT_VISIBLE,
      });

      await page.fill('input[name="quantity"]', '25');
      const expiresCheckbox = page.locator('input[type="checkbox"]');
      if (await expiresCheckbox.isChecked()) {
        await expiresCheckbox.uncheck();
      }
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureYyyy = futureDate.getFullYear();
      const futureMm = String(futureDate.getMonth() + 1).padStart(2, '0');
      const futureDd = String(futureDate.getDate()).padStart(2, '0');
      const futureDateString = `${futureYyyy}-${futureMm}-${futureDd}`;
      await page.fill('input[type="date"]', futureDateString);

      await page.getByTestId('save-item-button').click();
      await page
        .waitForSelector('[role="dialog"]', { state: 'hidden' })
        .catch(() => {});
      await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
    } else {
      await page.keyboard.press('Escape');
    }
  }
}

async function testDashboardAlertsQuickSetup(page: Page) {
  await page.getByTestId('nav-dashboard').click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('alerts-section')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });

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

async function testSettingsFeaturesQuickSetup(page: Page) {
  await page.getByTestId('nav-settings').click();
  await page.waitForLoadState('networkidle');

  // Change language first
  const languageSelect = page.locator('select').first();
  if (await languageSelect.isVisible().catch(() => false)) {
    await languageSelect.selectOption('fi');
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
    const navText = await page.locator('nav').textContent();
    expect(navText).toBeTruthy();
  }

  // Toggle advanced checkbox
  const advancedCheckbox = page
    .locator('label:has-text(/Calorie|Power|Water/i) input[type="checkbox"]')
    .first();
  if (await advancedCheckbox.isVisible().catch(() => false)) {
    const initialState = await advancedCheckbox.isChecked();
    await advancedCheckbox.click();
    const newState = await advancedCheckbox.isChecked();
    expect(newState).toBe(!initialState);
  }

  // Change theme LAST to avoid race conditions with other localStorage saves
  // Theme select MUST be visible - this is a required test step
  const themeSelect = page.locator('#theme-select');
  await expect(themeSelect).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
  await themeSelect.selectOption('dark');
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
  const themeAttribute = await page.evaluate(
    () => document.documentElement.dataset.theme,
  );
  expect(themeAttribute).toBe('dark');
  // Wait for settings to be saved to localStorage
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
  // Wait for localStorage to stabilize
  await page.waitForTimeout(TIMEOUTS.LONG_DELAY);
}

async function reEnableDisabledRecommendation(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);

  const disabledSection = page.getByTestId('section-disabled-recommendations');
  if (await disabledSection.isVisible().catch(() => false)) {
    const enableButton = page
      .locator('button', { hasText: /^Enable$|^Ota käyttöön$/i })
      .first();

    if (await enableButton.isVisible().catch(() => false)) {
      await enableButton.click();
      await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
      await expect(enableButton).not.toBeVisible({
        timeout: TIMEOUTS.ELEMENT_VISIBLE,
      });
    }
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
}

async function changeHouseholdToSinglePerson(page: Page) {
  const presetButton = page.getByTestId('preset-single');
  if (await presetButton.isVisible().catch(() => false)) {
    await presetButton.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
    const householdAdultsInput = page.locator('input[type="number"]').first();
    const adultsValue = await householdAdultsInput.inputValue();
    expect(Number.parseInt(adultsValue, 10)).toBe(1);
  }
}

async function testDataManagementQuickSetup(page: Page) {
  const exportButton = page.getByTestId('export-data-button');
  if (await exportButton.isVisible().catch(() => false)) {
    await exportButton.click();
    // Wait for export selection modal and click export button
    const exportModalButton = page.locator('button', {
      hasText: /^Export$|^Vie$/i,
    });
    if (
      await exportModalButton.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await exportModalButton.click();
    }
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
  }

  const shoppingListButton = page.getByTestId('export-shopping-list-button');
  if (await shoppingListButton.isVisible().catch(() => false)) {
    const isEnabled = await shoppingListButton.isEnabled();
    if (isEnabled) {
      await shoppingListButton.click();
      await page.waitForTimeout(TIMEOUTS.LONG_DELAY);
    }
  }

  const exportRecsButton = page.getByTestId('export-recommendations-button');
  if (await exportRecsButton.isVisible().catch(() => false)) {
    await exportRecsButton.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
  }
}

async function testPersistenceQuickSetup(page: Page) {
  await page.reload({
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.ELEMENT_VISIBLE * 2,
  });
  await page.waitForLoadState('domcontentloaded', {
    timeout: TIMEOUTS.ELEMENT_VISIBLE * 2,
  });

  const dataPersisted = await page.evaluate((key) => {
    const data = localStorage.getItem(key);
    if (!data) return { persisted: false, items: [] };
    try {
      const appData = JSON.parse(data);
      return {
        persisted: true,
        items: appData.items || [],
        hasItems: appData.items && appData.items.length > 0,
      };
    } catch {
      return { persisted: false, items: [] };
    }
  }, STORAGE_KEY);

  expect(dataPersisted.persisted).toBe(true);
  expect(dataPersisted.items.length).toBeGreaterThan(0);
  expect(dataPersisted.hasItems).toBe(true);

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
    // Wait for the select to have the persisted value (lazy loading may cause delay)
    await expect(themeSelectAfterReload).toHaveValue('dark', {
      timeout: TIMEOUTS.ELEMENT_VISIBLE,
    });
  }
}

async function verifyFinalDashboardQuickSetup(page: Page) {
  await ensureNoModals(page);
  await page.goto(getBaseURL(), {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.ELEMENT_VISIBLE * 2,
  });
  await page.waitForLoadState('domcontentloaded', {
    timeout: TIMEOUTS.ELEMENT_VISIBLE * 2,
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
 * Comprehensive smoke test that verifies the QUICK SETUP workflow
 * from first-time onboarding (completing Quick Setup) through complete application usage.
 *
 * This test covers the "Guided/Recommended" path where users add all recommended items
 * during onboarding and then edit them to add quantities.
 *
 * This is the most common new user experience and tests:
 * - Bulk item creation from recommendations
 * - Editing existing items (most common workflow)
 * - Recommended quantity calculations
 *
 * This test is designed to run against PR deployments to verify
 * the entire application works end-to-end.
 */
test.describe('Smoke Test - Quick Setup Flow', () => {
  test('should test quick setup workflow: add recommended items → edit quantities → full features', async ({
    page,
  }) => {
    test.setTimeout(TIMEOUTS.TEST_TIMEOUT);

    // PHASE 1: ONBOARDING WITH QUICK SETUP
    await completeQuickSetupOnboarding(page);

    // PHASE 2: VERIFY RECOMMENDED ITEMS ADDED
    await verifyRecommendedItemsAdded(page);

    // PHASE 3: EDIT MULTIPLE RECOMMENDED ITEMS
    await editItemInCategory(page, 'water-beverages', '50');
    await editFoodItemAndDisableRecommendation(page);
    await editItemInCategory(page, 'medical-health', '10');

    // PHASE 3B: TEST COPY/DUPLICATE ITEM
    await testCopyItem(page);

    // PHASE 4: DASHBOARD ALERTS
    await testDashboardAlertsQuickSetup(page);

    // PHASE 5: SETTINGS - ALL FEATURES
    await testSettingsFeaturesQuickSetup(page);

    // PHASE 5B: RE-ENABLE DISABLED RECOMMENDATION
    await reEnableDisabledRecommendation(page);
    await changeHouseholdToSinglePerson(page);

    // PHASE 6: DATA MANAGEMENT
    await testDataManagementQuickSetup(page);

    // PHASE 7: NAVIGATION & PERSISTENCE
    await testPersistenceQuickSetup(page);

    // PHASE 8: FINAL VERIFICATION
    await verifyFinalDashboardQuickSetup(page);
  });
});
