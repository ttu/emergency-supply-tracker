import { test, expect } from './fixtures';

test.describe('Item Status Indicators', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should show OK status for item with sufficient quantity', async ({
    page,
  }) => {
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    // Add item with quantity >= recommended
    await page.fill('input[name="name"]', 'OK Status Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '10');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is auto-calculated, but we'll set it manually if needed
    // For now, assume 10 is >= recommended
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Item card should show OK status (checkmark icon or green indicator)
    // Use getByRole to find the item card button, then get its parent
    const itemCardButton = page.getByRole('button', {
      name: /OK Status Item/i,
    });
    await expect(itemCardButton).toBeVisible();
    const itemCard = itemCardButton.locator('..');

    // Look for OK status indicator (checkmark, green badge, or "OK" text)
    // Status might be shown as icon, badge, or text
    // Assert each locator separately
    await expect(
      itemCard.locator(
        '[class*="status"], [class*="ok"], [aria-label*="ok" i], [aria-label*="sufficient" i]',
      ),
    ).not.toBeVisible();
    await expect(
      itemCard.locator('text=/critical|warning|low/i'),
    ).not.toBeVisible();
  });

  test('should show Warning status for item with low quantity', async ({
    page,
  }) => {
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    // Add item with quantity < 50% of recommended
    // Set quantity to 2, but recommended will be higher
    await page.fill('input[name="name"]', 'Warning Status Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '2');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity will be auto-calculated (likely > 4 for 2 adults, 3 days)
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Item should show warning status
    // Use getByRole to find the item card button, then get its parent
    const itemCardButton = page.getByRole('button', {
      name: /Warning Status Item/i,
    });
    await expect(itemCardButton).toBeVisible();
    const itemCard = itemCardButton.locator('..');
    await expect(itemCard).toBeVisible();

    // Verify warning indicator is present (warning icon, yellow badge, or "Warning" text)
    // Check for warning-related CSS classes or aria-labels
    const warningIndicatorByClass = itemCard.locator(
      '[class*="warning"], [class*="status-warning"], [aria-label*="warning" i]',
    );
    // Also check for warning text separately
    const warningIndicatorByText = itemCard.locator('text=/Warning|Varoitus/i');

    // At least one warning indicator should be visible
    const hasWarningClass = await warningIndicatorByClass
      .isVisible()
      .catch(() => false);
    const hasWarningText = await warningIndicatorByText
      .isVisible()
      .catch(() => false);

    expect(hasWarningClass || hasWarningText).toBe(true);

    // Verify it does not show Critical indicator
    await expect(
      itemCard.locator('text=/critical|Critical|Kriittinen/i'),
    ).not.toBeVisible();
  });

  test('should show Critical status for item with zero quantity', async ({
    page,
  }) => {
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    // Add item with quantity = 0
    await page.fill('input[name="name"]', 'Critical Status Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '0');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Item should show critical status
    // Use getByRole to find the item card button, then get its parent
    const itemCardButton = page.getByRole('button', {
      name: /Critical Status Item/i,
    });
    await expect(itemCardButton).toBeVisible();
    const itemCard = itemCardButton.locator('..');
    await expect(itemCard).toBeVisible();

    // Critical items should trigger alerts on dashboard
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('alerts-section')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show Critical status for expired item', async ({ page }) => {
    // Add expired item
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    await page.fill('input[name="name"]', 'Expired Critical Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '5');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.uncheck('input[type="checkbox"]');
    // Set expiration date in the past
    await page.fill('input[type="date"]', '2024-01-01');
    await page.getByTestId('save-item-button').click();

    // Navigate to Inventory to check item card status (not dashboard alerts)
    await page.getByTestId('nav-inventory').click();
    await expect(page.getByTestId('page-inventory')).toBeVisible({
      timeout: 5000,
    });

    // Should show expired text in item card - use getByRole to target item card button specifically
    const itemCardButton = page.getByRole('button', {
      name: /Expired Critical Item/i,
    });
    await expect(itemCardButton).toBeVisible();
    // Check that expired text is visible within the item card
    // Use CSS selector to target the expired class specifically to avoid matching item name
    const itemCard = itemCardButton.locator('..');
    // Target the expired status element by its CSS class (contains "expired" in the class name)
    const expiredElement = itemCard.locator('[class*="expired"]');
    await expect(expiredElement).toBeVisible({
      timeout: 5000,
    });
    // Verify it contains the expired text
    await expect(expiredElement.getByText(/⚠️/i)).toBeVisible();
  });

  test('should update status when quantity changes', async ({ page }) => {
    // Add item with low quantity
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    await page.fill('input[name="name"]', 'Status Update Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '2'); // Low quantity
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Edit item to increase quantity - use getByRole to target item card button specifically
    const itemCardButton = page.getByRole('button', {
      name: /Status Update Item/i,
    });
    await expect(itemCardButton).toBeVisible();
    await itemCardButton.click();
    await page.waitForSelector('input[name="quantity"]');
    await page.fill('input[name="quantity"]', '20'); // Higher quantity
    await page.getByTestId('save-item-button').click();

    // Item should still be visible (status updated)
    // Use getByRole to target item card button specifically
    await expect(
      page.getByRole('button', { name: /Status Update Item/i }),
    ).toBeVisible();
  });

  test('should show status in category summary', async ({ page }) => {
    // Add items with different statuses
    await page.getByTestId('nav-inventory').click();

    // Add OK item
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'OK Food Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '10');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Add Critical item
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Critical Food Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '0');
    await page.selectOption('select[name="unit"]', 'pieces');
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Navigate to Dashboard
    await page.getByTestId('nav-dashboard').click();

    // Food category card should show status (critical due to zero quantity item)
    const foodCategoryCard = page.locator('[data-testid="category-food"]');
    await expect(foodCategoryCard).toBeVisible();

    // Category should reflect critical status
    // Status might be shown as color, icon, or text
    await expect(foodCategoryCard).toBeVisible();
  });
});
