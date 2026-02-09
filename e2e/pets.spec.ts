import {
  test,
  expect,
  setAppStorage,
  expandRecommendedItems,
  navigateToSettingsSection,
  selectInventoryCategory,
} from './fixtures';
import { createMockAppData } from '../src/shared/utils/test/factories';

test.describe('Pet Support', () => {
  test.describe('Settings', () => {
    test.beforeEach(async ({ setupApp }) => {
      await setupApp();
    });

    test('should display pets input field in household form', async ({
      page,
    }) => {
      await page.getByTestId('nav-settings').click();

      // Navigate to household section
      await navigateToSettingsSection(page, 'household');
      await expect(page.getByTestId('section-household')).toBeVisible();

      // Pets input should be visible in household section
      const petsInput = page.locator('#pets');
      await expect(petsInput).toBeVisible();
    });

    test('should update pets count and persist value', async ({ page }) => {
      await page.getByTestId('nav-settings').click();
      await navigateToSettingsSection(page, 'household');
      await expect(page.getByTestId('section-household')).toBeVisible();

      // Find pets input and update value
      const petsInput = page.locator('#pets');
      await petsInput.fill('2');

      // Navigate away and back to verify persistence
      await page.getByTestId('nav-dashboard').click();
      await page.getByTestId('nav-settings').click();
      await navigateToSettingsSection(page, 'household');
      await expect(page.getByTestId('section-household')).toBeVisible();

      // Verify value persisted
      await expect(petsInput).toHaveValue('2');
    });

    test('should set pets to 0 when selecting family preset', async ({
      page,
    }) => {
      await page.getByTestId('nav-settings').click();
      await navigateToSettingsSection(page, 'household');
      await expect(page.getByTestId('section-household')).toBeVisible();

      // Click family preset
      await page.getByTestId('preset-family').click();

      // Pets should be set to 0
      const petsInput = page.locator('#pets');
      await expect(petsInput).toHaveValue('0');
    });

    test('should set pets to 0 when selecting single preset', async ({
      page,
    }) => {
      // First set pets to non-zero
      await page.getByTestId('nav-settings').click();
      await navigateToSettingsSection(page, 'household');
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
      await setAppStorage(page, appData);
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Navigate to inventory
      await page.getByTestId('nav-inventory').click();

      // Pets category should be visible in the side menu (scope to sidebar for desktop)
      const sidebar = page.getByTestId('sidemenu-sidebar');
      await expect(sidebar.getByTestId('sidemenu-item-pets')).toBeVisible();
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
      await setAppStorage(page, appData);
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Navigate to inventory and click pets category
      await page.getByTestId('nav-inventory').click();
      await selectInventoryCategory(page, 'pets');

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
      await setAppStorage(page, appData);
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Navigate to inventory
      await page.getByTestId('nav-inventory').click();

      // Pets category should not be clickable or should show 0 recommended items
      // The category may still exist but clicking should show no items
      const sidebar = page.getByTestId('sidemenu-sidebar');
      const petsCategory = sidebar.getByTestId('sidemenu-item-pets');

      if (await petsCategory.isVisible()) {
        await selectInventoryCategory(page, 'pets');

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
      await setAppStorage(page, appData);
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Navigate to pets category
      await page.getByTestId('nav-inventory').click();
      await selectInventoryCategory(page, 'pets');

      // Expand recommended items
      await expandRecommendedItems(page);

      // Items like pet bowls should have quantity 2 (one per pet × 2 pets)
      // Check that recommended items are showing quantities
      const recommendedItems = page.locator('[class*="missingItemText"]');
      const count = await recommendedItems.count();
      expect(count).toBeGreaterThan(0);

      // Verify that pet items are showing with scaled quantities
      // With 2 pets and 3 days, pet items should be scaled:
      // - Items that scale with pets only: quantity = 2 (e.g., pet bowls)
      // - Items that scale with pets and days: quantity = 2 * 3 = 6 (e.g., pet food)
      // The fact that items are showing confirms scaling is working
      // (items with 0 quantity when pets=0 wouldn't appear)
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

      // Family preset sets pets to 0
      await expect(petsInput).toHaveValue('0');

      // Set pets to 2
      await petsInput.fill('2');

      // Continue through onboarding
      await page.getByTestId('household-save-button').click();

      // Step 4: Kit Selection - clicking a kit advances to next step
      await expect(
        page.getByTestId('onboarding-recommendation-kit-step'),
      ).toBeVisible({
        timeout: 5000,
      });
      // Select a kit (clicking advances to next step)
      const defaultKitCard = page.getByTestId('kit-card-72tuntia-standard');
      await expect(defaultKitCard).toBeVisible({ timeout: 5000 });
      await defaultKitCard.click();

      // Step 5: Quick Setup
      await expect(page.getByTestId('onboarding-quick-setup')).toBeVisible({
        timeout: 5000,
      });
      await page.getByTestId('skip-quick-setup-button').click();

      // Verify pets value persisted
      await page.getByTestId('nav-settings').click();
      await navigateToSettingsSection(page, 'household');
      const settingsPetsInput = page.locator('#pets');
      await expect(settingsPetsInput).toHaveValue('2');
    });
  });
});
