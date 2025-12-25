import { test, expect } from '@playwright/test';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should add item from template', async ({ page }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Click "Add from Template"
    await page.click('text=Add from Template');

    // Wait for template selector to appear
    await expect(page.locator('text=Select Template')).toBeVisible();

    // Search for water
    await page.fill('input[placeholder*="Search"]', 'water');

    // Wait for search results to filter
    await page.waitForTimeout(300);

    // Click on the first template that contains "water" (button.templateCard or button[type="button"])
    const waterTemplate = page
      .locator('button[type="button"]')
      .filter({ hasText: /water/i })
      .first();
    await waterTemplate.click();

    // Fill in the form
    await page.fill('input[name="quantity"]', '24');

    // Save the item
    await page.click('button[type="submit"]');

    // Verify item with "water" appears in inventory
    await expect(page.locator('text=/water/i').first()).toBeVisible();
  });

  test('should add custom item', async ({ page }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Click "Add Custom Item"
    await page.click('text=Add Custom Item');

    // Wait for form to appear
    await expect(page.locator('text=Add Item')).toBeVisible();

    // Fill in the form
    await page.fill('input[name="name"]', 'Custom Flashlight');
    await page.selectOption('select[name="category"]', 'tools-supplies');
    await page.fill('input[name="quantity"]', '2');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '3');
    await page.check('input[type="checkbox"]'); // Never Expires

    // Save the item
    await page.click('button[type="submit"]');

    // Verify item appears in inventory
    await expect(page.locator('text=Custom Flashlight')).toBeVisible();
  });

  test('should edit existing item', async ({ page }) => {
    // Navigate to Inventory and add an item first
    await page.click('text=Inventory');
    await page.click('text=Add Custom Item');

    await page.fill('input[name="name"]', 'Test Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '5');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '10');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Wait for item to appear and click on the card to edit
    await page.click('text=Test Item');

    // Wait for form to appear and update quantity
    await page.waitForSelector('input[name="quantity"]');
    await page.fill('input[name="quantity"]', '8');

    // Save changes
    await page.click('button[type="submit"]');

    // Verify changes are saved (item still visible)
    await expect(page.locator('text=Test Item')).toBeVisible();
  });

  test('should delete item', async ({ page }) => {
    // Navigate to Inventory and add an item first
    await page.click('text=Inventory');
    await page.click('text=Add Custom Item');

    await page.fill('input[name="name"]', 'Item to Delete');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '1');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Wait for item to appear and click on it to open edit mode
    await page.click('text=Item to Delete');

    // Wait for delete button to appear in the modal
    const deleteButton = page.locator('button', { hasText: 'Delete' });
    await expect(deleteButton).toBeVisible();

    // Set up dialog handler before clicking delete
    page.once('dialog', (dialog) => dialog.accept());

    // Click delete button
    await deleteButton.click();

    // Verify item is removed
    await expect(page.locator('text=Item to Delete')).not.toBeVisible();
  });

  test('should filter items by category', async ({ page }) => {
    // Navigate to Inventory and add items in different categories
    await page.click('text=Inventory');

    // Add food item
    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Food Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '1');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Food Item')).toBeVisible();

    // Add water item
    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Water Item');
    await page.selectOption('select[name="category"]', 'water-beverages');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'liters');
    await page.fill('input[name="recommendedQuantity"]', '1');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Water Item')).toBeVisible();

    // Filter by Food category
    await page.click('button:has-text("Food")');

    // Food item should be visible
    await expect(page.locator('text=Food Item')).toBeVisible();
    // Water item should not be visible
    await expect(page.locator('text=Water Item')).not.toBeVisible();

    // Click All to show all items again
    await page.click('button:has-text("All")');
    await expect(page.locator('text=Food Item')).toBeVisible();
    await expect(page.locator('text=Water Item')).toBeVisible();
  });

  test('should search items', async ({ page }) => {
    // Navigate to Inventory and add items
    await page.click('text=Inventory');

    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Searchable Item A');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '1');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Different Item B');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '1');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Search for "Searchable"
    await page.fill('input[placeholder*="Search"]', 'Searchable');

    // Only matching item should be visible
    await expect(page.locator('text=Searchable Item A')).toBeVisible();
    await expect(page.locator('text=Different Item B')).not.toBeVisible();

    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
    await expect(page.locator('text=Searchable Item A')).toBeVisible();
    await expect(page.locator('text=Different Item B')).toBeVisible();
  });
});
