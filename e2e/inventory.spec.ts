import { test, expect, expandRecommendedItems } from './fixtures';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should add item from template', async ({ page }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Click "Add Item" button
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();

    // Wait for template selector to appear
    await expect(page.locator('text=Select Item')).toBeVisible();

    // Search for water
    await page.fill('input[placeholder*="Search"]', 'water');

    // Wait for search results to filter
    await page.waitForTimeout(300);

    // Click on the first template that contains "water" (button.templateCard or button[type="button"])
    const waterTemplate = page
      .locator('button[type="button"]')
      .filter({ hasText: /water/i })
      .first();
    await waterTemplate.click();

    // Fill in the form
    await page.fill('input[name="quantity"]', '24');

    // Save the item
    await page.click('button[type="submit"]');

    // Verify item with "water" appears in inventory
    await expect(page.locator('text=/water/i').first()).toBeVisible();
  });

  test('should add custom item', async ({ page }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Click "Add Item" to open template selector
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();

    // Wait for template selector modal
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();

    // Click "Custom Item" button in template selector
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    // Wait for Add Item form modal to appear
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    // Fill in the form
    await page.fill('input[name="name"]', 'Custom Flashlight');
    await page.selectOption('select[name="category"]', 'tools-supplies');
    await page.fill('input[name="quantity"]', '2');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]'); // Never Expires

    // Save the item
    await page.click('button[type="submit"]');

    // Verify item appears in inventory
    await expect(page.locator('text=Custom Flashlight')).toBeVisible();
  });

  test('should edit existing item', async ({ page }) => {
    // Navigate to Inventory and add an item first
    await page.click('text=Inventory');
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    await page.fill('input[name="name"]', 'Test Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '5');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Wait for item to appear and click on the card to edit
    await page.click('text=Test Item');

    // Wait for form to appear and update quantity
    await page.waitForSelector('input[name="quantity"]');
    await page.fill('input[name="quantity"]', '8');

    // Save changes
    await page.click('button[type="submit"]');

    // Verify changes are saved (item still visible)
    await expect(page.locator('text=Test Item')).toBeVisible();
  });

  test('should delete item', async ({ page }) => {
    // Navigate to Inventory and add an item first
    await page.click('text=Inventory');
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    await page.fill('input[name="name"]', 'Item to Delete');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Wait for item to appear and click on it to open edit mode
    await page.click('text=Item to Delete');

    // Wait for delete button to appear in the modal
    const deleteButton = page.locator('button', { hasText: 'Delete' });
    await expect(deleteButton).toBeVisible();

    // Set up dialog handler before clicking delete
    page.once('dialog', (dialog) => dialog.accept());

    // Click delete button
    await deleteButton.click();

    // Verify item is removed
    await expect(page.locator('text=Item to Delete')).not.toBeVisible();
  });

  test('should filter items by category', async ({ page }) => {
    // Navigate to Inventory and add items in different categories
    await page.click('text=Inventory');

    // Add food item
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();
    await page.fill('input[name="name"]', 'Food Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Food Item')).toBeVisible();

    // Add water item
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();
    await page.fill('input[name="name"]', 'Water Item');
    await page.selectOption('select[name="category"]', 'water-beverages');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'liters');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Water Item')).toBeVisible();

    // Filter by Food category
    await page.click('button:has-text("Food")');

    // Food item should be visible
    await expect(page.locator('text=Food Item')).toBeVisible();
    // Water item should not be visible
    await expect(page.locator('text=Water Item')).not.toBeVisible();

    // Click All to show all items again
    await page.click('button:has-text("All")');
    await expect(page.locator('text=Food Item')).toBeVisible();
    await expect(page.locator('text=Water Item')).toBeVisible();
  });

  test('should search items', async ({ page }) => {
    // Navigate to Inventory and add items
    await page.click('text=Inventory');

    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();
    await page.fill('input[name="name"]', 'Searchable Item A');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();
    await page.fill('input[name="name"]', 'Different Item B');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Search for "Searchable"
    await page.fill('input[placeholder*="Search"]', 'Searchable');

    // Only matching item should be visible
    await expect(page.locator('text=Searchable Item A')).toBeVisible();
    await expect(page.locator('text=Different Item B')).not.toBeVisible();

    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
    await expect(page.locator('text=Searchable Item A')).toBeVisible();
    await expect(page.locator('text=Different Item B')).toBeVisible();
  });

  test('should display translated template names and categories', async ({
    page,
  }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Click "Add Item" button
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();

    // Wait for template selector to appear
    await expect(page.locator('text=Select Item')).toBeVisible();

    // Verify template names are translated (not showing translation keys)
    // Should see "Bottled Water" not "products.bottled-water"
    await expect(page.locator('text=Bottled Water')).toBeVisible();

    // Verify no translation keys are showing
    await expect(
      page.locator('text=products.products.bottled-water'),
    ).not.toBeVisible();
    await expect(
      page.locator('text=categories.water-beverages'),
    ).not.toBeVisible();

    // Verify category filter shows translated names
    const categorySelect = page.locator('select').last();
    const categoryOptions = await categorySelect
      .locator('option')
      .allTextContents();

    // Should include "Water & Beverages" not "categories.water-beverages"
    expect(categoryOptions.some((opt) => opt.includes('Water'))).toBe(true);
    expect(categoryOptions.some((opt) => opt.startsWith('categories.'))).toBe(
      false,
    );

    // Click on a template and verify form has translated categories
    await page.click('text=Bottled Water');

    // Wait for form
    await page.waitForSelector('select[name="category"]');

    // Open category dropdown
    const formCategorySelect = page.locator('select[name="category"]');
    const formOptions = await formCategorySelect
      .locator('option')
      .allTextContents();

    // Should show "Water & Beverages" not "categories.water-beverages"
    expect(formOptions.some((opt) => opt.includes('Water & Beverages'))).toBe(
      true,
    );
    expect(formOptions.some((opt) => opt.startsWith('categories.'))).toBe(
      false,
    );

    // Check unit dropdown
    const unitSelect = page.locator('select[name="unit"]');
    const unitOptions = await unitSelect.locator('option').allTextContents();

    // Should show translated units like "liters", "pieces" not "units.liters"
    expect(
      unitOptions.some((opt) => opt === 'liters' || opt === 'Liters'),
    ).toBe(true);
    expect(unitOptions.some((opt) => opt.startsWith('units.'))).toBe(false);
  });

  test('should show item type when adding from template', async ({ page }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Open template selector and select a template
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();

    // Click on Bottled Water template
    await page.click('button:has-text("Bottled Water")');

    // Wait for form modal to open
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    // Should show item type label
    await expect(page.locator('label:has-text("Item Type")')).toBeVisible();

    // The form should have the item name pre-filled with "Bottled Water"
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveValue('Bottled Water');
  });

  test('should navigate back to template selector using back button', async ({
    page,
  }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Open template selector
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();

    // Click Custom Item
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    // Click back button (←)
    await page.click('button[aria-label="Go back"]');

    // Should be back at template selector
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
  });

  test('should show cancel button only when editing existing item', async ({
    page,
  }) => {
    // Navigate to Inventory and add an item first
    await page.click('text=Inventory');
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();
    await page.click('button:has-text("Custom Item")');
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    // When adding new item, should only have submit button visible
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    // Fill in and save item
    await page.fill('input[name="name"]', 'Test Edit Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '5');
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');

    // Wait for item to appear
    await expect(page.locator('text=Test Edit Item')).toBeVisible();

    // Click to edit the item
    await page.click('text=Test Edit Item');

    // When editing existing item, should show both Save and Cancel buttons
    // Verify we have a secondary variant button (Cancel button uses secondary variant)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    // Check for a button with common.cancel text
    await expect(page.locator('button', { hasText: /cancel/i })).toBeVisible();
  });

  test('should show custom item option in template selector', async ({
    page,
  }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Open template selector
    await page.click('button:has-text("Add Item")');
    await expect(page.locator('h2', { hasText: 'Select Item' })).toBeVisible();

    // Should see Custom Item button with dashed border style
    const customItemButton = page.locator('button:has-text("Custom Item")');
    await expect(customItemButton).toBeVisible();

    // Click it to open custom item form
    await customItemButton.click();
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();
  });

  test('should show recommended items with action buttons when viewing a category', async ({
    page,
  }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Click on Water category to see category status
    await page.click('button:has-text("Water")');

    // Expand recommended items (they are hidden by default)
    await expandRecommendedItems(page);

    // Should see action buttons (+ for add, × for disable) next to recommended items
    const addButtons = page.locator('button:has-text("+")');
    await expect(addButtons.first()).toBeVisible();
  });

  test('should add recommended item to inventory when clicking + button', async ({
    page,
  }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Click on Water category
    await page.click('button:has-text("Water")');

    // Expand recommended items (they are hidden by default)
    await expandRecommendedItems(page);

    // Click the + button on the first recommended item
    const addButton = page.locator('button:has-text("+")').first();
    await addButton.click();

    // Should open the item form modal
    await expect(page.locator('h2', { hasText: 'Add Item' })).toBeVisible();

    // The form should have quantity 0 and item data pre-filled
    const quantityInput = page.locator('input[name="quantity"]');
    await expect(quantityInput).toHaveValue('0');
  });

  test('should disable recommended item when clicking × button', async ({
    page,
  }) => {
    // Navigate to Inventory
    await page.click('text=Inventory');

    // Click on Water category
    await page.click('button:has-text("Water")');

    // Expand recommended items (they are hidden by default)
    await expandRecommendedItems(page);

    // Count initial recommended items
    const initialShortages = await page
      .locator('[class*="missingItemText"]')
      .count();

    // Click the × button on the first recommended item
    const disableButton = page.locator('button:has-text("×")').first();
    await disableButton.click();

    // Wait for the list to update
    await page.waitForTimeout(300);

    // The disabled item should no longer appear in the list
    const finalShortages = await page
      .locator('[class*="missingItemText"]')
      .count();
    expect(finalShortages).toBe(initialShortages - 1);
  });
});
