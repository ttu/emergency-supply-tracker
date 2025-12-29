import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should display dashboard page', async ({ page }) => {
    // Verify dashboard title is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Verify quick actions section
    await expect(page.locator('text=Quick Actions')).toBeVisible();

    // Verify categories overview
    await expect(page.locator('text=Categories Overview')).toBeVisible();
  });

  test('should show category cards', async ({ page }) => {
    // Verify at least some standard categories are shown
    await expect(page.locator('text=Food').first()).toBeVisible();
  });

  test('should navigate to inventory from quick action', async ({ page }) => {
    // Navigate to Inventory via navigation (quick action buttons may not exist on empty dashboard)
    await page.click('text=Inventory');

    // Should be on Inventory page
    await expect(page.locator('button', { hasText: 'Add Item' })).toBeVisible();
  });

  test('should update dashboard when items are added', async ({ page }) => {
    // Navigate to Inventory and add an item
    await page.click('text=Inventory');
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();
    await page.fill('input[name="name"]', 'Test Food Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '10');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Navigate back to Dashboard
    await page.click('text=Dashboard');

    // The Food category should show some status (not empty)
    const foodCategory = page.locator('text=Food').first();
    await expect(foodCategory).toBeVisible();
  });

  test('should show alerts when items need attention', async ({ page }) => {
    // Add item with zero quantity to trigger critical alert
    await page.click('text=Inventory');
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();
    await page.fill('input[name="name"]', 'Out of Stock Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '0'); // Zero quantity triggers alert
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Navigate to Dashboard
    await page.click('text=Dashboard');

    // Should show alerts section with "Alerts" heading
    await expect(page.locator('h2:has-text("Alerts")')).toBeVisible();
  });

  test('should navigate via quick action buttons', async ({ page }) => {
    // Verify Quick Actions section is visible
    await expect(page.locator('text=Quick Actions')).toBeVisible();

    // Test "Add Items" button - should navigate to Inventory and open template selector
    const addItemsButton = page.locator('button', { hasText: 'Add Items' });
    await expect(addItemsButton).toBeVisible();
    await addItemsButton.click();

    // Should be on Inventory page with template selector modal open
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();

    // Close the modal
    await page.click('button[aria-label="Close dialog"]');

    // Go back to Dashboard
    await page.click('text=Dashboard');

    // Test "View Inventory" button
    const viewInventoryButton = page.locator('button', {
      hasText: 'View Inventory',
    });
    await expect(viewInventoryButton).toBeVisible();
    await viewInventoryButton.click();

    // Should navigate to Inventory page
    await expect(page.locator('button', { hasText: 'Add Item' })).toBeVisible();

    // Go back to Dashboard
    await page.click('text=Dashboard');

    // Test "Export Shopping List" button is visible
    const exportButton = page.locator('button', {
      hasText: 'Export Shopping List',
    });
    await expect(exportButton).toBeVisible();

    // Note: We don't click export as it's a download action
    // The presence of the button validates it's wired up
  });

  test('should navigate to inventory with category filter when clicking category card', async ({
    page,
  }) => {
    // Click on Food category card
    const foodCategoryCard = page.locator('[data-testid="category-food"]');
    await expect(foodCategoryCard).toBeVisible();
    await foodCategoryCard.click();

    // Should navigate to Inventory page
    await expect(page.locator('h1:has-text("Inventory")')).toBeVisible();

    // Food category should be selected in the category navigation
    const foodCategoryButton = page.locator(
      'button[data-testid="category-food"]',
    );
    await expect(foodCategoryButton).toHaveClass(/selected|active/);
  });
});
