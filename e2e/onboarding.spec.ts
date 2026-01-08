import { test, expect } from './fixtures';
import { createMockAppData } from '../src/shared/utils/test/factories';

test.describe('Onboarding Flow', () => {
  test('should show onboarding for first-time users', async ({ page }) => {
    // Clear localStorage to simulate first-time user
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Should see welcome screen
    await expect(page.getByText(/Get Started|Aloita/i)).toBeVisible();
  });

  test('should complete onboarding flow: Welcome → Preset → Household → Quick Setup', async ({
    page,
  }) => {
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Step 1: Welcome screen
    await expect(page.getByText(/Get Started|Aloita/i)).toBeVisible();
    await page.getByRole('button', { name: /Get Started|Aloita/i }).click();

    // Step 2: Preset selection
    await expect(page.getByText(/Single Person|Yksin/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/Couple|Pari/i)).toBeVisible();
    await expect(page.getByText(/Family|Perhe/i)).toBeVisible();

    // Select "Couple" preset
    await page.getByRole('button', { name: /Couple|Pari/i }).click();

    // Step 3: Household configuration
    await expect(page.locator('input[type="number"]').first()).toBeVisible({
      timeout: 5000,
    });

    // Verify preset pre-filled values (Couple = 2 adults, 0 children)
    const adultsInput = page.locator('input[type="number"]').first();
    await expect(adultsInput).toHaveValue('2');

    // Submit form to go to Quick Setup (button is "Save")
    await page.getByRole('button', { name: /Save|Tallenna/i }).click();

    // Step 4: Quick Setup
    await expect(
      page.getByRole('button', {
        name: /Add Recommended Items|Lisää suositellut/i,
      }),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole('button', { name: /Skip for now|Ohita toistaiseksi/i }),
    ).toBeVisible();

    // Choose to skip
    await page
      .getByRole('button', { name: /Skip for now|Ohita toistaiseksi/i })
      .click();

    // Should navigate to Dashboard after completion
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should add all recommended items during quick setup', async ({
    page,
  }) => {
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Navigate through onboarding
    await page.getByRole('button', { name: /Get Started|Aloita/i }).click();
    await page.getByRole('button', { name: /Single Person|Yksin/i }).click();
    await page.getByRole('button', { name: /Save|Tallenna/i }).click();

    // Click "Add Recommended Items"
    await page
      .getByRole('button', {
        name: /Add Recommended Items|Lisää suositellut/i,
      })
      .click();

    // Should navigate to Dashboard
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({
      timeout: 5000,
    });

    // Navigate to Inventory to verify items were added
    await page.click('text=Inventory');
    await expect(page.locator('button:has-text("Add Item")')).toBeVisible();

    // Should have items in inventory (at least some recommended items)
    // Note: Items are added with quantity 0, so they may not be visible
    // But the category should show some status
    await expect(page.locator('button:has-text("Water")')).toBeVisible();
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
    await page.evaluate((data) => {
      localStorage.setItem('emergencySupplyTracker', JSON.stringify(data));
    }, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Should go directly to Dashboard, not onboarding
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    await expect(page.getByText(/Get Started|Aloita/i)).not.toBeVisible();
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
    await page.getByRole('button', { name: /Aloita/i }).click();
    await page.getByRole('button', { name: /Pari/i }).click();
    await page.getByRole('button', { name: /Tallenna/i }).click();
    await page.getByRole('button', { name: /Ohita toistaiseksi/i }).click();

    // Language should persist - navigation should be in Finnish
    await expect(page.locator('nav button:has-text("Näkymä")')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should allow going back in onboarding flow', async ({ page }) => {
    // Clear localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Welcome → Preset
    await page.getByRole('button', { name: /Get Started|Aloita/i }).click();
    await expect(page.getByText(/Single Person|Yksin/i)).toBeVisible();

    // Preset → Household
    await page.getByRole('button', { name: /Single Person|Yksin/i }).click();
    await expect(page.locator('input[type="number"]').first()).toBeVisible();

    // Go back to Preset (button is "Cancel")
    await page.getByRole('button', { name: /Cancel|Peruuta/i }).click();
    await expect(page.getByText(/Single Person|Yksin/i)).toBeVisible();
  });
});
