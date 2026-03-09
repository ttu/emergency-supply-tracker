import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  userEvent,
  createMockInventoryItem,
  createMockAppData,
  createMockHousehold,
  within,
} from '@/test';
import { Inventory } from './Inventory';
import { saveAppData, getAppData } from '@/shared/utils/storage/localStorage';

import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createDateOnly,
  createQuantity,
} from '@/shared/types';
import { toLocalDateString } from '@/shared/utils/test/date-helpers';

// Mock i18next
vi.mock('react-i18next', async () => {
  const { defaultI18nMock } = await import('@/test/i18n');
  return defaultI18nMock;
});

describe('Inventory Page - Custom Templates', () => {
  beforeEach(() => {
    globalThis.confirm = vi.fn(() => true);
    // Setup localStorage with custom templates
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [],
      customTemplates: [
        {
          id: createProductTemplateId('my-custom-template'),
          name: 'My Custom Template',
          category: 'food',
          defaultUnit: 'pieces',
          isBuiltIn: false,
          isCustom: true,
        },
      ],
    });
    saveAppData(appData);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should select custom template and open item form (handleSelectCustomTemplate)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    await user.click(addButton);

    // Template selector should show custom templates section
    expect(screen.getByText('inventory.selectTemplate')).toBeInTheDocument();

    // Click on the custom template card
    const customTemplateCard = screen.getByTestId(
      'custom-template-card-my-custom-template',
    );
    await user.click(customTemplateCard);

    // Should open item form with pre-filled data from custom template
    await waitFor(() => {
      expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
    });

    // Form should have the name pre-filled from the custom template
    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    expect(nameInput).toHaveValue('My Custom Template');

    // Form should have the category pre-selected
    const categorySelect = screen.getByLabelText(/itemForm\.category/i);
    expect(categorySelect).toHaveValue('food');
  });

  it('should add item with saveAsTemplate checkbox and create custom template', async () => {
    const user = userEvent.setup();
    // Clear custom templates for this test
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [],
      customTemplates: [],
    });
    saveAppData(appData);

    renderWithProviders(<Inventory />);

    // Open template selector and choose custom item
    const addButton = screen.getByText('inventory.addFromTemplate');
    await user.click(addButton);
    const customItemButton = screen.getByText(/itemForm.customItem/);
    await user.click(customItemButton);

    // Fill required fields
    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'New Template Item');
    const quantityInput = screen.getByLabelText(/itemForm\.quantity/i);
    await user.type(quantityInput, '5');
    const categorySelect = screen.getByLabelText(/itemForm\.category/i);
    await user.selectOptions(categorySelect, 'food');
    const neverExpiresCheckbox = screen.getByLabelText(
      /itemForm\.neverExpires/i,
    );
    await user.click(neverExpiresCheckbox);

    // Check the "Save as Template" checkbox
    const saveAsTemplateCheckbox = screen.getByTestId(
      'save-as-template-checkbox',
    );
    await user.click(saveAsTemplateCheckbox);
    expect(saveAsTemplateCheckbox).toBeChecked();

    // Submit the form
    const submitButton = screen.getByText('common.add');
    await user.click(submitButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('inventory.addItem')).not.toBeInTheDocument();
    });

    // Template should be persisted in localStorage
    const storedData = getAppData();
    expect(
      storedData?.customTemplates?.some(
        (template) => template.name === 'New Template Item',
      ),
    ).toBe(true);
  });
});

