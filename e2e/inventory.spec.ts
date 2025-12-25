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
    await page.fill('input[placeholder*="Search"]', 'Bottled Water');

    // Click on the Bottled Water template
    await page.click('text=Bottled Water');

    // Fill in the form
    await page.fill('input[name="quantity"]', '24');

    // Save the item
    await page.click('button:has-text("Save")');

    // Verify item appears in inventory
    await expect(page.locator('text=Bottled Water')).toBeVisible();
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
    await page.selectOption('select[name="category"]', 'tools-safety');
    await page.fill('input[name="quantity"]', '2');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '3');
    await page.check('input[type="checkbox"]'); // Never Expires

    // Save the item
    await page.click('button:has-text("Save")');

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
    await page.click('button:has-text("Save")');

    // Wait for item to appear
    await expect(page.locator('text=Test Item')).toBeVisible();

    // Click edit button on the item card
    await page.click('[aria-label="Edit Test Item"], button:has-text("Edit")');

    // Update quantity
    await page.fill('input[name="quantity"]', '8');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify changes are saved (item still visible)
    await expect(page.locator('text=Test Item')).toBeVisible();
  });

  test('should delete item', async ({ page }) => {
    // Navigate to Inventory and add an item first
    await page.click('text=Inventory');
    await page.click('text=Add Custom Item');

    await page.fill('input[name="name"]', 'Item to Delete');
    await page.selectOption('select[name="category"]', 'other');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '1');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Save")');

    // Wait for item to appear
    await expect(page.locator('text=Item to Delete')).toBeVisible();

    // Click delete button
    await page.click(
      '[aria-label="Delete Item to Delete"], button:has-text("Delete")',
    );

    // Confirm deletion
    page.once('dialog', (dialog) => dialog.accept());

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
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Food Item')).toBeVisible();

    // Add water item
    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Water Item');
    await page.selectOption('select[name="category"]', 'water');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'liters');
    await page.fill('input[name="recommendedQuantity"]', '1');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Save")');

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
    await page.click('button:has-text("Save")');

    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Different Item B');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '1');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Save")');

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
