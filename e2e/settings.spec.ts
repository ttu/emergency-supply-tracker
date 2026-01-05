import {
  test,
  expect,
  expandRecommendedItems,
  ensureNoModals,
  waitForCountChange,
} from './fixtures';

test.describe('Settings', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should display settings page', async ({ page }) => {
    await page.click('text=Settings');

    // Verify settings sections are visible
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    await expect(page.locator('text=Appearance')).toBeVisible();
    await expect(page.locator('text=Household Configuration')).toBeVisible();
  });

  test('should change language', async ({ page }) => {
    await page.click('text=Settings');

    // Find language selector
    const languageSelect = page.locator('select').first();

    // Change to Finnish
    await languageSelect.selectOption('fi');

    // Wait for language change to apply by waiting for Finnish text to appear
    // Finnish for "Dashboard" is "Näkymä"
    await expect(page.locator('nav button:has-text("Näkymä")')).toBeVisible({
      timeout: 5000,
    });

    // Navigate to different page to see translated content
    const firstNavButton = page.locator('nav button').first();
    await firstNavButton.click();

    // Check if navigation changed to Finnish
    // (This assumes navigation labels change with language)
    const navText = await page.locator('nav').textContent();
    // Just verify navigation is still functional
    expect(navText).toBeTruthy();
  });

  test('should update household configuration', async ({ page }) => {
    await page.click('text=Settings');

    // Find household inputs
    const adultsInput = page.locator('input[type="number"]').first();
    await adultsInput.fill('3');

    // Values should be saved to localStorage automatically
    // Navigate away and back to verify persistence
    await page.click('text=Dashboard');
    await page.click('text=Settings');

    // Verify value persisted
    await expect(adultsInput).toHaveValue('3');
  });

  test('should use household presets', async ({ page }) => {
    await page.click('text=Settings');

    // Click a preset button (e.g., "Family")
    const presetButton = page.locator('button', { hasText: 'Family' });
    await presetButton.click();

    // Household values should be updated
    const adultsInput = page.locator('input[type="number"]').first();
    const adultsValue = await adultsInput.inputValue();

    // Should have a valid number
    expect(parseInt(adultsValue)).toBeGreaterThan(0);
  });

  test('should toggle advanced features', async ({ page }) => {
    await page.click('text=Settings');

    // Find and toggle a feature checkbox
    const featureCheckbox = page.locator('input[type="checkbox"]').first();
    const initialState = await featureCheckbox.isChecked();

    // Toggle the checkbox
    await featureCheckbox.click();

    // Verify state changed
    const newState = await featureCheckbox.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('should navigate to GitHub from About section', async ({ page }) => {
    await page.click('text=Settings');

    // Find GitHub link
    const githubLink = page.locator('a[href*="github"]');

    // Verify it exists and has correct attributes
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should display disabled recommendations section', async ({ page }) => {
    await page.click('text=Settings');

    // Verify disabled recommendations section exists
    await expect(
      page.locator('h2:has-text("Disabled Recommendations")'),
    ).toBeVisible();

    // Should show empty message when no items are disabled
    await expect(
      page.locator('text=No disabled recommendations'),
    ).toBeVisible();
  });

  test('should show disabled item in settings after disabling from inventory', async ({
    page,
  }) => {
    // First, disable an item from inventory
    await page.click('text=Inventory');

    // Ensure no modals are open
    await ensureNoModals(page);

    await page.click('button:has-text("Water")');

    // Expand recommended items (they are hidden by default)
    await expandRecommendedItems(page);

    // Ensure no modals are blocking before clicking
    await ensureNoModals(page);

    // Get the count before disabling
    const missingItemsLocator = page.locator('[class*="missingItemText"]');
    const initialCount = await missingItemsLocator.count();

    // Click the × button to disable the first recommended item
    const disableButton = page.locator('button:has-text("×")').first();
    await disableButton.click();

    // Wait for the count to decrease
    await waitForCountChange(missingItemsLocator, initialCount, {
      decrease: true,
    });

    // Navigate to Settings
    await page.click('text=Settings');

    // Should see the Disabled Recommendations section with the item
    await expect(
      page.locator('h2:has-text("Disabled Recommendations")'),
    ).toBeVisible();

    // The disabled item should appear in the list
    await expect(
      page.locator('text=No disabled recommendations'),
    ).not.toBeVisible();

    // Should have an Enable button
    await expect(page.locator('button:has-text("Enable")')).toBeVisible();
  });

  test('should re-enable disabled recommendation from settings', async ({
    page,
  }) => {
    // First, disable an item from inventory
    await page.click('text=Inventory');

    // Ensure no modals are open
    await ensureNoModals(page);

    await page.click('button:has-text("Water")');

    // Expand recommended items (they are hidden by default)
    await expandRecommendedItems(page);

    // Ensure no modals are blocking before clicking
    await ensureNoModals(page);

    // Count initial recommended items
    const missingItemsLocator = page.locator('[class*="missingItemText"]');
    const initialCount = await missingItemsLocator.count();

    // Disable the first item
    await page.locator('button:has-text("×")').first().click();

    // Wait for item to be disabled
    await waitForCountChange(missingItemsLocator, initialCount, {
      decrease: true,
    });

    // Verify item is disabled
    const afterDisableCount = await missingItemsLocator.count();
    expect(afterDisableCount).toBe(initialCount - 1);

    // Navigate to Settings and re-enable the item
    await page.click('text=Settings');

    // Click Enable button (not Enable All)
    const enableButton = page
      .locator('button', { hasText: /^Enable$/ })
      .first();
    await enableButton.click();

    // Navigate back to inventory
    await page.click('text=Inventory');
    await page.click('button:has-text("Water")');

    // Expand recommended items again
    await expandRecommendedItems(page);

    // The item should be back in the recommended list
    const finalMissingItemsLocator = page.locator('[class*="missingItemText"]');
    await expect(finalMissingItemsLocator).toHaveCount(initialCount, {
      timeout: 5000,
    });
  });

  test('should enable all disabled recommendations at once', async ({
    page,
  }) => {
    // First, disable multiple items from inventory
    await page.click('text=Inventory');

    // Ensure no modals are open
    await ensureNoModals(page);

    await page.click('button:has-text("Water")');

    // Expand recommended items (they are hidden by default)
    await expandRecommendedItems(page);

    // Ensure no modals are blocking before clicking
    await ensureNoModals(page);

    // Count initial recommended items
    const missingItemsLocator = page.locator('[class*="missingItemText"]');
    const initialCount = await missingItemsLocator.count();

    // Disable first item
    await page.locator('button:has-text("×")').first().click();
    await waitForCountChange(missingItemsLocator, initialCount, {
      decrease: true,
    });

    // Disable second item
    await page.locator('button:has-text("×")').first().click();
    await waitForCountChange(missingItemsLocator, initialCount - 1, {
      decrease: true,
    });

    // Navigate to Settings
    await page.click('text=Settings');

    // Should see Enable All button
    const enableAllButton = page.locator(
      'button:has-text("Enable All Recommendations")',
    );
    await expect(enableAllButton).toBeVisible();

    // Click Enable All
    await enableAllButton.click();

    // Navigate back to inventory
    await page.click('text=Inventory');
    await page.click('button:has-text("Water")');

    // Expand recommended items again
    await expandRecommendedItems(page);

    // All items should be back
    const finalMissingItemsLocator = page.locator('[class*="missingItemText"]');
    await expect(finalMissingItemsLocator).toHaveCount(initialCount, {
      timeout: 5000,
    });
  });
});
