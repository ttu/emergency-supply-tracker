import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display dashboard page', async ({ page }) => {
    // Verify dashboard title is visible
    await expect(
      page.locator('h1:has-text("Dashboard"), text=Dashboard'),
    ).toBeVisible();

    // Verify quick actions section
    await expect(page.locator('text=Quick Actions')).toBeVisible();

    // Verify categories overview
    await expect(page.locator('text=Categories, text=Overview')).toBeVisible();
  });

  test('should show category cards', async ({ page }) => {
    // Verify at least some standard categories are shown
    await expect(
      page.locator('text=Food, text=Water, text=First Aid').first(),
    ).toBeVisible();
  });

  test('should navigate to inventory from quick action', async ({ page }) => {
    // Click "Add Items" or "View Inventory" quick action
    const addItemsButton = page.locator(
      'button:has-text("Add Items"), button:has-text("View Inventory")',
    );
    await addItemsButton.first().click();

    // Should navigate to Inventory page
    await expect(
      page.locator('button:has-text("Add from Template")'),
    ).toBeVisible();
  });

  test('should update dashboard when items are added', async ({ page }) => {
    // Navigate to Inventory and add an item
    await page.click('text=Inventory');
    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Test Food Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '10');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '5');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Save")');

    // Navigate back to Dashboard
    await page.click('text=Dashboard');

    // The Food category should show some status (not empty)
    const foodCategory = page.locator('text=Food').first();
    await expect(foodCategory).toBeVisible();
  });

  test('should show alerts when items need attention', async ({ page }) => {
    // Add item with low quantity
    await page.click('text=Inventory');
    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Low Stock Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1'); // Low quantity
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '20'); // High recommended
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Save")');

    // Navigate to Dashboard
    await page.click('text=Dashboard');

    // Should show alerts section
    await expect(page.locator('text=Alerts, text=Alert')).toBeVisible();
  });
});