describe('Inventory Page - Location Filter', () => {
  const kitchenItem = createMockInventoryItem({
    id: createItemId('kitchen-item'),
    name: 'Kitchen Item',
    itemType: 'custom',
    categoryId: createCategoryId('food'),
    quantity: createQuantity(5),
    unit: 'pieces',
    neverExpires: true,
    location: 'Kitchen',
  });

  const garageItem = createMockInventoryItem({
    id: createItemId('garage-item'),
    name: 'Garage Item',
    itemType: 'custom',
    categoryId: createCategoryId('food'),
    quantity: createQuantity(3),
    unit: 'pieces',
    neverExpires: true,
    location: 'Garage',
  });

  const noLocationItem = createMockInventoryItem({
    id: createItemId('no-location-item'),
    name: 'No Location Item',
    itemType: 'custom',
    categoryId: createCategoryId('food'),
    quantity: createQuantity(2),
    unit: 'pieces',
    neverExpires: true,
    location: undefined,
  });

  const whitespaceLocationItem = createMockInventoryItem({
    id: createItemId('whitespace-item'),
    name: 'Whitespace Location Item',
    itemType: 'custom',
    categoryId: createCategoryId('food'),
    quantity: createQuantity(1),
    unit: 'pieces',
    neverExpires: true,
    location: '   ',
  });

  const trimmedKitchenItem = createMockInventoryItem({
    id: createItemId('trimmed-kitchen-item'),
    name: 'Trimmed Kitchen Item',
    itemType: 'custom',
    categoryId: createCategoryId('food'),
    quantity: createQuantity(4),
    unit: 'pieces',
    neverExpires: true,
    location: '  Kitchen  ',
  });

  beforeEach(() => {
    globalThis.confirm = vi.fn(() => true);
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [
        kitchenItem,
        garageItem,
        noLocationItem,
        whitespaceLocationItem,
        trimmedKitchenItem,
      ],
    });
    saveAppData(appData);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should show all items when location filter is set to all', () => {
    renderWithProviders(<Inventory />);

    // All items should be visible by default
    expect(screen.getByText('Kitchen Item')).toBeInTheDocument();
    expect(screen.getByText('Garage Item')).toBeInTheDocument();
    expect(screen.getByText('No Location Item')).toBeInTheDocument();
    expect(screen.getByText('Whitespace Location Item')).toBeInTheDocument();
    expect(screen.getByText('Trimmed Kitchen Item')).toBeInTheDocument();
  });

  it('should filter items by specific location', () => {
    renderWithProviders(<Inventory />);

    // Find the location filter (second combobox after status filter)
    const comboboxes = screen.getAllByRole('combobox');
    const locationFilter = comboboxes[1]; // Location is second

    // Select Kitchen location
    fireEvent.change(locationFilter, { target: { value: 'Kitchen' } });

    // Kitchen items should be visible (including trimmed one)
    expect(screen.getByText('Kitchen Item')).toBeInTheDocument();
    expect(screen.getByText('Trimmed Kitchen Item')).toBeInTheDocument();

    // Other items should not be visible
    expect(screen.queryByText('Garage Item')).not.toBeInTheDocument();
    expect(screen.queryByText('No Location Item')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Whitespace Location Item'),
    ).not.toBeInTheDocument();
  });

  it('should filter items with no location using LOCATION_FILTER_NONE', () => {
    renderWithProviders(<Inventory />);

    const comboboxes = screen.getAllByRole('combobox');
    const locationFilter = comboboxes[1];

    // Select "No Location" filter
    fireEvent.change(locationFilter, { target: { value: '__none__' } });

    // Items with no location or whitespace-only location should be visible
    expect(screen.getByText('No Location Item')).toBeInTheDocument();
    expect(screen.getByText('Whitespace Location Item')).toBeInTheDocument();

    // Items with actual locations should not be visible
    expect(screen.queryByText('Kitchen Item')).not.toBeInTheDocument();
    expect(screen.queryByText('Garage Item')).not.toBeInTheDocument();
    expect(screen.queryByText('Trimmed Kitchen Item')).not.toBeInTheDocument();
  });

  it('should show location options in filter dropdown', () => {
    renderWithProviders(<Inventory />);

    const comboboxes = screen.getAllByRole('combobox');
    const locationFilter = comboboxes[1];

    // Should have options for all locations (trimmed and deduplicated)
    const options = locationFilter.querySelectorAll('option');
    const optionValues = Array.from(options).map((opt) => opt.value);

    // Should have: All, None, Garage, Kitchen (deduplicated from Kitchen and " Kitchen ")
    expect(optionValues).toContain('__all__');
    expect(optionValues).toContain('__none__');
    expect(optionValues).toContain('Garage');
    expect(optionValues).toContain('Kitchen');
  });
});

