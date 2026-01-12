import {
  test,
  expect,
  expandRecommendedItems,
  ensureNoModals,
  waitForCountChange,
} from './fixtures';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should add item from template', async ({ page }) => {
    // Navigate to Inventory
    await page.getByTestId('nav-inventory').click();

    // Click "Add Item" button
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // Search for water
    await page.getByTestId('template-search-input').fill('water');

    // Wait for search results to filter - wait for the water template to be visible
    const waterTemplate = page.getByTestId('template-card-bottled-water');
    await expect(waterTemplate).toBeVisible();
    await waterTemplate.click();

    // Fill in the form
    await page.fill('input[name="quantity"]', '24');

    // Save the item
    await page.getByTestId('save-item-button').click();

    // Verify item with "water" appears in inventory
    await expect(page.locator('text=/water/i').first()).toBeVisible();
  });

  test('should add custom item', async ({ page }) => {
    // Navigate to Inventory
    await page.getByTestId('nav-inventory').click();

    // Click "Add Item" to open template selector
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // Click "Custom Item" button in template selector
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    // Fill in the form
    await page.fill('input[name="name"]', 'Custom Flashlight');
    await page.selectOption('select[name="category"]', 'tools-supplies');
    await page.fill('input[name="quantity"]', '2');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]'); // Never Expires

    // Save the item
    await page.getByTestId('save-item-button').click();

    // Verify item appears in inventory
    await expect(page.locator('text=Custom Flashlight')).toBeVisible();
  });

  test('should edit existing item', async ({ page }) => {
    // Navigate to Inventory and add an item first
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    await page.fill('input[name="name"]', 'Test Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '5');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Wait for item to appear and click on the card to edit
    await page.click('text=Test Item');

    // Wait for form to appear and update quantity
    await page.waitForSelector('input[name="quantity"]');
    await page.fill('input[name="quantity"]', '8');

    // Save changes
    await page.getByTestId('save-item-button').click();

    // Verify changes are saved (item still visible)
    await expect(page.locator('text=Test Item')).toBeVisible();
  });

  test('should delete item', async ({ page }) => {
    // Navigate to Inventory and add an item first
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    await page.fill('input[name="name"]', 'Item to Delete');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Wait for item to appear and click on it to open edit mode
    await page.click('text=Item to Delete');

    // Wait for delete button to appear in the modal
    const deleteButton = page.getByTestId('delete-item-button');
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
    await page.getByTestId('nav-inventory').click();

    // Add food item
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Food Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    await expect(page.locator('text=Food Item')).toBeVisible();

    // Add water item
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Water Item');
    await page.selectOption('select[name="category"]', 'water-beverages');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'liters');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    await expect(page.locator('text=Water Item')).toBeVisible();

    // Filter by Food category
    await page.getByTestId('category-food').click();

    // Food item should be visible
    await expect(page.locator('text=Food Item')).toBeVisible();
    // Water item should not be visible
    await expect(page.locator('text=Water Item')).not.toBeVisible();

    // Click All to show all items again
    await page.getByTestId('category-all').click();
    await expect(page.locator('text=Food Item')).toBeVisible();
    await expect(page.locator('text=Water Item')).toBeVisible();
  });

  test('should search items', async ({ page }) => {
    // Navigate to Inventory and add items
    await page.getByTestId('nav-inventory').click();

    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Searchable Item A');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();
    await page.fill('input[name="name"]', 'Different Item B');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '1');
    await page.selectOption('select[name="unit"]', 'pieces');
    // recommendedQuantity is now auto-calculated
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

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
    await page.getByTestId('nav-inventory').click();

    // Click "Add Item" button
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();

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
    await page.getByTestId('template-card-bottled-water').click();

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
    await page.getByTestId('nav-inventory').click();

    // Open template selector and select a template
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // Click on Bottled Water template
    await page.getByTestId('template-card-bottled-water').click();

    // Wait for form modal to open
    await expect(page.getByTestId('item-form')).toBeVisible();

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
    await page.getByTestId('nav-inventory').click();

    // Open template selector
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // Click Custom Item
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    // Click back button (←)
    await page.getByTestId('modal-back-button').click();

    // Should be back at template selector
    await expect(page.getByTestId('template-selector')).toBeVisible();
  });

  test('should show cancel button only when editing existing item', async ({
    page,
  }) => {
    // Navigate to Inventory and add an item first
    await page.getByTestId('nav-inventory').click();
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();
    await page.getByTestId('custom-item-button').click();
    await expect(page.getByTestId('item-form')).toBeVisible();

    // When adding new item, should only have submit button visible
    const submitButton = page.getByTestId('save-item-button');
    await expect(submitButton).toBeVisible();

    // Fill in and save item
    await page.fill('input[name="name"]', 'Test Edit Item');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="quantity"]', '5');
    await page.check('input[type="checkbox"]');
    await page.getByTestId('save-item-button').click();

    // Wait for item to appear
    await expect(page.locator('text=Test Edit Item')).toBeVisible();

    // Click to edit the item
    await page.click('text=Test Edit Item');

    // When editing existing item, should show both Save and Cancel buttons
    await expect(page.getByTestId('save-item-button')).toBeVisible();
    await expect(page.getByTestId('cancel-item-button')).toBeVisible();
  });

  test('should show custom item option in template selector', async ({
    page,
  }) => {
    // Navigate to Inventory
    await page.getByTestId('nav-inventory').click();

    // Open template selector
    await page.getByTestId('add-item-button').click();
    await expect(page.getByTestId('template-selector')).toBeVisible();

    // Should see Custom Item button with dashed border style
    const customItemButton = page.getByTestId('custom-item-button');
    await expect(customItemButton).toBeVisible();

    // Click it to open custom item form
    await customItemButton.click();
    await expect(page.getByTestId('item-form')).toBeVisible();
  });

  test('should show recommended items with action buttons when viewing a category', async ({
    page,
  }) => {
    // Navigate to Inventory
    await page.getByTestId('nav-inventory').click();

    // Click on Water category to see category status
    await page.getByTestId('category-water-beverages').click();

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
    await page.getByTestId('nav-inventory').click();

    // Ensure no modals are open
    await ensureNoModals(page);

    // Click on Water category
    await page.getByTestId('category-water-beverages').click();

    // Expand recommended items (they are hidden by default)
    await expandRecommendedItems(page);

    // Ensure no modals are blocking before clicking
    await ensureNoModals(page);

    // Click the + button on the first recommended item
    const addButton = page.locator('button:has-text("+")').first();
    await addButton.click();

    // Should open the item form modal
    await expect(page.getByTestId('item-form')).toBeVisible();

    // The form should have quantity 0 and item data pre-filled
    const quantityInput = page.locator('input[name="quantity"]');
    await expect(quantityInput).toHaveValue('0');
  });

  test('should disable recommended item when clicking × button', async ({
    page,
  }) => {
    // Navigate to Inventory
    await page.getByTestId('nav-inventory').click();

    // Ensure no modals are open
    await ensureNoModals(page);

    // Click on Water category
    await page.getByTestId('category-water-beverages').click();

    // Expand recommended items (they are hidden by default)
    await expandRecommendedItems(page);

    // Ensure no modals are blocking before clicking
    await ensureNoModals(page);

    // Count initial recommended items
    const missingItemsLocator = page.locator('[class*="missingItemText"]');
    const initialShortages = await missingItemsLocator.count();

    // Click the × button on the first recommended item
    const disableButton = page.locator('button:has-text("×")').first();
    await disableButton.click();

    // Wait for the list to update - use explicit count assertion instead of timeout
    await waitForCountChange(missingItemsLocator, initialShortages, {
      decrease: true,
    });

    // The disabled item should no longer appear in the list
    const finalShortages = await missingItemsLocator.count();
    expect(finalShortages).toBe(initialShortages - 1);
  });
});
