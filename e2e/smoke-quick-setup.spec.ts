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

  await expect(page.getByText(/Get Started|Aloita/i)).toBeVisible({
    timeout: TIMEOUTS.DEPLOYED_SITE,
  });
  await page.getByRole('button', { name: /Get Started|Aloita/i }).click();

  await expect(page.getByText(/Family|Perhe/i)).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await page.getByRole('button', { name: /Family|Perhe/i }).click();

  await expect(page.locator('input[type="number"]').first()).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  const adultsInput = page.locator('input[type="number"]').first();
  const adultsValue = await adultsInput.inputValue();
  expect(Number.parseInt(adultsValue, 10)).toBeGreaterThan(0);

  await page.getByRole('button', { name: /Save|Tallenna/i }).click();

  await expect(
    page.getByRole('button', {
      name: /Add Selected Items|Lisää valitut/i,
    }),
  ).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
  await page
    .getByRole('button', {
      name: /Add Selected Items|Lisää valitut/i,
    })
    .click();

  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
}

async function verifyRecommendedItemsAdded(page: Page) {
  await page.click('text=Inventory');
  await expect(page.locator('button:has-text("Add Item")')).toBeVisible();
  await expect(page.locator('button:has-text("Water")')).toBeVisible();

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
  categoryButton: string,
  quantity: string,
) {
  await ensureNoModals(page);
  await page.click(`button:has-text("${categoryButton}")`);
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);

  const items = page.locator('[class*="itemCard"], [data-testid^="item-"]');
  if ((await items.count()) > 0) {
    await items.first().click();
    await expect(
      page.locator('h2', { hasText: /Edit Item|Muokkaa/ }),
    ).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
    await page.fill('input[name="quantity"]', quantity);
    await page.click('button[type="submit"]');
    await page
      .waitForSelector('[role="dialog"]', { state: 'hidden' })
      .catch(() => {});
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
  }
}

async function editFoodItemAndDisableRecommendation(page: Page) {
  await ensureNoModals(page);
  await page.click('button:has-text("Food")');
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);

  const foodItems = page.locator('[class*="itemCard"], [data-testid^="item-"]');
  if ((await foodItems.count()) > 0) {
    await foodItems.first().click();
    await expect(
      page.locator('h2', { hasText: /Edit Item|Muokkaa/ }),
    ).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
    await page.fill('input[name="quantity"]', '2');
    await page.click('button[type="submit"]');
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
  await page.click('button:has-text("Water")');
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);

  const waterItems = page.locator(
    '[class*="itemCard"], [data-testid^="item-"]',
  );
  if ((await waterItems.count()) > 0) {
    await waterItems.first().click();
    await expect(
      page.locator('h2', { hasText: /Edit Item|Muokkaa/ }),
    ).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

    const copyButton = page.locator('button', {
      hasText: /Copy|Duplicate|Kopioi/i,
    });
    if (await copyButton.isVisible().catch(() => false)) {
      await copyButton.click();
      await expect(
        page.locator('h2', { hasText: /Add Item|Lisää/i }),
      ).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

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

      await page.click('button[type="submit"]');
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
  await page.click('text=Dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h2:has-text("Alerts")')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });

  await ensureNoModals(page);
  await page.click('text=Inventory');
  await expect(page.locator('h1:has-text("Inventory")')).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  await ensureNoModals(page);
  await page.getByRole('button', { name: 'Add Item' }).click();
  await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
  await page.getByRole('button', { name: 'Custom Item' }).click();
  await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

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
  await page.click('button[type="submit"]');
  await page
    .waitForSelector('[role="dialog"]', { state: 'hidden' })
    .catch(() => {});

  await page.click('text=Dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(/expired|vanhentunut/i)).toBeVisible({
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
  await page.click('text=Settings');
  await page.waitForLoadState('networkidle');

  const languageSelect = page.locator('select').first();
  if (await languageSelect.isVisible().catch(() => false)) {
    await languageSelect.selectOption('fi');
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
    const navText = await page.locator('nav').textContent();
    expect(navText).toBeTruthy();
  }

  const themeSelect = page.locator('#theme-select');
  if (await themeSelect.isVisible().catch(() => false)) {
    await themeSelect.selectOption('dark');
    const themeAttribute = await page.evaluate(
      () => document.documentElement.dataset.theme,
    );
    expect(themeAttribute).toBe('dark');
  }

  const advancedCheckbox = page
    .locator('label:has-text(/Calorie|Power|Water/i) input[type="checkbox"]')
    .first();
  if (await advancedCheckbox.isVisible().catch(() => false)) {
    const initialState = await advancedCheckbox.isChecked();
    await advancedCheckbox.click();
    const newState = await advancedCheckbox.isChecked();
    expect(newState).toBe(!initialState);
  }
}

async function reEnableDisabledRecommendation(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);

  const disabledSection = page.locator('text=/Disabled Recommendations/i');
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
  const presetButton = page.locator('button', {
    hasText: /Single Person|Yksin/i,
  });
  if (await presetButton.isVisible().catch(() => false)) {
    await presetButton.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM_DELAY);
    const householdAdultsInput = page.locator('input[type="number"]').first();
    const adultsValue = await householdAdultsInput.inputValue();
    expect(Number.parseInt(adultsValue, 10)).toBe(1);
  }
}

async function testDataManagementQuickSetup(page: Page) {
  const exportButton = page.locator('button', {
    hasText: /Export Data|Vie tiedot/i,
  });
  if (await exportButton.isVisible().catch(() => false)) {
    await exportButton.click();
    await page.waitForTimeout(TIMEOUTS.LONG_DELAY);
  }

  const shoppingListButton = page.locator('button', {
    hasText: /Export Shopping List|Vie ostoslista/i,
  });
  if (await shoppingListButton.isVisible().catch(() => false)) {
    const isEnabled = await shoppingListButton.isEnabled();
    if (isEnabled) {
      await shoppingListButton.click();
      await page.waitForTimeout(TIMEOUTS.LONG_DELAY);
    }
  }

  const exportRecsButton = page.locator('button', {
    hasText: /Export Recommendations/i,
  });
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
  await page.getByText(/Settings|Asetukset/i).click();
  await page.waitForLoadState('domcontentloaded', {
    timeout: TIMEOUTS.PAGE_NAVIGATION,
  });
  await expect(
    page.locator('h1').filter({ hasText: /Settings|Asetukset/i }),
  ).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_VISIBLE,
  });
  const themeSelectAfterReload = page.locator('#theme-select');
  if (await themeSelectAfterReload.isVisible().catch(() => false)) {
    const themeValue = await themeSelectAfterReload.inputValue();
    expect(themeValue).toBe('dark');
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
    .locator('h1:has-text("Dashboard")')
    .isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE })
    .catch(() => false);

  if (dashboardLoaded) {
    const quickActions = await page
      .locator('text=Quick Actions')
      .isVisible()
      .catch(() => false);
    const categoriesOverview = await page
      .locator('text=Categories Overview')
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
    await editItemInCategory(page, 'Water', '50');
    await editFoodItemAndDisableRecommendation(page);
    await editItemInCategory(page, 'Medical', '10');

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
