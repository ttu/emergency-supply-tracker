import { test, expect } from '@playwright/test';

test.describe('Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should export data', async ({ page }) => {
    // Add some test data first
    await page.click('text=Inventory');
    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Export Test Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '5');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '10');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Save")');

    // Navigate to Settings
    await page.click('text=Settings');

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click Export Data button
    await page.click('button:has-text("Export Data")');

    // Wait for download
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toMatch(
      /emergency-supplies-backup-\d{4}-\d{2}-\d{2}\.json/,
    );
  });

  test('should import data', async ({ page }) => {
    // Navigate to Settings
    await page.click('text=Settings');

    // Create test data file
    const testData = {
      items: [
        {
          id: 'test-1',
          name: 'Imported Item',
          category: 'food',
          quantity: 3,
          unit: 'pieces',
          recommendedQuantity: 5,
          neverExpires: true,
        },
      ],
      household: {
        adults: 2,
        children: 1,
        supplyDays: 3,
        hasFreezer: true,
      },
      settings: {
        language: 'en',
        theme: 'light',
      },
    };

    // Set file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(testData)),
    });

    // Confirm first dialog
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('replace all your current data');
      dialog.accept();
    });

    // Wait for import to complete
    await page.waitForTimeout(500);

    // Navigate to Inventory to verify import
    await page.click('text=Inventory');

    // Verify imported item is visible
    await expect(page.locator('text=Imported Item')).toBeVisible();
  });

  test('should export shopping list', async ({ page }) => {
    // Add item that needs restocking
    await page.click('text=Inventory');
    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Low Stock Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '2'); // Less than recommended
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '10');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Save")');

    // Navigate to Settings
    await page.click('text=Settings');

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click Export Shopping List button
    await page.click('button:has-text("Export Shopping List")');

    // Wait for download
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toMatch(
      /shopping-list-\d{4}-\d{2}-\d{2}\.txt/,
    );
  });

  test('should clear all data', async ({ page }) => {
    // Add some test data
    await page.click('text=Inventory');
    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Item to Clear');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '1');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Save")');

    // Verify item exists
    await expect(page.locator('text=Item to Clear')).toBeVisible();

    // Navigate to Settings
    await page.click('text=Settings');

    // Handle confirmation dialogs
    let dialogCount = 0;
    page.on('dialog', async (dialog) => {
      dialogCount++;
      await dialog.accept();
    });

    // Click Clear All Data button
    await page.click('button:has-text("Clear All Data")');

    // Wait for both confirmation dialogs
    await page.waitForTimeout(1000);

    // Expect two confirmation dialogs
    expect(dialogCount).toBe(2);

    // Navigate back to Inventory
    await page.click('text=Inventory');

    // Verify item is gone
    await expect(page.locator('text=Item to Clear')).not.toBeVisible();

    // Should show "No items found" message
    await expect(page.locator('text=No items')).toBeVisible();
  });
});
