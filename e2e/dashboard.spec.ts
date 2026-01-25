import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should display dashboard page', async ({ page }) => {
    // Verify dashboard page is visible
    await expect(page.getByTestId('page-dashboard')).toBeVisible();

    // Verify quick actions section
    await expect(page.getByTestId('quick-actions')).toBeVisible();

    // Verify categories overview
    await expect(page.getByTestId('categories-overview')).toBeVisible();
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
    await expect(page.getByTestId('quick-actions')).toBeVisible();

    // Test "Add Items" button - should navigate to Inventory and open template selector
    await expect(page.getByTestId('quick-add-items')).toBeVisible();
    await page.getByTestId('quick-add-items').click();

    // Should be on Inventory page with template selector modal open
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // Close the modal
    await page.getByTestId('modal-close-button').click();

    // Go back to Dashboard
    await page.getByTestId('nav-dashboard').click();

    // Test "View Inventory" button
    await expect(page.getByTestId('quick-view-inventory')).toBeVisible();
    await page.getByTestId('quick-view-inventory').click();

    // Should navigate to Inventory page
    await expect(page.getByTestId('add-item-button')).toBeVisible();

    // Go back to Dashboard
    await page.getByTestId('nav-dashboard').click();

    // Test "Export Shopping List" button is visible
    await expect(page.getByTestId('quick-export-shopping-list')).toBeVisible();

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

    // Scope to active container to avoid strict mode violations
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width < 768;
    const menuContainer = isMobile
      ? page.getByTestId('sidemenu-drawer')
      : page.getByTestId('sidemenu-sidebar');
    const foodCategoryMenuItem =
      menuContainer.getByTestId('sidemenu-item-food');
    await expect(foodCategoryMenuItem).toHaveClass(/selected|active/);
  });

  test('should navigate to inventory with category filter on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Click on Food category card
    const foodCategoryCard = page.getByTestId('category-food');
    await expect(foodCategoryCard).toBeVisible();
    await foodCategoryCard.click();

    // Should navigate to Inventory page
    await expect(page.getByTestId('page-inventory')).toBeVisible();

    // On mobile, open hamburger to access drawer
    const hamburger = page.getByTestId('sidemenu-hamburger');
    if (await hamburger.isVisible().catch(() => false)) {
      await hamburger.click();
      await page.waitForTimeout(300);
    }
    const menuContainer = page.getByTestId('sidemenu-drawer');
    const foodCategoryMenuItem =
      menuContainer.getByTestId('sidemenu-item-food');
    await expect(foodCategoryMenuItem).toHaveClass(/selected|active/);
  });
});
