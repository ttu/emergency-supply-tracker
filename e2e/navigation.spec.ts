import { test, expect, startAddCustomItem } from './fixtures';

test.describe('Navigation', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should navigate between pages', async ({ page }) => {
    // Start on Dashboard (Overview)
    await expect(page.getByText('READINESS').first()).toBeVisible();

    // Navigate to Inventory
    await page.getByTestId('v2-nav-inv').click();
    await expect(page.getByRole('button', { name: '+ ADD' })).toBeVisible();

    // Navigate to Settings
    await page.getByTestId('v2-nav-settings').click();
    await expect(page.getByText('SYSTEM CONFIGURATION')).toBeVisible();

    // Navigate to Help (Guide)
    await page.getByTestId('v2-nav-help').click();
    await expect(page.getByText('CIVIL PREPAREDNESS · BASELINE')).toBeVisible();

    // Navigate back to Dashboard
    await page.getByTestId('v2-nav-home').click();
    await expect(page.getByText('READINESS').first()).toBeVisible();
  });

  test('should show active navigation state', async ({ page }) => {
    // Dashboard (home) should be active initially
    const home = page.getByTestId('v2-nav-home');
    await expect(home).toHaveAttribute('aria-current', 'page');

    // Navigate to Inventory
    await page.getByTestId('v2-nav-inv').click();
    const inv = page.getByTestId('v2-nav-inv');
    await expect(inv).toHaveAttribute('aria-current', 'page');
    await expect(home).not.toHaveAttribute('aria-current', 'page');

    // Navigate to Settings
    await page.getByTestId('v2-nav-settings').click();
    const settings = page.getByTestId('v2-nav-settings');
    await expect(settings).toHaveAttribute('aria-current', 'page');
    await expect(inv).not.toHaveAttribute('aria-current', 'page');
  });

  test('should persist data across page navigation', async ({ page }) => {
    // Add an item from Inventory via the v2 + ADD button (inline detail view)
    await page.getByTestId('v2-nav-inv').click();
    await startAddCustomItem(page);
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Persistent Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    // "Never expires" is required when no expiry date is set.
    await page.getByLabel(/never expires/i).check();
    await page.getByTestId('save-item-button').click();

    // After save, ItemDetail returns to the inventory list.
    await expect(page.getByRole('button', { name: '+ ADD' })).toBeVisible();

    // Navigate away to Settings
    await page.getByTestId('v2-nav-settings').click();
    await expect(page.getByText('SYSTEM CONFIGURATION')).toBeVisible();

    // Navigate back to Inventory and verify the item persisted
    await page.getByTestId('v2-nav-inv').click();
    // Match the inventory row (a button), not the notification toast.
    await expect(
      page.getByRole('button', { name: /Persistent Item/ }),
    ).toBeVisible();
  });

  test('should work on mobile viewport', async ({ page, setupApp }) => {
    // Re-run setup at mobile size so the MobileShell mounts from the start.
    await page.setViewportSize({ width: 375, height: 667 });
    await setupApp();

    await page.getByTestId('v2-nav-inv').click();
    // Label is theme-dependent: "+ ADD" (cockpit), "+ ADD ITEM" (civil),
    // "+ Add item" (pantry).
    await expect(page.getByRole('button', { name: /^\+ ADD/i })).toBeVisible();

    await page.getByTestId('v2-nav-settings').click();
    await expect(page.getByText(/SYSTEM CONFIGURATION|Settings/)).toBeVisible();
  });
});
