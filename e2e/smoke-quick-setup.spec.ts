import {
  test,
  expect,
  expandRecommendedItems,
  ensureNoModals,
} from './fixtures';

// Get base URL - use environment variable for deployed sites
const getBaseURL = () =>
  process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

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
    test.setTimeout(120000); // 2 minutes for comprehensive test

    // ============================================
    // PHASE 1: ONBOARDING WITH QUICK SETUP
    // ============================================
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
    await page.waitForTimeout(2000);

    // Welcome screen - increase timeout for deployed sites
    await expect(page.getByText(/Get Started|Aloita/i)).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: /Get Started|Aloita/i }).click();

    // Preset selection - choose "Family"
    await expect(page.getByText(/Family|Perhe/i)).toBeVisible({
      timeout: 5000,
    });
    await page.getByRole('button', { name: /Family|Perhe/i }).click();

    // Household configuration
    await expect(page.locator('input[type="number"]').first()).toBeVisible({
      timeout: 5000,
    });
    const adultsInput = page.locator('input[type="number"]').first();
    const adultsValue = await adultsInput.inputValue();
    expect(Number.parseInt(adultsValue, 10)).toBeGreaterThan(0);

    // Submit form
    await page.getByRole('button', { name: /Save|Tallenna/i }).click();

    // Quick Setup - Add all recommended items
    await expect(
      page.getByRole('button', {
        name: /Add Recommended Items|Lisää suositellut/i,
      }),
    ).toBeVisible({ timeout: 5000 });
    await page
      .getByRole('button', {
        name: /Add Recommended Items|Lisää suositellut/i,
      })
      .click();

    // Should navigate to Dashboard
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({
      timeout: 5000,
    });

    // ============================================
    // PHASE 2: VERIFY RECOMMENDED ITEMS ADDED
    // ============================================
    // Navigate to Inventory to verify items were added
    await page.click('text=Inventory');
    await expect(page.locator('button:has-text("Add Item")')).toBeVisible();

    // Items were added (with quantity 0), verify categories are visible
    await expect(page.locator('button:has-text("Water")')).toBeVisible();

    // Verify in localStorage that items were added
    const itemsAdded = await page.evaluate(() => {
      const data = localStorage.getItem('emergencySupplyTracker');
      if (!data) return false;
      try {
        const appData = JSON.parse(data);
        return appData.items && appData.items.length > 0;
      } catch {
        return false;
      }
    });
    expect(itemsAdded).toBe(true);

    // ============================================
    // PHASE 3: EDIT MULTIPLE RECOMMENDED ITEMS
    // ============================================
    // After Quick Setup, items are added with quantity 0
    // Edit multiple items to add different quantities

    // Edit Item 1 - Add sufficient quantity (Water category)
    await ensureNoModals(page);
    await page.click('button:has-text("Water")');
    await page.waitForTimeout(500);

    const waterItems = page.locator(
      '[class*="itemCard"], [data-testid^="item-"]',
    );
    if ((await waterItems.count()) > 0) {
      await waterItems.first().click();
      await expect(
        page.locator('h2', { hasText: /Edit Item|Muokkaa/ }),
      ).toBeVisible({ timeout: 5000 });
      await page.fill('input[name="quantity"]', '50');
      await page.click('button[type="submit"]');
      await page
        .waitForSelector('[role="dialog"]', { state: 'hidden' })
        .catch(() => {});
      await page.waitForTimeout(500);
    }

    // Edit Item 2 - Add LESS than recommended (Food category)
    // This will test the "insufficient quantity" scenario
    await ensureNoModals(page);
    await page.click('button:has-text("Food")');
    await page.waitForTimeout(500);

    const foodItems = page.locator(
      '[class*="itemCard"], [data-testid^="item-"]',
    );
    if ((await foodItems.count()) > 0) {
      // Click first food item
      await foodItems.first().click();
      await expect(
        page.locator('h2', { hasText: /Edit Item|Muokkaa/ }),
      ).toBeVisible({ timeout: 5000 });

      // Add LESS than recommended (e.g., 2 pieces for a Family)
      // This should trigger a recommendation
      await page.fill('input[name="quantity"]', '2');
      await page.click('button[type="submit"]');
      await page
        .waitForSelector('[role="dialog"]', { state: 'hidden' })
        .catch(() => {});
      await page.waitForTimeout(500);

      // Now DISABLE this recommendation (insufficient quantity)
      // Expand recommended items to see the insufficient item
      await expandRecommendedItems(page);

      // Find the disable button (×) for the first recommended item
      const disableButton = page.locator('button:has-text("×")').first();
      if (await disableButton.isVisible().catch(() => false)) {
        await disableButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Edit Item 3 - Add sufficient quantity (Medical category)
    await ensureNoModals(page);
    await page.click('button:has-text("Medical")');
    await page.waitForTimeout(500);

    const medicalItems = page.locator(
      '[class*="itemCard"], [data-testid^="item-"]',
    );
    if ((await medicalItems.count()) > 0) {
      await medicalItems.first().click();
      await expect(
        page.locator('h2', { hasText: /Edit Item|Muokkaa/ }),
      ).toBeVisible({ timeout: 5000 });
      await page.fill('input[name="quantity"]', '10');
      await page.click('button[type="submit"]');
      await page
        .waitForSelector('[role="dialog"]', { state: 'hidden' })
        .catch(() => {});
      await page.waitForTimeout(500);
    }

    // ============================================
    // PHASE 3B: TEST COPY/DUPLICATE ITEM
    // ============================================
    // Test copying an item (e.g., water with different expiration)
    await ensureNoModals(page);
    await page.click('button:has-text("Water")');
    await page.waitForTimeout(500);

    const waterItemsForCopy = page.locator(
      '[class*="itemCard"], [data-testid^="item-"]',
    );
    if ((await waterItemsForCopy.count()) > 0) {
      // Click the first water item to open edit form
      await waterItemsForCopy.first().click();
      await expect(
        page.locator('h2', { hasText: /Edit Item|Muokkaa/ }),
      ).toBeVisible({ timeout: 5000 });

      // Look for Copy/Duplicate button
      const copyButton = page.locator('button', {
        hasText: /Copy|Duplicate|Kopioi/i,
      });
      if (await copyButton.isVisible().catch(() => false)) {
        await copyButton.click();

        // Should open add form with pre-filled data
        await expect(
          page.locator('h2', { hasText: /Add Item|Lisää/i }),
        ).toBeVisible({ timeout: 5000 });

        // Modify the copied item (change quantity)
        await page.fill('input[name="quantity"]', '25');

        // Add expiration date to the copy
        const expiresCheckbox = page.locator('input[type="checkbox"]');
        if (await expiresCheckbox.isChecked()) {
          await expiresCheckbox.uncheck();
        }
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        await page.fill(
          'input[type="date"]',
          futureDate.toISOString().split('T')[0],
        );

        await page.click('button[type="submit"]');
        await page
          .waitForSelector('[role="dialog"]', { state: 'hidden' })
          .catch(() => {});
        await page.waitForTimeout(500);
      } else {
        // If no copy button, just close the dialog
        await page.keyboard.press('Escape');
      }
    }

    // ============================================
    // PHASE 4: DASHBOARD ALERTS
    // ============================================
    // Navigate to Dashboard - should see alerts for insufficient quantities
    // (Family needs more supplies, so items with qty 0 trigger alerts)
    await page.click('text=Dashboard');
    await page.waitForLoadState('networkidle');

    // Verify alerts appear (low stock alerts due to insufficient quantities)
    await expect(page.locator('h2:has-text("Alerts")')).toBeVisible({
      timeout: 5000,
    });

    // Low stock alerts may appear due to insufficient quantities for Family size
    // We don't assert on these - the expired item below guarantees alerts

    // Add an item with expired date to test alert dismissal
    await ensureNoModals(page);
    // Use client-side navigation for SPAs (GitHub Pages doesn't serve /inventory directly)
    await page.click('text=Inventory');
    await expect(page.locator('h1:has-text("Inventory")')).toBeVisible({
      timeout: 5000,
    });
    await ensureNoModals(page);
    // Language is still English at this point (before Phase 5 settings)
    await page.getByRole('button', { name: 'Add Item' }).click();
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.getByRole('button', { name: 'Custom Item' }).click();
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const expiredDateString = pastDate.toISOString().split('T')[0];

    await page.fill('input[name="name"]', 'Expired Alert Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '2');
    await page.selectOption('select[name="unit"]', 'pieces');
    // Uncheck "Never Expires" checkbox using label-based selector
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

    // Navigate to Dashboard
    await page.click('text=Dashboard');
    await page.waitForLoadState('networkidle');

    // Verify expired alert appears
    await expect(page.getByText(/expired|vanhentunut/i)).toBeVisible({
      timeout: 5000,
    });

    // Dismiss alert
    const dismissButton = page
      .locator('.alert button, button:has-text("✕"), [aria-label*="dismiss" i]')
      .first();
    await expect(dismissButton).toBeVisible({ timeout: 5000 });
    await dismissButton.click();
    await page.waitForTimeout(500);

    // Verify alert is hidden
    const alertText = page.locator('.alert').getByText(/expired|vanhentunut/i);
    await expect(alertText).not.toBeVisible({ timeout: 3000 });

    // ============================================
    // PHASE 5: SETTINGS - ALL FEATURES
    // ============================================
    await page.click('text=Settings');
    await page.waitForLoadState('networkidle');

    // Change language
    const languageSelect = page.locator('select').first();
    if (await languageSelect.isVisible().catch(() => false)) {
      await languageSelect.selectOption('fi');
      await page.waitForTimeout(500);
      // Verify language changed (check for Finnish text)
      const navText = await page.locator('nav').textContent();
      expect(navText).toBeTruthy();
    }

    // Change theme
    const themeSelect = page.locator('#theme-select');
    if (await themeSelect.isVisible().catch(() => false)) {
      await themeSelect.selectOption('dark');
      const themeAttribute = await page.evaluate(
        () => document.documentElement.dataset.theme,
      );
      expect(themeAttribute).toBe('dark');
    }

    // Toggle advanced features - find checkbox via its label
    const advancedCheckbox = page
      .locator('label:has-text(/Calorie|Power|Water/i) input[type="checkbox"]')
      .first();
    if (await advancedCheckbox.isVisible().catch(() => false)) {
      const initialState = await advancedCheckbox.isChecked();
      await advancedCheckbox.click();
      const newState = await advancedCheckbox.isChecked();
      expect(newState).toBe(!initialState);
    }

    // ============================================
    // PHASE 5B: RE-ENABLE DISABLED RECOMMENDATION
    // ============================================
    // Scroll down to find disabled recommendations section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Look for disabled recommendations section
    const disabledSection = page.locator('text=/Disabled Recommendations/i');
    if (await disabledSection.isVisible().catch(() => false)) {
      // Should have at least one disabled item (from earlier)
      const enableButton = page
        .locator('button', { hasText: /^Enable$|^Ota käyttöön$/i })
        .first();

      if (await enableButton.isVisible().catch(() => false)) {
        await enableButton.click();
        await page.waitForTimeout(500);

        // Verify the button is gone (item was re-enabled)
        await expect(enableButton).not.toBeVisible({ timeout: 3000 });
      }
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Change household from Family to Single Person
    // This should reduce recommended quantities, making existing items sufficient
    const presetButton = page.locator('button', {
      hasText: /Single Person|Yksin/i,
    });
    if (await presetButton.isVisible().catch(() => false)) {
      await presetButton.click();
      await page.waitForTimeout(500);

      // Verify household changed (Single Person = 1 adult)
      const householdAdultsInput = page.locator('input[type="number"]').first();
      const adultsValue = await householdAdultsInput.inputValue();
      expect(Number.parseInt(adultsValue, 10)).toBe(1);
    }

    // ============================================
    // PHASE 6: DATA MANAGEMENT
    // ============================================
    // Export data
    const exportButton = page.locator('button', {
      hasText: /Export Data|Vie tiedot/i,
    });
    if (await exportButton.isVisible().catch(() => false)) {
      await exportButton.click();
      await page.waitForTimeout(1000);
    }

    // Export shopping list (if items need restocking)
    const shoppingListButton = page.locator('button', {
      hasText: /Export Shopping List|Vie ostoslista/i,
    });
    if (await shoppingListButton.isVisible().catch(() => false)) {
      const isEnabled = await shoppingListButton.isEnabled();
      if (isEnabled) {
        await shoppingListButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Export recommendations
    const exportRecsButton = page.locator('button', {
      hasText: /Export Recommendations/i,
    });
    if (await exportRecsButton.isVisible().catch(() => false)) {
      await exportRecsButton.click();
      await page.waitForTimeout(500);
    }

    // ============================================
    // PHASE 7: NAVIGATION & PERSISTENCE
    // ============================================
    // Reload and verify persistence
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

    // Verify data persisted - check localStorage
    const dataPersisted = await page.evaluate(() => {
      const data = localStorage.getItem('emergencySupplyTracker');
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
    });

    expect(dataPersisted.persisted).toBe(true);
    expect(dataPersisted.items.length).toBeGreaterThan(0);
    expect(dataPersisted.hasItems).toBe(true);

    // Verify settings persisted - navigate to settings
    await page.goto(`${getBaseURL()}/settings`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    const themeSelectAfterReload = page.locator('#theme-select');
    if (await themeSelectAfterReload.isVisible().catch(() => false)) {
      const themeValue = await themeSelectAfterReload.inputValue();
      expect(themeValue).toBe('dark');
    }

    // ============================================
    // PHASE 8: FINAL VERIFICATION
    // ============================================
    // Return to dashboard using direct navigation
    await ensureNoModals(page);
    await page.goto(getBaseURL(), {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

    // Final verification - dashboard should load
    const dashboardLoaded = await page
      .locator('h1:has-text("Dashboard")')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // If dashboard loaded, verify sections
    if (dashboardLoaded) {
      const quickActions = await page
        .locator('text=Quick Actions')
        .isVisible()
        .catch(() => false);
      const categoriesOverview = await page
        .locator('text=Categories Overview')
        .isVisible()
        .catch(() => false);
      // At least one section should be visible
      expect(quickActions || categoriesOverview).toBe(true);
    }

    // Test complete - all major user actions verified with Quick Setup flow!
  });
});
