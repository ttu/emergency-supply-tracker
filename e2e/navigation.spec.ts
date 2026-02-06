import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should navigate between pages', async ({ page }) => {
    // Start on Dashboard
    await expect(page.getByTestId('page-dashboard')).toBeVisible();

    // Navigate to Inventory
    await page.getByTestId('nav-inventory').click();
    await expect(page.getByTestId('add-item-button')).toBeVisible();

    // Navigate to Settings
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('page-settings')).toBeVisible();

    // Navigate to Help
    await page.getByTestId('nav-help').click();
    await expect(page.getByTestId('page-help')).toBeVisible();

    // Navigate back to Dashboard
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('quick-actions')).toBeVisible();
  });

  test('should show active navigation state', async ({ page }) => {
    // Dashboard should be active initially
    const dashboardNav = page.getByTestId('nav-dashboard');
    await expect(dashboardNav).toHaveAttribute('aria-current', 'page');

    // Navigate to Inventory
    await page.getByTestId('nav-inventory').click();
    const inventoryNav = page.getByTestId('nav-inventory');
    await expect(inventoryNav).toHaveAttribute('aria-current', 'page');
    await expect(dashboardNav).not.toHaveAttribute('aria-current', 'page');

    // Navigate to Settings
    await page.getByTestId('nav-settings').click();
    const settingsNav = page.getByTestId('nav-settings');
    await expect(settingsNav).toHaveAttribute('aria-current', 'page');
    await expect(inventoryNav).not.toHaveAttribute('aria-current', 'page');
  });

  test('should persist data across page navigation', async ({ page }) => {
    // Add item on Inventory page
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Persistent Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.getByTestId('never-expires-checkbox').check();
    await page.getByTestId('save-item-button').click();

    // Navigate away to Settings
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('page-settings')).toBeVisible();

    // Navigate back to Inventory
    await page.getByTestId('nav-inventory').click();

    // Verify item still exists
    // Use getByRole to target item card button specifically
    await expect(
      page.getByRole('button', { name: /Persistent Item/i }),
    ).toBeVisible();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigation should still be visible and functional
    await expect(page.locator('nav')).toBeVisible();

    // Navigate to different pages
    await page.getByTestId('nav-inventory').click();
    await expect(page.getByTestId('add-item-button')).toBeVisible();

    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('page-settings')).toBeVisible();
  });
});
