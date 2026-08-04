import {
  test,
  expect,
  setAppStorage,
  navigateToSettingsSection,
  selectInventoryCategory,
  waitForStoredData,
} from './fixtures';
import {
  createMockAppData,
  createMockInventoryItem,
} from '../src/shared/utils/test/factories';
import { createCategoryId, createQuantity } from '../src/shared/types';

/**
 * In design v2 pets are controlled by the PETS StepperRow inside Settings
 * → Household (§2). Presets only exist in onboarding, not in settings.
 */

const v2Settings = {
  onboardingCompleted: true as const,
  language: 'en' as const,
  theme: 'cockpit' as const,
  highContrast: false,
  advancedFeatures: {
    calorieTracking: false,
    powerManagement: false,
    waterTracking: false,
  },
};

test.describe('Pet Support', () => {
  test.describe('Settings', () => {
    test.beforeEach(async ({ setupApp }) => {
      await setupApp();
    });

    test('should display pets stepper in household profile', async ({
      page,
    }) => {
      await navigateToSettingsSection(page, 'household');
      await expect(page.getByText('PROFILE · §2.1')).toBeVisible();
      await expect(page.getByText('PETS')).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Increase PETS/ }),
      ).toBeVisible();
    });

    test('should update pets count and persist value', async ({ page }) => {
      await navigateToSettingsSection(page, 'household');
      const inc = page.getByRole('button', { name: /Increase PETS/ });
      await inc.click(); // 0 → 1
      await inc.click(); // 1 → 2
      await waitForStoredData(page, (raw) => raw.includes('"pets":2'));

      await page.reload({ waitUntil: 'domcontentloaded' });
      await navigateToSettingsSection(page, 'household');
      // Scoped to the PETS row: a page-wide getByText('2') also matches the
      // default ADULTS value, so it passed whether or not pets persisted.
      const petsValue = page
        .getByRole('button', { name: /Decrease PETS/ })
        .locator('xpath=following-sibling::span[1]');
      await expect(petsValue).toHaveText(/2/);
    });
  });

  test.describe('Pets Category', () => {
    const seed = async (
      page: import('@playwright/test').Page,
      pets: number,
      items: ReturnType<typeof createMockInventoryItem>[] = [],
    ) => {
      await page.goto('/');
      await setAppStorage(
        page,
        createMockAppData({
          settings: v2Settings,
          household: {
            adults: 2,
            children: 0,
            pets,
            supplyDurationDays: 3,
            useFreezer: true,
          },
          items,
        }),
      );
      await page.reload({ waitUntil: 'domcontentloaded' });
    };

    test('should show the pets category tile on the dashboard when pets > 0', async ({
      page,
    }) => {
      await seed(page, 2);
      await expect(page.getByTestId('v2-category-pets')).toBeVisible();
    });

    test('should let user filter inventory to the pets category', async ({
      page,
    }) => {
      const petItem = createMockInventoryItem({
        name: 'Cat Food',
        categoryId: createCategoryId('pets'),
        quantity: createQuantity(5),
        unit: 'cans',
        neverExpires: true,
      });
      await seed(page, 1, [petItem]);

      await selectInventoryCategory(page, 'pets');
      await expect(page.getByText('Cat Food', { exact: true })).toBeVisible();
    });
  });

  test.describe('Onboarding with Pets', () => {
    test('should allow setting pets count during onboarding', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Welcome → Theme → Preset → Household
      await page.getByRole('button', { name: /CONTINUE →/ }).click(); // 1→2
      await page.getByRole('button', { name: /CONTINUE →/ }).click(); // 2→3
      await page.getByRole('button', { name: /CONTINUE →/ }).click(); // 3→4 (couple default)

      // Step 4 has PETS stepper.
      const inc = page.getByRole('button', { name: /Increase PETS/ });
      await expect(inc).toBeVisible();
      await inc.click();
      await inc.click();
      // The computed-targets aside re-renders; just verify we can continue.
      await page.getByRole('button', { name: /CONTINUE →/ }).click();
      await expect(page.getByText(/STEP 05 \/ 06/)).toBeVisible();

      // With pets on the profile, the checklist now offers pet supplies.
      await page.getByRole('button', { name: /CONTINUE →/ }).click();
      await expect(page.getByText(/STEP 06 \/ 06/)).toBeVisible();
      await page.getByTestId('v2-quick-setup-details').click();
      await expect(
        page.getByTestId(/^v2-quick-setup-item-pet-/).first(),
      ).toBeVisible();
    });
  });
});
