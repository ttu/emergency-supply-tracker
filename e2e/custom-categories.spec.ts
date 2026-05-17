import {
  test,
  expect,
  setAppStorage,
  navigateToSettingsSection,
} from './fixtures';
import {
  createMockAppData,
  createMockCategory,
  createMockInventoryItem,
} from '../src/shared/utils/test/factories';
import { createCategoryId, createQuantity } from '../src/shared/types';

/**
 * Design v2 manages custom categories under Settings → Categories (§8).
 * The v1 sidemenu category list is gone — categories surface in the
 * CoverageMatrix tiles and the inventory filter-strip <select>.
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

async function seed(
  page: import('@playwright/test').Page,
  extra: {
    customCategories?: ReturnType<typeof createMockCategory>[];
    items?: ReturnType<typeof createMockInventoryItem>[];
  } = {},
) {
  await page.goto('/');
  await setAppStorage(
    page,
    createMockAppData({
      settings: v2Settings,
      customCategories: extra.customCategories ?? [],
      items: extra.items ?? [],
    }),
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
}

test.describe('Custom Categories', () => {
  test('should render the Categories section in Settings', async ({ page }) => {
    await seed(page);
    await navigateToSettingsSection(page, 'categories');
    await expect(page.getByText('§8', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'CATEGORIES', exact: true }),
    ).toBeVisible();
  });

  test('should show a custom category tile on the dashboard when seeded', async ({
    page,
  }) => {
    const custom = createMockCategory({
      id: createCategoryId('custom-x'),
      name: 'Custom X',
    });
    await seed(page, { customCategories: [custom] });

    await expect(page.getByTestId('v2-category-custom-x')).toBeVisible();
  });

  test('custom category appears as an option in the inventory filter', async ({
    page,
  }) => {
    const custom = createMockCategory({
      id: createCategoryId('garden'),
      name: 'Garden',
    });
    await seed(page, { customCategories: [custom] });

    await page.getByTestId('v2-nav-inv').click();
    await expect(page.getByRole('option', { name: 'Garden' })).toBeAttached();
  });

  test('items in a custom category show in inventory when filtered', async ({
    page,
  }) => {
    const custom = createMockCategory({
      id: createCategoryId('garden'),
      name: 'Garden',
    });
    const item = createMockInventoryItem({
      name: 'Seeds',
      categoryId: createCategoryId('garden'),
      quantity: createQuantity(10),
      unit: 'pieces',
      neverExpires: true,
    });
    await seed(page, { customCategories: [custom], items: [item] });

    await page.getByTestId('v2-nav-inv').click();
    await page
      .getByRole('combobox', { name: /category/i })
      .first()
      .selectOption('garden');
    await expect(
      page.getByText('Seeds', { exact: true }).first(),
    ).toBeVisible();
  });
});