describe('Inventory Page - Quick Edit Quantity', () => {
  const testItem = createMockInventoryItem({
    id: createItemId('quick-edit-test'),
    name: 'Quick Edit Test Item',
    itemType: createProductTemplateId('bottled-water'),
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(10),
    unit: 'liters',
    neverExpires: true,
  });

  beforeEach(() => {
    globalThis.confirm = vi.fn(() => true);
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [testItem],
    });
    saveAppData(appData);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should show quantity stepper when clicking quantity button on item card', () => {
    renderWithProviders(<Inventory />);

    // Find the edit quantity button on the item card (translation key returned by mock)
    const editQuantityBtn = screen.getByRole('button', {
      name: 'inventory.quantityStepper.edit',
    });
    fireEvent.click(editQuantityBtn);

    // Stepper buttons should appear (translation keys)
    expect(
      screen.getByRole('button', {
        name: 'inventory.quantityStepper.increase',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'inventory.quantityStepper.decrease',
      }),
    ).toBeInTheDocument();
  });

  it('should update UI immediately for optimistic updates', () => {
    renderWithProviders(<Inventory />);

    // Activate stepper
    const editQuantityBtn = screen.getByRole('button', {
      name: 'inventory.quantityStepper.edit',
    });
    fireEvent.click(editQuantityBtn);

    // Initial quantity should be 10
    expect(screen.getByRole('status')).toHaveTextContent('10');

    // Click increase
    const increaseBtn = screen.getByRole('button', {
      name: 'inventory.quantityStepper.increase',
    });
    fireEvent.click(increaseBtn);

    // UI should update immediately (optimistic update)
    expect(screen.getByRole('status')).toHaveTextContent('11');
  });

  it('should pass onQuantityChange to ItemList and ItemCard', () => {
    // This test verifies the prop drilling from Inventory -> ItemList -> ItemCard
    renderWithProviders(<Inventory />);

    // The edit quantity button should exist (meaning ItemCard received onQuantityChange)
    const editQuantityBtn = screen.getByRole('button', {
      name: 'inventory.quantityStepper.edit',
    });
    expect(editQuantityBtn).toBeInTheDocument();

    // Activate stepper and verify it works
    fireEvent.click(editQuantityBtn);

    // Decrease button should work (meaning onChange is connected)
    const decreaseBtn = screen.getByRole('button', {
      name: 'inventory.quantityStepper.decrease',
    });
    fireEvent.click(decreaseBtn);

    // Status should now show 9 (optimistic update)
    expect(screen.getByRole('status')).toHaveTextContent('9');
  });

  it('should support multiple quantity changes', () => {
    renderWithProviders(<Inventory />);

    // Activate stepper
    const editQuantityBtn = screen.getByRole('button', {
      name: 'inventory.quantityStepper.edit',
    });
    fireEvent.click(editQuantityBtn);

    // Click increase multiple times
    const increaseBtn = screen.getByRole('button', {
      name: 'inventory.quantityStepper.increase',
    });
    fireEvent.click(increaseBtn);
    fireEvent.click(increaseBtn);
    fireEvent.click(increaseBtn);

    // Status should show 13 (optimistic update: 10 + 3)
    expect(screen.getByRole('status')).toHaveTextContent('13');
  });
});

