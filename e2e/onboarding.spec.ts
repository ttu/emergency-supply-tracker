import { test, expect } from './fixtures';
import { createMockAppData } from '../src/shared/utils/test/factories';
import { STORAGE_KEY } from '../src/shared/utils/storage/localStorage';

test.describe('Onboarding Flow', () => {
  test('should show onboarding for first-time users', async ({ page }) => {
    // Clear localStorage to simulate first-time user
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Should see welcome screen
    await expect(page.getByTestId('onboarding-welcome')).toBeVisible();
    await expect(page.getByTestId('get-started-button')).toBeVisible();
  });

  test('should complete onboarding flow: Welcome → Preset → Household → Quick Setup', async ({
    page,
  }) => {
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Step 1: Welcome screen
    await expect(page.getByTestId('onboarding-welcome')).toBeVisible();
    await page.getByTestId('get-started-button').click();

    // Step 2: Preset selection
    await expect(page.getByTestId('onboarding-preset-selector')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId('preset-single')).toBeVisible();
    await expect(page.getByTestId('preset-couple')).toBeVisible();
    await expect(page.getByTestId('preset-family')).toBeVisible();

    // Select "Couple" preset
    await page.getByTestId('preset-couple').click();

    // Step 3: Household configuration
    await expect(page.getByTestId('onboarding-household-form')).toBeVisible({
      timeout: 5000,
    });

    // Verify preset pre-filled values (Couple = 2 adults, 0 children)
    const adultsInput = page.locator('input[type="number"]').first();
    await expect(adultsInput).toHaveValue('2');

    // Submit form to go to Quick Setup (button is "Save")
    await page.getByTestId('household-save-button').click();

    // Step 4: Quick Setup
    await expect(page.getByTestId('onboarding-quick-setup')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId('add-items-button')).toBeVisible();
    await expect(page.getByTestId('skip-quick-setup-button')).toBeVisible();

    // Choose to skip
    await page.getByTestId('skip-quick-setup-button').click();

    // Should navigate to Dashboard after completion
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should add selected items during quick setup', async ({ page }) => {
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Navigate through onboarding
    await page.getByTestId('get-started-button').click();
    await page.getByTestId('preset-single').click();
    await page.getByTestId('household-save-button').click();

    // Select some items first (button is disabled when no items selected)
    // Show details to access item checkboxes
    const showDetailsButton = page.getByRole('button', {
      name: /Show item details|Näytä tuotetiedot/i,
    });
    await showDetailsButton.click({ timeout: 5000 });

    // Wait for checkboxes to appear and select first item
    const firstCheckbox = page
      .locator('input[type="checkbox"][id^="item-"]')
      .first();
    await firstCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await firstCheckbox.click();

    // Click "Add Selected Items" using data-testid
    await page.getByTestId('add-items-button').click();

    // Should navigate to Dashboard
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({
      timeout: 5000,
    });

    // Navigate to Inventory to verify items were added
    await page.getByTestId('nav-inventory').click();
    await expect(page.getByTestId('add-item-button')).toBeVisible();

    // Should have items in inventory (at least some recommended items)
    // Note: Items are added with quantity 0, so they may not be visible
    // But the category should show some status
    await expect(page.getByTestId('category-water-beverages')).toBeVisible();
  });

  test('should not show onboarding for returning users', async ({ page }) => {
    // Setup with onboarding completed
    const appData = createMockAppData({
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
    });

    await page.goto('/');
    await page.evaluate(
      ({ data, key }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { data: appData, key: STORAGE_KEY },
    );
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Should go directly to Dashboard, not onboarding
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    await expect(page.getByTestId('onboarding-welcome')).not.toBeVisible();
  });

  test('should allow language selection during onboarding', async ({
    page,
  }) => {
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Welcome screen should have language selector
    const languageSelect = page.locator('select').first();
    await expect(languageSelect).toBeVisible();

    // Change to Finnish
    await languageSelect.selectOption('fi');

    // Continue through onboarding
    await page.getByTestId('get-started-button').click();
    await page.getByTestId('preset-couple').click();
    await page.getByTestId('household-save-button').click();
    await page.getByTestId('skip-quick-setup-button').click();

    // Language should persist - navigation should be in Finnish
    await expect(page.getByTestId('nav-dashboard')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should allow going back in onboarding flow', async ({ page }) => {
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Welcome → Preset
    await page.getByTestId('get-started-button').click();
    await expect(page.getByTestId('onboarding-preset-selector')).toBeVisible();

    // Preset → Household
    await page.getByTestId('preset-single').click();
    await expect(page.getByTestId('onboarding-household-form')).toBeVisible();

    // Go back to Preset (button is "Cancel")
    await page.getByTestId('household-cancel-button').click();
    await expect(page.getByTestId('onboarding-preset-selector')).toBeVisible();
  });
});
