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
    await page.getByTestId('nav-settings').click();

    // Verify settings page is visible
    await expect(page.getByTestId('page-settings')).toBeVisible();
    await expect(page.locator('text=Appearance')).toBeVisible();
    await expect(page.locator('text=Household Configuration')).toBeVisible();
  });

  test('should change language', async ({ page }) => {
    await page.getByTestId('nav-settings').click();

    // Find language selector
    const languageSelect = page.locator('select').first();

    // Change to Finnish
    await languageSelect.selectOption('fi');

    // Wait for language change to apply by waiting for Finnish text to appear
    // Finnish for "Dashboard" is "Näkymä"
    await expect(page.getByTestId('nav-dashboard')).toContainText('Näkymä', {
      timeout: 5000,
    });

    // Navigate to different page to see translated content
    await page.getByTestId('nav-dashboard').click();

    // Check if navigation changed to Finnish
    // (This assumes navigation labels change with language)
    const navText = await page.locator('nav').textContent();
    // Just verify navigation is still functional
    expect(navText).toBeTruthy();
  });

  test('should update household configuration', async ({ page }) => {
    await page.getByTestId('nav-settings').click();

    // Find household inputs
    const adultsInput = page.locator('input[type="number"]').first();
    await adultsInput.fill('3');

    // Values should be saved to localStorage automatically
    // Navigate away and back to verify persistence
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('nav-settings').click();

    // Verify value persisted
    await expect(adultsInput).toHaveValue('3');
  });

  test('should use household presets', async ({ page }) => {
    await page.getByTestId('nav-settings').click();

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
    await page.getByTestId('nav-settings').click();

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
    await page.getByTestId('nav-settings').click();

    // Find GitHub link
    const githubLink = page.locator('a[href*="github"]');

    // Verify it exists and has correct attributes
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should display disabled recommendations section', async ({ page }) => {
    await page.getByTestId('nav-settings').click();

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
    await page.getByTestId('nav-inventory').click();

    // Ensure no modals are open
    await ensureNoModals(page);

    await page.getByTestId('category-water-beverages').click();

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
    await page.getByTestId('nav-settings').click();

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
    await page.getByTestId('nav-inventory').click();

    // Ensure no modals are open
    await ensureNoModals(page);

    await page.getByTestId('category-water-beverages').click();

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
    await page.getByTestId('nav-settings').click();

    // Click Enable button (not Enable All)
    const enableButton = page
      .locator('button', { hasText: /^Enable$/ })
      .first();
    await enableButton.click();

    // Navigate back to inventory
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('category-water-beverages').click();

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
    await page.getByTestId('nav-inventory').click();

    // Ensure no modals are open
    await ensureNoModals(page);

    await page.getByTestId('category-water-beverages').click();

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
    await page.getByTestId('nav-settings').click();

    // Should see Enable All button
    const enableAllButton = page.locator(
      'button:has-text("Enable All Recommendations")',
    );
    await expect(enableAllButton).toBeVisible();

    // Click Enable All
    await enableAllButton.click();

    // Navigate back to inventory
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('category-water-beverages').click();

    // Expand recommended items again
    await expandRecommendedItems(page);

    // All items should be back
    const finalMissingItemsLocator = page.locator('[class*="missingItemText"]');
    await expect(finalMissingItemsLocator).toHaveCount(initialCount, {
      timeout: 5000,
    });
  });
});
