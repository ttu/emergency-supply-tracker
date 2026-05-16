import {
  test,
  expect,
  setAppStorage,
  navigateToSettingsSection,
} from './fixtures';
import {
  createMockAppData,
  createMockInventoryItem,
} from '../src/shared/utils/test/factories';
import {
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '../src/shared/types';

/**
 * In design v2 the shopping-list export lives in Settings → Data & Backup
 * (not on the Dashboard). Tests pre-populate inventory via setAppStorage
 * because the v2 ItemForm has no template picker.
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
  items: ReturnType<typeof createMockInventoryItem>[],
) {
  await page.goto('/');
  await setAppStorage(page, createMockAppData({ settings: v2Settings, items }));
  await page.reload({ waitUntil: 'domcontentloaded' });
}

test.describe('Shopping List Export Formats', () => {
  test('should expose the export button in Settings → Data & Backup', async ({
    page,
  }) => {
    await seed(page, []);
    await navigateToSettingsSection(page, 'data');
    await expect(page.getByTestId('export-shopping-list-button')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should export shopping list as TXT when items need restocking', async ({
    page,
  }) => {
    // Rice template with quantity 0 → on the shopping list.
    await seed(page, [
      createMockInventoryItem({
        name: 'Rice',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'),
        quantity: createQuantity(0),
        unit: 'kilograms',
        neverExpires: true,
      }),
    ]);
    await navigateToSettingsSection(page, 'data');
    const exportButton = page.getByTestId('export-shopping-list-button');
    await expect(exportButton).toBeVisible({ timeout: 10000 });

    const downloadPromise = page
      .waitForEvent('download', { timeout: 5000 })
      .catch(() => null);
    await exportButton.click();
    const download = await downloadPromise;

    if (download) {
      const fileName = download.suggestedFilename();
      expect(fileName).toMatch(/\.txt$/i);
      expect(fileName).toMatch(/shopping-list/i);
      const path = await download.path();
      if (path) {
        const fs = await import('node:fs/promises');
        const content = await fs.readFile(path, 'utf-8');
        expect(content).toContain('Shopping List');
        expect(content).toMatch(/rice/i);
        expect(content).toContain('Generated');
      }
    }
  });

  test('should disable the export button when no items need restocking', async ({
    page,
  }) => {
    // Item with quantity well above recommended → nothing to buy.
    await seed(page, [
      createMockInventoryItem({
        name: 'Rice (stocked)',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'),
        quantity: createQuantity(999),
        unit: 'kilograms',
        neverExpires: true,
      }),
    ]);
    await navigateToSettingsSection(page, 'data');
    const exportButton = page.getByTestId('export-shopping-list-button');
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await expect(exportButton).toBeDisabled();
  });

  test('should include only items needing restocking in export', async ({
    page,
  }) => {
    await seed(page, [
      createMockInventoryItem({
        name: 'Rice',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'),
        quantity: createQuantity(0),
        unit: 'kilograms',
        neverExpires: true,
      }),
      createMockInventoryItem({
        name: 'Canned Fish',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('canned-fish'),
        quantity: createQuantity(999),
        unit: 'cans',
        neverExpires: true,
      }),
    ]);

    await navigateToSettingsSection(page, 'data');
    const exportButton = page.getByTestId('export-shopping-list-button');
    await expect(exportButton).toBeVisible({ timeout: 10000 });

    const downloadPromise = page
      .waitForEvent('download', { timeout: 5000 })
      .catch(() => null);
    await exportButton.click();
    const download = await downloadPromise;

    if (download) {
      const path = await download.path();
      if (path) {
        const fs = await import('node:fs/promises');
        const content = await fs.readFile(path, 'utf-8');
        expect(content).toMatch(/rice/i);
        expect(content).not.toMatch(/canned fish/i);
      }
    }
  });
});
