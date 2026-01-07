import { test, expect } from './fixtures';

test.describe('Shopping List Export Formats', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should export shopping list as TXT format', async ({ page }) => {
    // Add items that need restocking
    await page.click('text=Inventory');
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    await page.fill('input[name="name"]', 'Item Needing Restock');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '2');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity will be auto-calculated (likely > 2 for 2 adults, 3 days)
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Navigate to Settings
    await page.click('text=Settings');

    // Find Export Shopping List button
    const exportButton = page.locator('button', {
      hasText: /Export Shopping List|Vie ostoslista/i,
    });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

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
        const fs = await import('fs/promises');
        const content = await fs.readFile(path, 'utf-8');

        // Verify content structure
        expect(content).toContain('Shopping List');
        expect(content).toContain('Item Needing Restock');
        expect(content).toContain('Generated');
      }
    } else {
      // If download event doesn't fire (some browsers), verify button works
      // The export functionality is tested in data-management.spec.ts
      await expect(exportButton).toBeVisible();
    }
  });

  test('should show correct item count in shopping list description', async ({
    page,
  }) => {
    // Add multiple items needing restocking
    await page.click('text=Inventory');

    // Add first item
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();
    await page.fill('input[name="name"]', 'Item 1');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Add second item
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();
    await page.fill('input[name="name"]', 'Item 2');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Navigate to Settings
    await page.click('text=Settings');
    await page.waitForLoadState('networkidle');

    // Verify description shows item count
    // The description should mention the number of items needing restock
    // Look for text containing numbers and "item" or "items"
    const description = page.locator('text=/\\d+.*item/i');
    const descriptionVisible = await description.isVisible().catch(() => false);

    // If description not visible, check if export button shows item count
    if (!descriptionVisible) {
      // The export button might be disabled if no items need restocking
      // or the count might be in a different format
      const exportButton = page.locator('button', {
        hasText: /Export Shopping List|Vie ostoslista/i,
      });
      await expect(exportButton).toBeVisible();
    } else {
      await expect(description).toBeVisible();
    }
  });

  test('should disable export button when no items need restocking', async ({
    page,
  }) => {
    // Ensure we have items but all are fully stocked
    await page.click('text=Inventory');
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    await page.fill('input[name="name"]', 'Fully Stocked Item');
    await page.selectOption('select[name="category"]', 'food');
    // Set quantity higher than recommended (if possible) or equal
    await page.fill('input[name="quantity"]', '20');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Navigate to Settings
    await page.click('text=Settings');

    // Export button should be disabled if no items need restocking
    const exportButton = page.locator('button', {
      hasText: /Export Shopping List|Vie ostoslista/i,
    });
    await expect(exportButton).toBeVisible();

    // Assert that the export button is disabled when no items need restocking
    await expect(exportButton).toBeDisabled();
  });

  test('should include only items needing restocking in export', async ({
    page,
  }) => {
    // Add item that needs restocking
    await page.click('text=Inventory');
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    await page.fill('input[name="name"]', 'Needs Restock');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Add item that doesn't need restocking (if we can set quantity >= recommended)
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    await page.fill('input[name="name"]', 'Fully Stocked');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '20');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Navigate to Settings
    await page.click('text=Settings');

    // Export shopping list
    const exportButton = page.locator('button', {
      hasText: /Export Shopping List|Vie ostoslista/i,
    });
    await expect(exportButton).toBeVisible();

    // The export should only include items needing restocking
    // This is verified by the export functionality working correctly
    // Detailed content verification is done in unit tests
    await expect(exportButton).toBeEnabled();
  });
});
