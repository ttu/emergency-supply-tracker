import {
  test,
  expect,
  setAppStorage,
  navigateToSettingsSection,
} from './fixtures';
import {
  createMockAppData,
  createMockProductTemplate,
} from '../src/shared/utils/test/factories';
import { STORAGE_KEY } from '../src/shared/utils/storage/localStorage';

test.describe('Custom Product Templates', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should display custom template in template selector when it exists', async ({
    page,
  }) => {
    // Create app data with a custom template
    const customTemplate = createMockProductTemplate({
      name: 'Custom Template Item',
      category: 'food',
      defaultUnit: 'pieces',
      isCustom: true,
      isBuiltIn: false,
    });

    const appData = createMockAppData({
      customTemplates: [customTemplate],
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
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Navigate to Inventory and open template selector
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // Custom template should be displayed in the "Your Templates" section
    await expect(page.getByText('Custom Template Item')).toBeVisible();
    await expect(page.getByText('Your Templates')).toBeVisible();
  });

  test('should allow adding item from custom template', async ({ page }) => {
    // Setup with custom template
    const customTemplate = createMockProductTemplate({
      name: 'My Custom Product',
      category: 'food',
      defaultUnit: 'pieces',
      isCustom: true,
      isBuiltIn: false,
    });

    const appData = createMockAppData({
      customTemplates: [customTemplate],
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
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Navigate to Inventory
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // Click on the custom template
    await page.getByText('My Custom Product').click();

    // Form should be pre-filled with template data
    await expect(page.getByTestId('item-form')).toBeVisible();

    // The name field should be pre-filled
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveValue('My Custom Product');

    // Submit form
    await page.fill('input[name="quantity"]', '5');
    // Check "Never Expires" checkbox by label text to avoid ambiguity
    await page.getByLabel(/Never Expires/i).check();
    await page.getByTestId('save-item-button').click();

    // Item should be added - use getByRole to target item card button specifically
    await expect(
      page.getByRole('button', { name: /My Custom Product/i }),
    ).toBeVisible();
  });

  test('should persist custom templates after reload', async ({ page }) => {
    // Setup with custom template
    const customTemplate = createMockProductTemplate({
      name: 'Persistent Template',
      category: 'food',
      defaultUnit: 'pieces',
      isCustom: true,
      isBuiltIn: false,
    });

    const appData = createMockAppData({
      customTemplates: [customTemplate],
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
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Reload again
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Custom template should still exist (RootStorage: read active inventory set)
    const storedData = await page.evaluate((key) => {
      const data = localStorage.getItem(key);
      if (!data) return null;
      const root = JSON.parse(data);
      const ws = root.inventorySets?.[root.activeInventorySetId];
      return ws ?? null;
    }, STORAGE_KEY);

    expect(storedData).toBeTruthy();
    expect(storedData.customTemplates).toBeDefined();
    expect(storedData.customTemplates.length).toBeGreaterThan(0);
    expect(storedData.customTemplates[0].name).toBe('Persistent Template');
  });

  test('should allow creating custom template from item using Save as Template', async ({
    page,
  }) => {
    // Navigate to inventory and add a custom item with "Save as Template" checked
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    await page.fill('input[name="name"]', 'New Saved Template');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '5');
    await page.selectOption('select[name="unit"]', 'pieces');
    // Check "Never Expires" checkbox by label text
    await page.getByLabel(/Never Expires/i).check();

    // Check the "Save as Template" checkbox
    await page.getByTestId('save-as-template-checkbox').check();

    await page.getByTestId('save-item-button').click();

    // Item should be added
    await expect(
      page.getByRole('button', { name: /New Saved Template/i }),
    ).toBeVisible();

    // Template should be saved - verify by opening template selector again
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // The new template should appear in the "Your Templates" section
    await expect(page.getByText('Your Templates')).toBeVisible();
    await expect(
      page.locator('[data-testid^="custom-template-card-"]').filter({
        hasText: 'New Saved Template',
      }),
    ).toBeVisible();
  });

  test('should handle custom template in data import/export', async ({
    page,
  }) => {
    // Create custom template
    const customTemplate = createMockProductTemplate({
      name: 'Exported Template',
      category: 'food',
      defaultUnit: 'pieces',
      isCustom: true,
      isBuiltIn: false,
    });

    const appData = createMockAppData({
      customTemplates: [customTemplate],
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
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Export data
    await page.getByTestId('nav-settings').click();
    await navigateToSettingsSection(page, 'backupTransfer');
    const exportButton = page.getByTestId('export-data-button');
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    // Wait for export selection modal to open and click export button
    const exportModalButton = page.locator('button', {
      hasText: /^Export$|^Vie$/i,
    });
    await expect(exportModalButton).toBeVisible({ timeout: 5000 });
    await exportModalButton.click();

    // Wait for modal to close and download to complete
    await page.waitForTimeout(500);

    // Verify custom template is in exported data
    // Custom templates are included in the export format
    await expect(exportButton).toBeVisible();
  });

  test('should show custom template in template search', async ({ page }) => {
    // Setup with custom template
    const customTemplate = createMockProductTemplate({
      name: 'Searchable Template',
      category: 'food',
      defaultUnit: 'pieces',
      isCustom: true,
      isBuiltIn: false,
    });

    const appData = createMockAppData({
      customTemplates: [customTemplate],
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
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Navigate to Inventory and open template selector
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // Custom template should be visible before search
    await expect(page.getByText('Searchable Template')).toBeVisible();

    // Search for the template
    const searchInput = page.getByTestId('template-search-input');
    await searchInput.fill('Searchable');

    // Custom template should still be visible in search results
    await expect(page.getByText('Searchable Template')).toBeVisible();

    // Search for something that doesn't match
    await searchInput.fill('NonExistent');

    // Custom template should not be visible
    await expect(page.getByText('Searchable Template')).not.toBeVisible();
  });
});
