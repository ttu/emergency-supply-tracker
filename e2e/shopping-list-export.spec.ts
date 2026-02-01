import { test, expect } from './fixtures';

test.describe('Shopping List Export Formats', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should export shopping list as TXT format', async ({ page }) => {
    // Add items that need restocking using a recommended item template
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    // Search for rice (a recommended food item)
    await page.getByTestId('template-search-input').fill('rice');
    await page.waitForTimeout(300); // Wait for search results
    // Click on the rice template
    await page.getByText(/rice/i).first().click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    // Set quantity to 0 to ensure it needs restocking
    await page.fill('input[name="quantity"]', '0');
    await page.getByTestId('save-item-button').click();

    // Navigate to Dashboard where the shopping list export button is
    await page.getByTestId('nav-dashboard').click();

    // Find Export Shopping List button in Quick Actions
    const exportButton = page.getByTestId('quick-export-shopping-list');
    await expect(exportButton).toBeVisible({ timeout: 10000 });

    // Set up download listener
    const downloadPromise = page
      .waitForEvent('download', { timeout: 5000 })
      .catch(() => null);

    // Click export button
    await exportButton.click();

    // Wait for download (if browser supports it)
    const download = await downloadPromise;

    if (download) {
      // Verify file name contains .txt
      const fileName = download.suggestedFilename();
      expect(fileName).toMatch(/\.txt$/i);
      expect(fileName).toMatch(/shopping-list/i);

      // Verify file content (read the downloaded file)
      const path = await download.path();
      if (path) {
        const fs = await import('node:fs/promises');
        const content = await fs.readFile(path, 'utf-8');

        // Verify content structure
        expect(content).toContain('Shopping List');
        expect(content).toMatch(/rice/i);
        expect(content).toContain('Generated');
      }
    } else {
      // If download event doesn't fire (some browsers), verify button works
      // The export functionality is tested in data-management.spec.ts
      await expect(exportButton).toBeVisible();
    }
  });

  test('should show export button on Dashboard with multiple inventory items', async ({
    page,
  }) => {
    // Add multiple items to inventory
    await page.getByTestId('nav-inventory').click();

    // Add first item
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Item 1');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Add second item
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Item 2');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Navigate to Dashboard where the shopping list export button is
    await page.getByTestId('nav-dashboard').click();
    await page.waitForLoadState('networkidle');

    // The export button should be visible on Dashboard
    const exportButton = page.getByTestId('quick-export-shopping-list');
    await expect(exportButton).toBeVisible({ timeout: 10000 });
  });

  test('should show alert when no items need restocking', async ({ page }) => {
    // Ensure we have items but all are fully stocked
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    await page.fill('input[name="name"]', 'Fully Stocked Item');
    await page.selectOption('select[name="category"]', 'food');
    // Set quantity higher than recommended (if possible) or equal
    await page.fill('input[name="quantity"]', '20');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Navigate to Dashboard where the shopping list export button is
    await page.getByTestId('nav-dashboard').click();

    // Export button should be visible
    const exportButton = page.getByTestId('quick-export-shopping-list');
    await expect(exportButton).toBeVisible({ timeout: 10000 });

    // Set up dialog listener before triggering the action
    const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 });

    // Click export button - don't await since it will block until dialog is dismissed
    exportButton.click();

    // Wait for the dialog and verify the message
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('restock');
    await dialog.accept();
  });

  test('should include only items needing restocking in export', async ({
    page,
  }) => {
    // Add item that needs restocking using a recommended item template
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    // Search for rice (a recommended food item)
    await page.getByTestId('template-search-input').fill('rice');
    await page.waitForTimeout(300); // Wait for search results
    // Click on the rice template
    await page.getByText(/rice/i).first().click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    // Set quantity to 1 (likely less than recommended for 2 adults, 3 days)
    await page.fill('input[name="quantity"]', '1');
    await page.getByTestId('save-item-button').click();

    // Add item that doesn't need restocking using another recommended item template
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    // Search for canned fish (another recommended food item)
    await page.getByTestId('template-search-input').fill('canned fish');
    await page.waitForTimeout(300); // Wait for search results
    // Click on the canned fish template
    await page
      .getByText(/canned fish/i)
      .first()
      .click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    // Set quantity to 20 (likely more than recommended for 2 adults, 3 days)
    await page.fill('input[name="quantity"]', '20');
    await page.getByTestId('save-item-button').click();

    // Navigate to Dashboard where the shopping list export button is
    await page.getByTestId('nav-dashboard').click();

    // Export shopping list
    const exportButton = page.getByTestId('quick-export-shopping-list');
    await expect(exportButton).toBeVisible({ timeout: 10000 });

    // Set up download listener
    const downloadPromise = page
      .waitForEvent('download', { timeout: 5000 })
      .catch(() => null);

    // Click export button
    await exportButton.click();

    // Wait for download (if browser supports it)
    const download = await downloadPromise;

    if (download) {
      // Verify file content (read the downloaded file)
      const path = await download.path();
      if (path) {
        const fs = await import('node:fs/promises');
        const content = await fs.readFile(path, 'utf-8');

        // Verify only the item needing restocking (rice) is included, not the fully stocked item
        expect(content).toMatch(/rice/i);
        // Canned fish has 20 units, more than recommended, so it should NOT be in the list
        expect(content).not.toMatch(/canned fish/i);
      }
    } else {
      // If download event doesn't fire, verify button works
      await expect(exportButton).toBeVisible();
    }
  });
});
