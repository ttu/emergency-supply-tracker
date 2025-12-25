import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should navigate between pages', async ({ page }) => {
    // Start on Dashboard
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Navigate to Inventory
    await page.click('text=Inventory');
    await expect(
      page.locator('button:has-text("Add from Template")'),
    ).toBeVisible();

    // Navigate to Settings
    await page.click('text=Settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();

    // Navigate to Help
    await page.click('text=Help');
    await expect(
      page.locator('h1:has-text("Help"), h1:has-text("FAQ")'),
    ).toBeVisible();

    // Navigate back to Dashboard
    await page.click('text=Dashboard');
    await expect(
      page.locator('text=Quick Actions, text=Preparedness'),
    ).toBeVisible();
  });

  test('should show active navigation state', async ({ page }) => {
    // Dashboard should be active initially
    const dashboardNav = page.locator('nav button:has-text("Dashboard")');
    await expect(dashboardNav).toHaveAttribute('aria-current', 'page');

    // Navigate to Inventory
    await page.click('text=Inventory');
    const inventoryNav = page.locator('nav button:has-text("Inventory")');
    await expect(inventoryNav).toHaveAttribute('aria-current', 'page');
    await expect(dashboardNav).not.toHaveAttribute('aria-current', 'page');

    // Navigate to Settings
    await page.click('text=Settings');
    const settingsNav = page.locator('nav button:has-text("Settings")');
    await expect(settingsNav).toHaveAttribute('aria-current', 'page');
    await expect(inventoryNav).not.toHaveAttribute('aria-current', 'page');
  });

  test('should persist data across page navigation', async ({ page }) => {
    // Add item on Inventory page
    await page.click('text=Inventory');
    await page.click('text=Add Custom Item');
    await page.fill('input[name="name"]', 'Persistent Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.fill('input[name="recommendedQuantity"]', '1');
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Save")');

    // Navigate away to Settings
    await page.click('text=Settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();

    // Navigate back to Inventory
    await page.click('text=Inventory');

    // Verify item still exists
    await expect(page.locator('text=Persistent Item')).toBeVisible();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigation should still be visible and functional
    await expect(page.locator('nav')).toBeVisible();

    // Navigate to different pages
    await page.click('text=Inventory');
    await expect(
      page.locator('button:has-text("Add from Template")'),
    ).toBeVisible();

    await page.click('text=Settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  });
});
