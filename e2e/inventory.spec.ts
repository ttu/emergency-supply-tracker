import {
  test,
  expect,
  selectInventoryCategory,
  startAddCustomItem,
} from './fixtures';

/**
 * Design v2 simplified the inventory flow significantly:
 *  - No template-selector modal (every new item starts as custom)
 *  - No "expand recommended items" panel under categories
 *  - No quick + / × buttons next to recommended items in the inventory
 * Tests that previously exercised those v1-only flows are gone; what
 * remains covers the v2 inventory: list view, status filtering, search,
 * and the inline ItemDetail add/edit/delete cycle.
 */

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  const addItem = async (
    page: import('@playwright/test').Page,
    overrides: {
      name: string;
      category?: string;
      quantity?: string;
      unit?: string;
    },
  ) => {
    await page.getByTestId('v2-nav-inv').click();
    await startAddCustomItem(page);
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', overrides.name);
    if (overrides.category) {
      await page.selectOption('select[name="category"]', overrides.category);
    }
    await page.fill('input[name="quantity"]', overrides.quantity ?? '5');
    await page.selectOption('select[name="unit"]', overrides.unit ?? 'pieces');
    await page.getByLabel(/never expires/i).check();
    await page.getByTestId('save-item-button').click();
    await expect(page.getByRole('button', { name: '+ ADD' })).toBeVisible();
  };

  test('should add a custom item', async ({ page }) => {
    await addItem(page, { name: 'Trail Mix', category: 'food' });
    await page.waitForTimeout(2500); // let the toast clear
    await expect(
      page.getByText('Trail Mix', { exact: true }).first(),
    ).toBeVisible();
  });

  test('should edit an existing item', async ({ page }) => {
    await addItem(page, { name: 'Original Name', category: 'food' });
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /Original Name/ }).click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Updated Name');
    await page.getByTestId('save-item-button').click();

    await page.waitForTimeout(2500);
    await expect(
      page.getByRole('button', { name: /Updated Name/ }),
    ).toBeVisible();
  });

  test('should delete an item', async ({ page }) => {
    await addItem(page, { name: 'Delete Me', category: 'food' });
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /Delete Me/ }).click();

    // v2 confirms through the themed ConfirmDialog, not window.confirm.
    await page.getByRole('button', { name: 'DELETE', exact: true }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /^(DELETE|Remove)$/i }).click();

    // Back on the list. Match the row exactly: the item detail's quantity
    // steppers are also labelled with the item name ("Increase Delete Me by
    // 1"), so a loose /Delete Me/ matches more than the row.
    await expect(
      page.getByRole('button', { name: /^Delete Me\b/ }),
    ).toHaveCount(0);
  });

  test('should filter items by category', async ({ page }) => {
    await addItem(page, { name: 'Food Item', category: 'food' });
    await page.waitForTimeout(500);
    await addItem(page, { name: 'Water Item', category: 'water-beverages' });
    await page.waitForTimeout(500);

    await selectInventoryCategory(page, 'food');
    await expect(page.getByRole('button', { name: /Food Item/ })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Water Item/ }),
    ).not.toBeVisible();
  });

  test('should search items by name', async ({ page }) => {
    await addItem(page, { name: 'Apple', category: 'food' });
    await page.waitForTimeout(500);
    await addItem(page, { name: 'Banana', category: 'food' });
    await page.waitForTimeout(500);

    await page.getByLabel('Search inventory').fill('apple');
    await expect(page.getByRole('button', { name: /Apple/ })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Banana/ }),
    ).not.toBeVisible();
  });

  test('should filter by CRIT status chip', async ({ page }) => {
    await addItem(page, {
      name: 'Critical Item',
      category: 'food',
      quantity: '0',
    });
    await page.waitForTimeout(500);
    await addItem(page, { name: 'Ok Item', category: 'food', quantity: '20' });
    await page.waitForTimeout(500);

    await page.getByTestId('v2-status-crit').click();
    await expect(
      page.getByRole('button', { name: /Critical Item/ }),
    ).toBeVisible();
  });

  test('cancel button on edit returns to list without saving', async ({
    page,
  }) => {
    await addItem(page, { name: 'Original', category: 'food' });
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /Original/ }).click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Discarded Edit');
    await page.getByTestId('cancel-item-button').click();

    await expect(page.getByRole('button', { name: '+ ADD' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Original/ })).toBeVisible();
  });
});
