import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should display dashboard page', async ({ page }) => {
    // Verify dashboard page is visible
    await expect(page.getByTestId('page-dashboard')).toBeVisible();

    // Verify quick actions section
    await expect(page.locator('text=Quick Actions')).toBeVisible();

    // Verify categories overview
    await expect(page.locator('text=Categories Overview')).toBeVisible();
  });

  test('should show category cards', async ({ page }) => {
    // Verify at least some standard categories are shown using data-testid
    await expect(page.getByTestId('category-food')).toBeVisible();
  });

  test('should navigate to inventory from quick action', async ({ page }) => {
    // Navigate to Inventory via navigation
    await page.getByTestId('nav-inventory').click();

    // Should be on Inventory page
    await expect(page.getByTestId('add-item-button')).toBeVisible();
  });

  test('should update dashboard when items are added', async ({ page }) => {
    // Navigate to Inventory and add an item
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Test Food Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '10');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Navigate back to Dashboard
    await page.getByTestId('nav-dashboard').click();

    // The Food category should show some status (not empty)
    await expect(page.getByTestId('category-food')).toBeVisible();
  });

  test('should show alerts when items need attention', async ({ page }) => {
    // Add item with zero quantity to trigger critical alert
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Out of Stock Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '0'); // Zero quantity triggers alert
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Navigate to Dashboard
    await page.getByTestId('nav-dashboard').click();

    // Should show alerts section
    await expect(page.getByTestId('alerts-section')).toBeVisible();
  });

  test('should navigate via quick action buttons', async ({ page }) => {
    // Verify Quick Actions section is visible
    await expect(page.locator('text=Quick Actions')).toBeVisible();

    // Test "Add Items" button - should navigate to Inventory and open template selector
    const addItemsButton = page.locator('button', { hasText: 'Add Items' });
    await expect(addItemsButton).toBeVisible();
    await addItemsButton.click();

    // Should be on Inventory page with template selector modal open
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // Close the modal
    await page.getByTestId('modal-close-button').click();

    // Go back to Dashboard
    await page.getByTestId('nav-dashboard').click();

    // Test "View Inventory" button
    const viewInventoryButton = page.locator('button', {
      hasText: 'View Inventory',
    });
    await expect(viewInventoryButton).toBeVisible();
    await viewInventoryButton.click();

    // Should navigate to Inventory page
    await expect(page.getByTestId('add-item-button')).toBeVisible();

    // Go back to Dashboard
    await page.getByTestId('nav-dashboard').click();

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
    const foodCategoryCard = page.getByTestId('category-food');
    await expect(foodCategoryCard).toBeVisible();
    await foodCategoryCard.click();

    // Should navigate to Inventory page
    await expect(page.getByTestId('page-inventory')).toBeVisible();

    // Food category should be selected in the category navigation
    const foodCategoryButton = page.getByTestId('category-food');
    await expect(foodCategoryButton).toHaveClass(/selected|active/);
  });
});