describe('Inventory Page - Remove Empty Items', () => {
  const zeroQuantityItem = createMockInventoryItem({
    id: createItemId('zero-qty-1'),
    name: 'Empty Item 1',
    itemType: 'custom',
    categoryId: createCategoryId('food'),
    quantity: createQuantity(0),
    unit: 'pieces',
    neverExpires: true,
  });

  const zeroQuantityItem2 = createMockInventoryItem({
    id: createItemId('zero-qty-2'),
    name: 'Empty Item 2',
    itemType: 'custom',
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(0),
    unit: 'liters',
    neverExpires: true,
  });

  const nonZeroQuantityItem = createMockInventoryItem({
    id: createItemId('non-zero-qty'),
    name: 'Non-Empty Item',
    itemType: 'custom',
    categoryId: createCategoryId('food'),
    quantity: createQuantity(5),
    unit: 'pieces',
    neverExpires: true,
  });

  beforeEach(() => {
    globalThis.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should hide remove empty items button when no 0-quantity items exist', () => {
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [nonZeroQuantityItem],
    });
    saveAppData(appData);

    renderWithProviders(<Inventory />);

    expect(
      screen.queryByTestId('remove-empty-items-button'),
    ).not.toBeInTheDocument();
  });

  it('should show remove empty items button when 0-quantity items exist', () => {
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [zeroQuantityItem, nonZeroQuantityItem],
    });
    saveAppData(appData);

    renderWithProviders(<Inventory />);

    expect(screen.getByTestId('remove-empty-items-button')).toBeInTheDocument();
  });

  it('should show confirmation dialog when clicking remove empty items button', async () => {
    const user = userEvent.setup();
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [zeroQuantityItem, nonZeroQuantityItem],
    });
    saveAppData(appData);

    renderWithProviders(<Inventory />);

    const removeButton = screen.getByTestId('remove-empty-items-button');
    await user.click(removeButton);

    expect(globalThis.confirm).toHaveBeenCalled();
  });

  it('should remove 0-quantity items when confirmed', async () => {
    const user = userEvent.setup();
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [zeroQuantityItem, nonZeroQuantityItem],
    });
    saveAppData(appData);

    renderWithProviders(<Inventory />);

    // Verify empty item is visible
    expect(screen.getByText('Empty Item 1')).toBeInTheDocument();

    const removeButton = screen.getByTestId('remove-empty-items-button');
    await user.click(removeButton);

    // After removal, the empty item should be gone
    await waitFor(() => {
      expect(screen.queryByText('Empty Item 1')).not.toBeInTheDocument();
    });

    // Non-empty item should still be visible
    expect(screen.getByText('Non-Empty Item')).toBeInTheDocument();

    // Button should be hidden since no more 0-quantity items
    expect(
      screen.queryByTestId('remove-empty-items-button'),
    ).not.toBeInTheDocument();
  });

  it('should not remove items when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    globalThis.confirm = vi.fn(() => false); // User clicks "Cancel"

    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [zeroQuantityItem, nonZeroQuantityItem],
    });
    saveAppData(appData);

    renderWithProviders(<Inventory />);

    const removeButton = screen.getByTestId('remove-empty-items-button');
    await user.click(removeButton);

    // Item should still be present
    expect(screen.getByText('Empty Item 1')).toBeInTheDocument();
  });

  it('should only remove 0-quantity items in selected category', async () => {
    const user = userEvent.setup();
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [zeroQuantityItem, zeroQuantityItem2, nonZeroQuantityItem],
    });
    saveAppData(appData);

    // Select food category
    renderWithProviders(<Inventory selectedCategoryId="food" />);

    // Only food zero-quantity item should be counted
    const removeButton = screen.getByTestId('remove-empty-items-button');
    await user.click(removeButton);

    // Food empty item should be removed
    await waitFor(() => {
      expect(screen.queryByText('Empty Item 1')).not.toBeInTheDocument();
    });

    // Switch to all categories to verify water item still exists
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const allCategoriesButton = within(sidebar).getByText(
      'inventory.allCategories',
    );
    fireEvent.click(allCategoriesButton);

    // Water empty item should still exist (it was in a different category)
    expect(screen.getByText('Empty Item 2')).toBeInTheDocument();
  });

  it('should remove all 0-quantity items when no category is selected', async () => {
    const user = userEvent.setup();
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [zeroQuantityItem, zeroQuantityItem2, nonZeroQuantityItem],
    });
    saveAppData(appData);

    // No category selected (All Categories)
    renderWithProviders(<Inventory />);

    const removeButton = screen.getByTestId('remove-empty-items-button');
    await user.click(removeButton);

    // Both empty items should be removed
    await waitFor(() => {
      expect(screen.queryByText('Empty Item 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Empty Item 2')).not.toBeInTheDocument();
    });

    // Non-empty item should still exist
    expect(screen.getByText('Non-Empty Item')).toBeInTheDocument();
  });
});

describe('Inventory Page - Initial Item from Alert', () => {
  const foodItem = createMockInventoryItem({
    id: createItemId('food-item-1'),
    name: 'Canned Meat',
    itemType: createProductTemplateId('canned-meat'),
    categoryId: createCategoryId('food'),
    quantity: createQuantity(7),
    expirationDate: createDateOnly(
      toLocalDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    ),
  });

  const waterItem = createMockInventoryItem({
    id: createItemId('water-item-1'),
    name: 'Bottled Water',
    itemType: createProductTemplateId('bottled-water'),
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(10),
    expirationDate: createDateOnly(
      toLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    ),
  });

  beforeEach(() => {
    globalThis.confirm = vi.fn(() => true);
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [foodItem, waterItem],
    });
    saveAppData(appData);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should open edit modal for the specified initialItemId', () => {
    renderWithProviders(
      <Inventory initialItemId="food-item-1" onInitialItemHandled={vi.fn()} />,
    );

    // Edit modal should open with the item name
    expect(screen.getByText('inventory.editItem')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Canned Meat')).toBeInTheDocument();
  });

  it('should call onInitialItemHandled after opening the item', async () => {
    const onInitialItemHandled = vi.fn();
    renderWithProviders(
      <Inventory
        initialItemId="food-item-1"
        onInitialItemHandled={onInitialItemHandled}
      />,
    );

    await waitFor(() => {
      expect(onInitialItemHandled).toHaveBeenCalled();
    });
  });

  it('should handle initialItemId that does not exist in inventory', async () => {
    const onInitialItemHandled = vi.fn();
    renderWithProviders(
      <Inventory
        initialItemId="nonexistent-item"
        onInitialItemHandled={onInitialItemHandled}
      />,
    );

    // Should not open the edit modal
    expect(screen.queryByText('inventory.editItem')).not.toBeInTheDocument();

    // Should still call onInitialItemHandled to clear the state
    await waitFor(() => {
      expect(onInitialItemHandled).toHaveBeenCalled();
    });
  });
});
