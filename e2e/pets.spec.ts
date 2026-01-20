import { test, expect, expandRecommendedItems } from './fixtures';
import { createMockAppData } from '../src/shared/utils/test/factories';
import { STORAGE_KEY } from '../src/shared/utils/storage/localStorage';

test.describe('Pet Support', () => {
  test.describe('Settings', () => {
    test.beforeEach(async ({ setupApp }) => {
      await setupApp();
    });

    test('should display pets input field in household form', async ({
      page,
    }) => {
      await page.getByTestId('nav-settings').click();

      // Wait for the household section to be visible
      await expect(page.getByTestId('section-household')).toBeVisible();

      // Pets input should be visible in household section
      const petsInput = page.locator('#pets');
      await expect(petsInput).toBeVisible();
    });

    test('should update pets count and persist value', async ({ page }) => {
      await page.getByTestId('nav-settings').click();
      await expect(page.getByTestId('section-household')).toBeVisible();

      // Find pets input and update value
      const petsInput = page.locator('#pets');
      await petsInput.fill('2');

      // Navigate away and back to verify persistence
      await page.getByTestId('nav-dashboard').click();
      await page.getByTestId('nav-settings').click();
      await expect(page.getByTestId('section-household')).toBeVisible();

      // Verify value persisted
      await expect(petsInput).toHaveValue('2');
    });

    test('should set pets to 1 when selecting family preset', async ({
      page,
    }) => {
      await page.getByTestId('nav-settings').click();
      await expect(page.getByTestId('section-household')).toBeVisible();

      // Click family preset
      await page.getByTestId('preset-family').click();

      // Pets should be set to 1
      const petsInput = page.locator('#pets');
      await expect(petsInput).toHaveValue('1');
    });

    test('should set pets to 0 when selecting single preset', async ({
      page,
    }) => {
      // First set pets to non-zero
      await page.getByTestId('nav-settings').click();
      await expect(page.getByTestId('section-household')).toBeVisible();

      const petsInput = page.locator('#pets');
      await petsInput.fill('3');

      // Click single preset
      await page.getByTestId('preset-single').click();

      // Pets should be set to 0
      await expect(petsInput).toHaveValue('0');
    });
  });

  test.describe('Pets Category', () => {
    test('should show pets category in inventory when pets > 0', async ({
      page,
    }) => {
      // Setup with pets
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
        household: {
          adults: 2,
          children: 0,
          pets: 2,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        items: [],
      });

      await page.goto('/');
      await page.evaluate(
        ({ data, key }) => {
          localStorage.setItem(key, JSON.stringify(data));
        },
        { data: appData, key: STORAGE_KEY },
      );
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Navigate to inventory
      await page.getByTestId('nav-inventory').click();

      // Pets category should be visible
      await expect(page.getByTestId('category-pets')).toBeVisible();
    });

    test('should show pet items in pets category', async ({ page }) => {
      // Setup with pets
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
        household: {
          adults: 2,
          children: 0,
          pets: 1,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        items: [],
      });

      await page.goto('/');
      await page.evaluate(
        ({ data, key }) => {
          localStorage.setItem(key, JSON.stringify(data));
        },
        { data: appData, key: STORAGE_KEY },
      );
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Navigate to inventory and click pets category
      await page.getByTestId('nav-inventory').click();
      await page.getByTestId('category-pets').click();

      // Expand recommended items
      await expandRecommendedItems(page);

      // Should show pet-specific recommended items
      const recommendedItems = page.locator('[class*="missingItemText"]');
      const count = await recommendedItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should not show pet items when pets is 0', async ({ page }) => {
      // Setup without pets (pets: 0)
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
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        items: [],
      });

      await page.goto('/');
      await page.evaluate(
        ({ data, key }) => {
          localStorage.setItem(key, JSON.stringify(data));
        },
        { data: appData, key: STORAGE_KEY },
      );
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Navigate to inventory
      await page.getByTestId('nav-inventory').click();

      // Pets category should not be clickable or should show 0 recommended items
      // The category may still exist but clicking should show no items
      const petsCategory = page.getByTestId('category-pets');

      if (await petsCategory.isVisible()) {
        await petsCategory.click();

        // Check if there are no recommended items or section doesn't show
        const recommendedSection = page.locator('text=Recommended:');
        const hasRecommended = await recommendedSection
          .isVisible()
          .catch(() => false);

        if (hasRecommended) {
          // If section exists, expand it and check for 0 items
          await expandRecommendedItems(page);
          const recommendedItems = page.locator('[class*="missingItemText"]');
          await expect(recommendedItems).toHaveCount(0);
        }
      }
    });
  });

  test.describe('Pet Item Scaling', () => {
    test('should scale pet items with pet count', async ({ page }) => {
      // Setup with 2 pets
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
        household: {
          adults: 2,
          children: 0,
          pets: 2,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        items: [],
      });

      await page.goto('/');
      await page.evaluate(
        ({ data, key }) => {
          localStorage.setItem(key, JSON.stringify(data));
        },
        { data: appData, key: STORAGE_KEY },
      );
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Navigate to pets category
      await page.getByTestId('nav-inventory').click();
      await page.getByTestId('category-pets').click();

      // Expand recommended items
      await expandRecommendedItems(page);

      // Items like pet bowls should have quantity 2 (one per pet)
      // Check that recommended items are showing quantities
      const recommendedItems = page.locator('[class*="missingItemText"]');
      const count = await recommendedItems.count();
      expect(count).toBeGreaterThan(0);

      // Find the pet bowl item and verify its quantity is 2 (1 per pet × 2 pets)
      // The format is "Item Name: X unit" e.g., "Pet Water Bowl: 2 pieces"
      const petBowlItem = recommendedItems.filter({ hasText: /Pet.*Bowl.*2/i });
      await expect(petBowlItem.first()).toBeVisible();
    });
  });

  test.describe('Onboarding with Pets', () => {
    test('should allow setting pets count during onboarding', async ({
      page,
    }) => {
      // Clear localStorage to simulate first-time user
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Welcome screen
      await page.getByTestId('get-started-button').click();

      // Select family preset
      await page.getByTestId('preset-family').click();

      // Wait for household form to appear
      await expect(page.getByTestId('onboarding-household-form')).toBeVisible();

      // Find pets input
      const petsInput = page.locator('#pets');
      await expect(petsInput).toBeVisible();

      // Family preset sets pets to 1
      await expect(petsInput).toHaveValue('1');

      // Set pets to 2
      await petsInput.fill('2');

      // Continue through onboarding
      await page.getByTestId('household-save-button').click();
      await page.getByTestId('skip-quick-setup-button').click();

      // Verify pets value persisted
      await page.getByTestId('nav-settings').click();
      const settingsPetsInput = page.locator('#pets');
      await expect(settingsPetsInput).toHaveValue('2');
    });
  });
});
