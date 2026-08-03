import { test, expect, startAddCustomItem } from './fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should display the v2 dashboard with hero + KPI row + matrix', async ({
    page,
  }) => {
    // Cockpit voice: "HOUSEHOLD STATUS" is the hero title, "READINESS" is the
    // first KPI caption, "COVERAGE MATRIX" is the matrix caption.
    await expect(page.getByText('HOUSEHOLD STATUS')).toBeVisible();
    await expect(page.getByText('READINESS').first()).toBeVisible();
    await expect(page.getByText(/COVERAGE MATRIX/)).toBeVisible();
  });

  test('should show a tile per category in the coverage matrix', async ({
    page,
  }) => {
    await expect(page.getByTestId('v2-category-food')).toBeVisible();
    await expect(page.getByTestId('v2-category-water-beverages')).toBeVisible();
  });

  test('should navigate to inventory from the nav', async ({ page }) => {
    await page.getByTestId('v2-nav-inv').click();
    await expect(page.getByRole('button', { name: '+ ADD' })).toBeVisible();
  });

  test('should update dashboard when items are added', async ({ page }) => {
    // Add an item from Inventory via the inline + ADD flow.
    await page.getByTestId('v2-nav-inv').click();
    await startAddCustomItem(page);
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Test Food Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '10');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.getByLabel(/never expires/i).check();
    await page.getByTestId('save-item-button').click();

    // Back on the dashboard, the Food tile should still be visible (CoverageMatrix).
    await page.getByTestId('v2-nav-home').click();
    await expect(page.getByTestId('v2-category-food')).toBeVisible();
  });

  test('should surface low-stock items in the priority queue', async ({
    page,
  }) => {
    // Add an item with zero quantity — it becomes a critical-status row.
    await page.getByTestId('v2-nav-inv').click();
    await startAddCustomItem(page);
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Out of Stock Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '0');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.getByLabel(/never expires/i).check();
    await page.getByTestId('save-item-button').click();

    await page.getByTestId('v2-nav-home').click();
    // Dashboard's PriorityQueue lists non-OK items.
    await expect(page.getByText(/PRIORITY QUEUE/)).toBeVisible();
    // Wait past the notification toast so only the PriorityQueue row remains.
    await page.waitForTimeout(3000);
    await expect(
      page.getByText('Out of Stock Item', { exact: true }),
    ).toBeVisible();
  });

  test('clicking a category tile navigates to inventory filtered by that category', async ({
    page,
  }) => {
    await page.getByTestId('v2-category-food').click();
    await expect(page.getByRole('button', { name: '+ ADD' })).toBeVisible();
    // The category rail arrives with the picked category selected.
    await expect(page.getByTestId('v2-category-row-food')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  test('VIEW ALL → on the priority queue navigates to inventory', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /VIEW ALL/ }).click();
    await expect(page.getByRole('button', { name: '+ ADD' })).toBeVisible();
  });
});
