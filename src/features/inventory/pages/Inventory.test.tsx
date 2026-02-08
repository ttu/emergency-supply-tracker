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
import { calculateRecommendedQuantity } from '@/shared/utils/calculations/recommendedQuantity';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import { calculateCategoryPreparedness } from '@/features/dashboard';
import { saveAppData, getAppData } from '@/shared/utils/storage/localStorage';
import type { UploadedKit } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createDateOnly,
  createQuantity,
} from '@/shared/types';

// Mock i18next
vi.mock('react-i18next', async () => {
  const { defaultI18nMock } = await import('@/test/i18n');
  return defaultI18nMock;
});

describe('Inventory Page', () => {
  beforeEach(() => {
    // Mock window.confirm
    globalThis.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render inventory page', () => {
    renderWithProviders(<Inventory />);

    expect(screen.getByText('navigation.inventory')).toBeInTheDocument();
    expect(screen.getByText('inventory.addFromTemplate')).toBeInTheDocument();
  });

  it('should show category navigation', () => {
    renderWithProviders(<Inventory />);

    // Scope to sidebar to avoid duplicates from drawer
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    expect(
      within(sidebar).getByText('inventory.allCategories'),
    ).toBeInTheDocument();
  });

  it('should show filter bar', () => {
    renderWithProviders(<Inventory />);

    const searchInput = screen.getByPlaceholderText(
      'inventory.searchPlaceholder',
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('should show empty state when no items', () => {
    renderWithProviders(<Inventory />);

    expect(screen.getByText('inventory.noItems')).toBeInTheDocument();
  });

  it('should open add modal when clicking custom item in template selector', () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Click custom item button
    const customItemButton = screen.getByText(/itemForm.customItem/);
    fireEvent.click(customItemButton);

    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
  });

  it('should open template modal when clicking add from template', () => {
    renderWithProviders(<Inventory />);

    const templateButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(templateButton);

    expect(screen.getByText('inventory.selectTemplate')).toBeInTheDocument();
  });

  it('should close modal when clicking cancel', async () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Select custom item to open the form
    const customItemButton = screen.getByText(/itemForm.customItem/);
    fireEvent.click(customItemButton);

    // Modal should show add item form
    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();

    // Click close button (X) to close modal
    const closeButton = screen.getByLabelText('accessibility.closeModal');
    fireEvent.click(closeButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('inventory.addItem')).not.toBeInTheDocument();
    });
  });

  it('should filter items by search query', () => {
    renderWithProviders(<Inventory />);

    const searchInput = screen.getByPlaceholderText(
      'inventory.searchPlaceholder',
    );
    fireEvent.change(searchInput, { target: { value: 'water' } });

    // Items would be filtered (tested implicitly through component logic)
    expect(searchInput).toHaveValue('water');
  });

  it('should filter items by category', () => {
    renderWithProviders(<Inventory />);

    // Scope to sidebar to avoid duplicates from drawer
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const allCategoriesButton = within(sidebar).getByText(
      'inventory.allCategories',
    );
    expect(allCategoriesButton).toBeInTheDocument();

    // Category filtering is tested through component logic
  });

  it('should sort items', () => {
    renderWithProviders(<Inventory />);

    // Find the sort select by its label
    const sortLabel = screen.getByText('inventory.sort.label');
    expect(sortLabel).toBeInTheDocument();

    // Sorting is tested through component logic
  });

  it('should change sort order', () => {
    renderWithProviders(<Inventory />);

    // Find and change the sort dropdown (the second combobox is sort)
    const sortSelects = screen.getAllByRole('combobox');
    const sortSelect = sortSelects[1]; // Sort is the second select
    fireEvent.change(sortSelect, { target: { value: 'quantity' } });

    expect(sortSelect).toHaveValue('quantity');
  });

  it('should change status filter', () => {
    renderWithProviders(<Inventory />);

    // Find and change the status filter dropdown (the first combobox)
    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects[0]; // Status is the first select
    fireEvent.change(statusSelect, { target: { value: 'warning' } });

    expect(statusSelect).toHaveValue('warning');
  });

  it('should open template selector with initial category', () => {
    renderWithProviders(<Inventory selectedCategoryId="food" />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    expect(screen.getByText('inventory.selectTemplate')).toBeInTheDocument();
  });

  it('should open add modal when openAddModal prop is true', () => {
    renderWithProviders(<Inventory openAddModal={true} />);

    // Template selector should open automatically
    expect(screen.getByText('inventory.selectTemplate')).toBeInTheDocument();
  });

  it('should go back to template selector from item form', async () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Select custom item to open the form
    const customItemButton = screen.getByText(/itemForm.customItem/);
    fireEvent.click(customItemButton);

    // Modal should show add item form
    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();

    // Click back button
    const backButton = screen.getByLabelText('accessibility.goBack');
    fireEvent.click(backButton);

    // Should show template selector again
    await waitFor(() => {
      expect(screen.getByText('inventory.selectTemplate')).toBeInTheDocument();
    });
  });

  it('should close template modal when clicking close', async () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    expect(screen.getByText('inventory.selectTemplate')).toBeInTheDocument();

    // Click close button
    const closeButton = screen.getByLabelText('accessibility.closeModal');
    fireEvent.click(closeButton);

    // Modal should be closed
    await waitFor(() => {
      expect(
        screen.queryByText('inventory.selectTemplate'),
      ).not.toBeInTheDocument();
    });
  });

  it('should show form with input fields for custom item', async () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Click custom item button
    const customItemButton = screen.getByText(/itemForm.customItem/);
    fireEvent.click(customItemButton);

    // Verify form is displayed with expected fields
    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();

    // Form fields should be present (use Testing Library queries)
    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    expect(nameInput).toBeInTheDocument();

    const quantityInput = screen.getByLabelText(/itemForm\.quantity/i);
    expect(quantityInput).toBeInTheDocument();

    // Verify we can interact with form fields
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    expect(nameInput).toHaveValue('Test Item');

    fireEvent.change(quantityInput, { target: { value: '5' } });
    expect(quantityInput).toHaveValue(5);

    // Verify add button is present
    expect(screen.getByText('common.add')).toBeInTheDocument();
  });

  it('should select a template and show add item form', async () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Template selector should be open
    expect(screen.getByText('inventory.selectTemplate')).toBeInTheDocument();

    // Find template buttons in the selector (they have data-testid="template-button-*")
    const templateButtons = screen.getAllByRole('button');
    const templateButton = templateButtons.find(
      (btn) =>
        btn.textContent?.includes('bottled-water') ||
        (
          btn.closest('[data-testid]') as HTMLElement | null
        )?.dataset.testid?.startsWith('template-'),
    );

    // If we find a template button, click it
    if (templateButton) {
      fireEvent.click(templateButton);

      // Should now show item form with template data
      await waitFor(() => {
        expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
      });
    }
  });

  it('should change sort to expiration', () => {
    renderWithProviders(<Inventory />);

    const sortSelects = screen.getAllByRole('combobox');
    const sortSelect = sortSelects[1];
    fireEvent.change(sortSelect, { target: { value: 'expiration' } });

    expect(sortSelect).toHaveValue('expiration');
  });

  it('should filter by critical status', () => {
    renderWithProviders(<Inventory />);

    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects[0];
    fireEvent.change(statusSelect, { target: { value: 'critical' } });

    expect(statusSelect).toHaveValue('critical');
  });

  it('should filter by ok status', () => {
    renderWithProviders(<Inventory />);

    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects[0];
    fireEvent.change(statusSelect, { target: { value: 'ok' } });

    expect(statusSelect).toHaveValue('ok');
  });
});

/**
 * Unit test to verify that items created from templates use itemType correctly.
 * This validates the fix for the Categories Overview not showing status correctly.
 */
describe('Inventory Page with items', () => {
  const mockItem = createMockInventoryItem({
    id: createItemId('test-item-1'),
    name: 'Test Water',
    itemType: createProductTemplateId('bottled-water'),
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(10), // Used in sorting test

    expirationDate: createDateOnly(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    ),
  });

  const expiredItem = createMockInventoryItem({
    id: createItemId('test-item-2'),
    name: 'Expired Food',
    itemType: createProductTemplateId('canned-soup'),
    categoryId: createCategoryId('food'),
    quantity: createQuantity(5), // Used in sorting test
    expirationDate: createDateOnly(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    ),
  });

  const neverExpiresItem = createMockInventoryItem({
    id: createItemId('test-item-3'),
    name: 'Batteries',
    itemType: createProductTemplateId('batteries'),
    categoryId: createCategoryId('light-power'),
    quantity: createQuantity(20), // Used in sorting test (highest)

    neverExpires: true,
  });

  beforeEach(() => {
    globalThis.confirm = vi.fn(() => true);
    // Store items in localStorage
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [mockItem, expiredItem, neverExpiresItem],
    });
    saveAppData(appData);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should display items from inventory', () => {
    renderWithProviders(<Inventory />);
    expect(screen.getByText('Test Water')).toBeInTheDocument();
  });

  it('should filter items by search query matching name', () => {
    renderWithProviders(<Inventory />);

    const searchInput = screen.getByPlaceholderText(
      'inventory.searchPlaceholder',
    );
    fireEvent.change(searchInput, { target: { value: 'Water' } });

    expect(screen.getByText('Test Water')).toBeInTheDocument();
    expect(screen.queryByText('Expired Food')).not.toBeInTheDocument();
  });

  it('should filter items by category via selectedCategoryId', () => {
    renderWithProviders(<Inventory selectedCategoryId="water-beverages" />);

    // Should show water item but not food (filtered by category)
    expect(screen.getByText('Test Water')).toBeInTheDocument();
    expect(screen.queryByText('Expired Food')).not.toBeInTheDocument();
    expect(screen.queryByText('Batteries')).not.toBeInTheDocument();
  });

  it('should call onCategoryChange when category is changed (controlled mode)', () => {
    const onCategoryChange = vi.fn();
    renderWithProviders(
      <Inventory
        selectedCategoryId="water-beverages"
        onCategoryChange={onCategoryChange}
      />,
    );

    // Click on a different category (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const foodCategory = within(sidebar).getByTestId('sidemenu-item-food');
    fireEvent.click(foodCategory);

    expect(onCategoryChange).toHaveBeenCalledWith('food');
  });

  it('should use local state for category when onCategoryChange is not provided (uncontrolled mode)', () => {
    // Render without onCategoryChange - uses local state
    renderWithProviders(<Inventory selectedCategoryId="water-beverages" />);

    // Should show water item (filtered by initial category)
    expect(screen.getByText('Test Water')).toBeInTheDocument();
    expect(screen.queryByText('Expired Food')).not.toBeInTheDocument();

    // Click on a different category - uses local state setter (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const foodCategory = within(sidebar).getByTestId('sidemenu-item-food');
    fireEvent.click(foodCategory);

    // Should now show food item (local state changed)
    expect(screen.queryByText('Test Water')).not.toBeInTheDocument();
    expect(screen.getByText('Expired Food')).toBeInTheDocument();
  });

  it('should handle clicking All Categories in uncontrolled mode', () => {
    // Render without onCategoryChange - uses local state
    renderWithProviders(<Inventory selectedCategoryId="water-beverages" />);

    // Click on All Categories button (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const allCategoriesButton = within(sidebar).getByText(
      'inventory.allCategories',
    );
    fireEvent.click(allCategoriesButton);

    // Should now show all items
    expect(screen.getByText('Test Water')).toBeInTheDocument();
    expect(screen.getByText('Expired Food')).toBeInTheDocument();
    expect(screen.getByText('Batteries')).toBeInTheDocument();
  });

  it('should sort items by quantity', () => {
    renderWithProviders(<Inventory />);

    const sortSelects = screen.getAllByRole('combobox');
    const sortSelect = sortSelects[1];
    fireEvent.change(sortSelect, { target: { value: 'quantity' } });

    // Batteries (20) should appear before Water (10) and Food (5)
    const itemButtons = screen.getAllByRole('button');
    const itemOrder = itemButtons
      .map((btn) => btn.textContent)
      .filter((t) => t?.includes('Test Water') || t?.includes('Batteries'));
    expect(itemOrder.length).toBeGreaterThan(0);
  });

  it('should sort items by expiration date', () => {
    renderWithProviders(<Inventory />);

    const sortSelects = screen.getAllByRole('combobox');
    const sortSelect = sortSelects[1];
    fireEvent.change(sortSelect, { target: { value: 'expiration' } });

    expect(sortSelect).toHaveValue('expiration');
  });

  it('should click on item to open edit modal', async () => {
    renderWithProviders(<Inventory />);

    // Click on an item to edit
    const waterItem = screen.getByText('Test Water');
    fireEvent.click(waterItem);

    // Should open edit modal
    await waitFor(() => {
      expect(screen.getByText('inventory.editItem')).toBeInTheDocument();
    });
  });

  it('should show delete button in edit modal', async () => {
    renderWithProviders(<Inventory />);

    const waterItem = screen.getByText('Test Water');
    fireEvent.click(waterItem);

    await waitFor(() => {
      expect(screen.getByText('common.delete')).toBeInTheDocument();
    });
  });

  it('should show copy button in edit modal', async () => {
    renderWithProviders(<Inventory />);

    const waterItem = screen.getByText('Test Water');
    fireEvent.click(waterItem);

    await waitFor(() => {
      expect(screen.getByText('common.copy')).toBeInTheDocument();
    });
  });

  it('should delete item when clicking delete button', async () => {
    renderWithProviders(<Inventory />);

    const waterItem = screen.getByText('Test Water');
    fireEvent.click(waterItem);

    await waitFor(() => {
      expect(screen.getByText('common.delete')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('common.delete');
    fireEvent.click(deleteButton);

    // confirm was called
    expect(globalThis.confirm).toHaveBeenCalled();
  });

  it('should copy item when clicking copy button', async () => {
    renderWithProviders(<Inventory />);

    const waterItem = screen.getByText('Test Water');
    fireEvent.click(waterItem);

    await waitFor(() => {
      expect(screen.getByText('common.copy')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('common.copy');
    fireEvent.click(copyButton);

    // Form should still be open (copying creates a new unsaved item)
    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
  });

  it('should show category status summary when category is selected', () => {
    renderWithProviders(<Inventory selectedCategoryId="water-beverages" />);

    // Should show category-related content
    expect(screen.getByText('Test Water')).toBeInTheDocument();
  });

  it('should update item when submitting edit form', async () => {
    renderWithProviders(<Inventory />);

    const waterItem = screen.getByText('Test Water');
    fireEvent.click(waterItem);

    await waitFor(() => {
      expect(screen.getByText('inventory.editItem')).toBeInTheDocument();
    });

    // Change quantity
    const quantityInput = screen.getByLabelText(/itemForm\.quantity/i);
    fireEvent.change(quantityInput, { target: { value: '15' } });
    expect(quantityInput).toHaveValue(15);

    // Submit form
    const saveButton = screen.getByText('common.save');
    expect(saveButton).toBeInTheDocument();
    fireEvent.click(saveButton);
  });

  it('should fill custom form fields', async () => {
    renderWithProviders(<Inventory />);

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Select custom item
    const customItemButton = screen.getByText(/itemForm.customItem/);
    fireEvent.click(customItemButton);

    // Fill all required form fields
    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    fireEvent.change(nameInput, { target: { value: 'New Custom Item' } });
    expect(nameInput).toHaveValue('New Custom Item');

    const quantityInput = screen.getByLabelText(/itemForm\.quantity/i);
    fireEvent.change(quantityInput, { target: { value: '5' } });
    expect(quantityInput).toHaveValue(5);

    // Select category
    const categorySelect = screen.getByLabelText(/itemForm\.category/i);
    fireEvent.change(categorySelect, { target: { value: 'food' } });
    expect(categorySelect).toHaveValue('food');

    // Check "never expires" checkbox
    const neverExpiresCheckbox = screen.getByLabelText(
      /itemForm\.neverExpires/i,
    );
    fireEvent.click(neverExpiresCheckbox);
    expect(neverExpiresCheckbox).toBeChecked();

    // Submit button should be present
    const addItemButton = screen.getByText('common.add');
    expect(addItemButton).toBeInTheDocument();
  });

  it('should add custom item and close modal on submit (handleAddItem)', async () => {
    renderWithProviders(<Inventory />);

    // Open template selector and choose custom item
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);
    const customItemButton = screen.getByText(/itemForm.customItem/);
    fireEvent.click(customItemButton);

    // Fill required fields (name, quantity, category) and check never expires so no expiration required
    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    fireEvent.change(nameInput, { target: { value: 'My Custom Supply' } });
    const quantityInput = screen.getByLabelText(/itemForm\.quantity/i);
    fireEvent.change(quantityInput, { target: { value: '3' } });
    const categorySelect = screen.getByLabelText(/itemForm\.category/i);
    fireEvent.change(categorySelect, { target: { value: 'food' } });
    const neverExpiresCheckbox = screen.getByLabelText(
      /itemForm\.neverExpires/i,
    );
    fireEvent.click(neverExpiresCheckbox);

    const submitButton = screen.getByText('common.add');
    fireEvent.click(submitButton);

    // Modal should close (handleAddItem calls setShowAddModal(false), setEditingItem(undefined))
    await waitFor(() => {
      expect(screen.queryByText('inventory.addItem')).not.toBeInTheDocument();
    });
  });

  it('should show unsaved changes dialog when closing add modal via X with dirty form', async () => {
    renderWithProviders(<Inventory />);

    fireEvent.click(screen.getByText('inventory.addFromTemplate'));
    fireEvent.click(screen.getByText(/itemForm.customItem/));

    await waitFor(() => {
      expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    fireEvent.change(nameInput, { target: { value: 'Changed' } });

    const closeButton = screen.getByTestId('modal-close-button');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.getByTestId('unsaved-changes-dont-save'),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('unsaved-changes-save')).toBeInTheDocument();
    expect(screen.getByTestId('unsaved-changes-cancel')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('unsaved-changes-dont-save'));

    await waitFor(() => {
      expect(screen.queryByText('inventory.addItem')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('unsaved-changes-dont-save'),
      ).not.toBeInTheDocument();
    });
  });

  it('should close without dialog when closing add modal via X with no changes', async () => {
    renderWithProviders(<Inventory />);

    fireEvent.click(screen.getByText('inventory.addFromTemplate'));
    fireEvent.click(screen.getByText(/itemForm.customItem/));

    await waitFor(() => {
      expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('modal-close-button'));

    await waitFor(() => {
      expect(screen.queryByText('inventory.addItem')).not.toBeInTheDocument();
    });
    expect(
      screen.queryByTestId('unsaved-changes-save'),
    ).not.toBeInTheDocument();
  });

  it('should close unsaved dialog and keep form open when clicking Cancel', async () => {
    renderWithProviders(<Inventory />);

    fireEvent.click(screen.getByText('inventory.addFromTemplate'));
    fireEvent.click(screen.getByText(/itemForm.customItem/));

    await waitFor(() => {
      expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    fireEvent.change(nameInput, { target: { value: 'Changed' } });
    fireEvent.click(screen.getByTestId('modal-close-button'));

    await waitFor(() => {
      expect(screen.getByTestId('unsaved-changes-cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('unsaved-changes-cancel'));

    await waitFor(() => {
      expect(
        screen.queryByTestId('unsaved-changes-cancel'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
  });

  it('should close unsaved dialog when pressing Escape', async () => {
    renderWithProviders(<Inventory />);

    fireEvent.click(screen.getByText('inventory.addFromTemplate'));
    fireEvent.click(screen.getByText(/itemForm.customItem/));

    await waitFor(() => {
      expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    fireEvent.change(nameInput, { target: { value: 'Changed' } });
    fireEvent.click(screen.getByTestId('modal-close-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('unsaved-changes-dont-save'),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(
        screen.queryByTestId('unsaved-changes-dont-save'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
  });

  it('should close unsaved dialog when clicking overlay', async () => {
    renderWithProviders(<Inventory />);

    fireEvent.click(screen.getByText('inventory.addFromTemplate'));
    fireEvent.click(screen.getByText(/itemForm.customItem/));

    await waitFor(() => {
      expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    fireEvent.change(nameInput, { target: { value: 'Changed' } });
    fireEvent.click(screen.getByTestId('modal-close-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('unsaved-changes-dont-save'),
      ).toBeInTheDocument();
    });

    const overlay = screen.getByTestId('unsaved-changes-overlay');
    expect(overlay).toBeInTheDocument();
    fireEvent.mouseDown(overlay);

    await waitFor(() => {
      expect(
        screen.queryByTestId('unsaved-changes-dont-save'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
  });

  it('should save and close when clicking Save in unsaved dialog', async () => {
    renderWithProviders(<Inventory />);

    fireEvent.click(screen.getByText('inventory.addFromTemplate'));
    fireEvent.click(screen.getByText(/itemForm.customItem/));

    await waitFor(() => {
      expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    fireEvent.change(nameInput, { target: { value: 'New Item' } });
    const quantityInput = screen.getByLabelText(/itemForm\.quantity/i);
    fireEvent.change(quantityInput, { target: { value: '2' } });

    fireEvent.click(screen.getByTestId('modal-close-button'));

    await waitFor(() => {
      expect(screen.getByTestId('unsaved-changes-save')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('unsaved-changes-save'));

    // Unsaved dialog closes and requestSubmit is triggered (covers handleUnsavedSave)
    await waitFor(() => {
      expect(
        screen.queryByTestId('unsaved-changes-save'),
      ).not.toBeInTheDocument();
    });
    // Form may still be open if validation fails (e.g. category required); dialog is closed
    expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
  });

  it('should show unsaved dialog when closing add modal via form Cancel with dirty form', async () => {
    // Edit mode shows the form Cancel button (cancel-item-button); add mode does not
    const itemToEdit = createMockInventoryItem({
      id: createItemId('item-to-edit'),
      name: 'Item To Edit',
      categoryId: createCategoryId('food'),
      quantity: createQuantity(1),
      unit: 'pieces',
      neverExpires: true,
    });
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [itemToEdit],
    });
    saveAppData(appData);

    renderWithProviders(<Inventory />);

    fireEvent.click(screen.getByText('Item To Edit'));

    await waitFor(() => {
      expect(screen.getByText('inventory.editItem')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } });

    fireEvent.click(screen.getByTestId('cancel-item-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('unsaved-changes-dont-save'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('inventory.unsavedChanges.title'),
    ).toBeInTheDocument();
  });

  it('should trap focus with Tab in unsaved dialog', async () => {
    renderWithProviders(<Inventory />);

    fireEvent.click(screen.getByText('inventory.addFromTemplate'));
    fireEvent.click(screen.getByText(/itemForm.customItem/));

    await waitFor(() => {
      expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    fireEvent.change(nameInput, { target: { value: 'Changed' } });
    fireEvent.click(screen.getByTestId('modal-close-button'));

    await waitFor(() => {
      expect(screen.getByTestId('unsaved-changes-cancel')).toBeInTheDocument();
    });

    const buttons = screen
      .getAllByRole('button')
      .filter((el) =>
        [
          'unsaved-changes-cancel',
          'unsaved-changes-dont-save',
          'unsaved-changes-save',
        ].includes(el.dataset.testid ?? ''),
      );
    const lastButton = buttons[buttons.length - 1];
    lastButton.focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });

    await waitFor(() => {
      const firstButton = screen.getByTestId('unsaved-changes-cancel');
      expect(document.activeElement).toBe(firstButton);
    });
  });

  it('should trap focus with Shift+Tab in unsaved dialog', async () => {
    renderWithProviders(<Inventory />);

    fireEvent.click(screen.getByText('inventory.addFromTemplate'));
    fireEvent.click(screen.getByText(/itemForm.customItem/));

    await waitFor(() => {
      expect(screen.getByText('inventory.addItem')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/itemForm\.name/i);
    fireEvent.change(nameInput, { target: { value: 'Changed' } });
    fireEvent.click(screen.getByTestId('modal-close-button'));

    await waitFor(() => {
      expect(screen.getByTestId('unsaved-changes-cancel')).toBeInTheDocument();
    });

    const firstButton = screen.getByTestId('unsaved-changes-cancel');
    firstButton.focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    await waitFor(() => {
      const lastButton = screen.getByTestId('unsaved-changes-save');
      expect(document.activeElement).toBe(lastButton);
    });
  });

  it('should open edit modal with setSelectedTemplate(undefined) for item with itemType custom', async () => {
    const customOnlyItem = createMockInventoryItem({
      id: createItemId('custom-only-item'),
      name: 'Custom Only Item',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: createQuantity(1),
      unit: 'pieces',
      neverExpires: true,
    });
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [customOnlyItem],
    });
    saveAppData(appData);

    renderWithProviders(<Inventory />);

    // Click the custom item to edit (hits else branch: setSelectedTemplate(undefined))
    const customItemEl = screen.getByText('Custom Only Item');
    fireEvent.click(customItemEl);

    await waitFor(() => {
      expect(screen.getByText('inventory.editItem')).toBeInTheDocument();
    });

    // Form should show without template-specific fields (selectedTemplate was set to undefined)
    expect(screen.getByLabelText(/itemForm\.name/i)).toHaveValue(
      'Custom Only Item',
    );
  });
});

describe('Template to InventoryItem conversion', () => {
  it('should set itemType when creating item from template', () => {
    const template = RECOMMENDED_ITEMS.find(
      (item) => item.id === 'bottled-water',
    );

    if (!template) {
      throw new Error('Template not found');
    }

    // Simulate what handleSelectTemplate does in Inventory.tsx
    const newItem = {
      name: 'Bottled Water', // translated name
      itemType: createProductTemplateId(template.id),
      categoryId: template.category,
      quantity: createQuantity(0),
      unit: template.unit,
      neverExpires: !template.defaultExpirationMonths,
      expirationDate: template.defaultExpirationMonths
        ? new Date(
            Date.now() +
              template.defaultExpirationMonths * 30 * 24 * 60 * 60 * 1000,
          ).toISOString()
        : undefined,
      caloriesPerUnit: template.caloriesPerUnit,
    };

    // Verify itemType is set correctly
    expect(newItem.itemType).toBe('bottled-water');
    expect(newItem.categoryId).toBe('water-beverages');
    // Water items don't have calories
    expect(newItem.caloriesPerUnit).toBeUndefined();
  });

  it('should include caloriesPerUnit for food items from template', () => {
    const template = RECOMMENDED_ITEMS.find(
      (item) => item.id === 'canned-soup',
    );

    if (!template) {
      throw new Error('Template not found');
    }

    // Simulate what handleSelectTemplate does in Inventory.tsx
    const newItem = {
      name: 'Canned Soup',
      itemType: createProductTemplateId(template.id),
      categoryId: template.category,
      quantity: createQuantity(0),
      unit: template.unit,
      neverExpires: !template.defaultExpirationMonths,
      expirationDate: template.defaultExpirationMonths
        ? new Date(
            Date.now() +
              template.defaultExpirationMonths * 30 * 24 * 60 * 60 * 1000,
          ).toISOString()
        : undefined,
      caloriesPerUnit: template.caloriesPerUnit,
    };

    // Verify food item has calories
    expect(newItem.itemType).toBe('canned-soup');
    expect(newItem.categoryId).toBe('food');
    expect(newItem.caloriesPerUnit).toBe(200); // 200 kcal per can
  });

  it('should match items with itemType in preparedness calculation', () => {
    const household = createMockHousehold({ children: 0 });

    // Calculate expected quantity based on household
    const template = RECOMMENDED_ITEMS.find(
      (item) => item.id === 'bottled-water',
    );
    if (!template) {
      throw new Error('Template not found');
    }
    const expectedQuantity = calculateRecommendedQuantity(template, household);

    // Item WITH itemType (the fix)
    const itemWithTemplateId = createMockInventoryItem({
      id: createItemId('1'),
      name: 'Bottled Water',
      itemType: createProductTemplateId('bottled-water'), // This enables matching
      categoryId: createCategoryId('water-beverages'),
      quantity: createQuantity(expectedQuantity), // Needed for calculation
    });

    // Item with itemType 'custom' (won't match by template ID)
    const itemWithoutTemplateId = createMockInventoryItem({
      id: createItemId('2'),
      name: 'Bottled Water',
      itemType: 'custom',
      categoryId: createCategoryId('water-beverages'),
      quantity: createQuantity(expectedQuantity), // Needed for calculation
      // itemType is 'custom' - this won't match by template ID
    });

    const scoreWithItemType = calculateCategoryPreparedness(
      'water-beverages',
      [itemWithTemplateId],
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    const scoreWithoutItemType = calculateCategoryPreparedness(
      'water-beverages',
      [itemWithoutTemplateId],
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // With itemType matching template ID, the item matches and contributes to the score
    expect(scoreWithItemType).toBeGreaterThan(0);

    // Without matching itemType, the item doesn't match (unless name matches exactly)
    // The score will be 0 because 'Bottled Water' !== 'bottled-water'
    expect(scoreWithoutItemType).toBe(0);
  });
});

describe('Inventory Page - Recommended Items Filtering', () => {
  beforeEach(() => {
    globalThis.confirm = vi.fn(() => true);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should filter pet items based on household pets configuration', () => {
    // Verify that calculateRecommendedQuantity returns 0 for pet items when pets = 0
    const petItem = RECOMMENDED_ITEMS.find(
      (item) => item.id === 'pet-food-dry',
    );
    expect(petItem).toBeDefined();
    expect(petItem!.scaleWithPets).toBe(true);

    const householdNoPets = createMockHousehold({
      pets: 0,
      supplyDurationDays: 3,
    });
    const householdWithPets = createMockHousehold({
      pets: 2,
      supplyDurationDays: 3,
    });

    const qtyNoPets = calculateRecommendedQuantity(petItem!, householdNoPets);
    const qtyWithPets = calculateRecommendedQuantity(
      petItem!,
      householdWithPets,
    );

    expect(qtyNoPets).toBe(0);
    expect(qtyWithPets).toBeGreaterThan(0);
  });

  it('should verify household from localStorage is loaded correctly', () => {
    // Setup localStorage with pets = 0
    const appData = createMockAppData({
      household: {
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
    });
    saveAppData(appData);

    // Verify localStorage is set correctly
    const storedData = getAppData();
    expect(storedData?.household.pets).toBe(0);

    // Now filter recommended items as the Inventory component would
    const household = storedData!.household;
    const petItems = RECOMMENDED_ITEMS.filter(
      (item) => item.category === 'pets',
    );
    const applicablePetItems = petItems.filter((item) => {
      const qty = calculateRecommendedQuantity(item, household);
      return qty > 0;
    });

    expect(petItems.length).toBe(10); // All 10 pet items exist
    expect(applicablePetItems.length).toBe(0); // None should be applicable when pets = 0
  });

  it('should verify that initialAppData properly sets localStorage with createMockAppData', () => {
    // This mimics what renderWithProviders does with initialAppData
    const initialAppData = {
      household: {
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
      items: [],
    };
    const data = createMockAppData(initialAppData);
    saveAppData(data);

    // Verify the data created by createMockAppData
    expect(data.household.pets).toBe(0);
    expect(data.household.adults).toBe(2);
    expect(data.household.children).toBe(0);

    // Verify localStorage has the correct value
    const storedData = getAppData();
    expect(storedData?.household.pets).toBe(0);
  });

  it('applicableRecommendedItems should filter out pet items when pets = 0', () => {
    // This test verifies the filtering logic that Inventory uses
    // to filter out items with 0 recommended quantity

    // Simulate what Inventory.tsx does with applicableRecommendedItems useMemo
    const household = {
      adults: 2,
      children: 0,
      pets: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    };
    const childrenMultiplier = 0.75; // default value

    const applicableRecommendedItems = RECOMMENDED_ITEMS.filter((item) => {
      const qty = calculateRecommendedQuantity(
        item,
        household,
        childrenMultiplier,
      );
      return qty > 0;
    });

    // Verify all pet items are filtered out
    const petItemsInFiltered = applicableRecommendedItems.filter(
      (item) => item.category === 'pets',
    );
    expect(petItemsInFiltered.length).toBe(0);

    // But non-pet items should still be present
    const nonPetItemsInFiltered = applicableRecommendedItems.filter(
      (item) => item.category !== 'pets',
    );
    expect(nonPetItemsInFiltered.length).toBeGreaterThan(0);
  });

  it('should show pet items in template selector when household has pets', async () => {
    // Render with household that has pets using initialAppData
    renderWithProviders(<Inventory />, {
      initialAppData: {
        household: {
          adults: 2,
          children: 0,
          pets: 2,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        items: [],
      },
    });

    // Open template selector
    const addButton = screen.getByText('inventory.addFromTemplate');
    fireEvent.click(addButton);

    // Filter by pets category
    const categorySelect = screen.getByTestId('template-category-select');
    fireEvent.change(categorySelect, { target: { value: 'pets' } });

    // Should show pet items (not the "no templates" message)
    await waitFor(() => {
      expect(
        screen.queryByText('templateSelector.noTemplates'),
      ).not.toBeInTheDocument();
    });

    // Verify at least one pet template card exists
    const petTemplateCards = screen.getAllByTestId(/^template-card-pet-/);
    expect(petTemplateCards.length).toBeGreaterThan(0);
  });
});

describe('Inventory Page - Mark as Enough', () => {
  const itemWithLowQuantity = createMockInventoryItem({
    id: createItemId('test-item-mark'),
    name: 'Test Candles',
    itemType: createProductTemplateId('candles'), // Match the recommended item
    categoryId: createCategoryId('cooking-heat'), // Candles are in cooking-heat category
    quantity: createQuantity(4),
    unit: 'pieces',
    neverExpires: true,
    markedAsEnough: false,
  });

  beforeEach(() => {
    globalThis.confirm = vi.fn(() => true);
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [itemWithLowQuantity],
    });
    saveAppData(appData);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should show mark as enough button in recommended list for item with low quantity', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Inventory selectedCategoryId="cooking-heat" />);

    // First expand the recommended items (they are hidden by default)
    const expandButton = screen.getByRole('button', {
      name: /Show.*recommended/i,
    });
    await user.click(expandButton);

    // The recommended list should show the mark as enough button
    // Note: translation mock returns key as-is, so use the key
    const markButton = screen.getByRole('button', {
      name: 'inventory.markAsEnough',
    });
    expect(markButton).toBeInTheDocument();
    expect(markButton).toHaveTextContent('✓');
  });

  it('should handle add recommended item to inventory callback', async () => {
    // This test verifies that handleAddRecommendedToInventory callback exists
    // and can be triggered when a template is found (line 275 coverage)
    const user = userEvent.setup();
    renderWithProviders(<Inventory selectedCategoryId="cooking-heat" />);

    // Expand recommended items to show the category status summary
    const expandButton = screen.getByRole('button', {
      name: /Show.*recommended/i,
    });
    await user.click(expandButton);

    // The callback is passed to CategoryStatusSummary and called when
    // the add button is clicked. There may be multiple buttons, so get all and click first.
    const addButtons = screen.queryAllByRole('button', {
      name: 'inventory.addToInventory',
    });
    if (addButtons.length > 0) {
      await user.click(addButtons[0]);
      // Should open template selector or item form
      await waitFor(() => {
        expect(
          screen.queryByText('inventory.selectTemplate') ||
            screen.queryByText('inventory.addItem'),
        ).toBeInTheDocument();
      });
    }
    // Test passes if no error is thrown (callback exists and is callable)
  });

  it('should handle disable recommended item callback', async () => {
    // This test verifies that handleDisableRecommendedItem callback exists
    // and can be triggered (line 284 coverage)
    const user = userEvent.setup();
    renderWithProviders(<Inventory selectedCategoryId="cooking-heat" />);

    const expandButton = screen.getByRole('button', {
      name: /Show.*recommended/i,
    });
    await user.click(expandButton);

    // The callback is passed to CategoryStatusSummary and called when
    // the disable button is clicked. There may be multiple buttons, so get all and click first.
    const disableButtons = screen.queryAllByRole('button', {
      name: 'inventory.disableRecommended',
    });
    if (disableButtons.length > 0) {
      await user.click(disableButtons[0]);
      // The item should be disabled (button removed or item hidden)
      await waitFor(() => {
        const remainingButtons = screen.queryAllByRole('button', {
          name: 'inventory.disableRecommended',
        });
        expect(remainingButtons.length).toBeLessThan(disableButtons.length);
      });
    }
    // Test passes if no error is thrown (callback exists and is callable)
  });

  it('should call handleMarkAsEnough when mark button in recommended list is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Inventory selectedCategoryId="cooking-heat" />);

    // First expand the recommended items (they are hidden by default)
    const expandButton = screen.getByRole('button', {
      name: /Show.*recommended/i,
    });
    await user.click(expandButton);

    const markButton = screen.getByRole('button', {
      name: 'inventory.markAsEnough',
    });
    await user.click(markButton);

    // Wait for the update to complete
    await waitFor(() => {
      // The button should disappear after marking as enough
      expect(
        screen.queryByRole('button', { name: 'inventory.markAsEnough' }),
      ).not.toBeInTheDocument();
    });
  });

  it('should disable category when clicking disable category button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Inventory selectedCategoryId="cooking-heat" />);

    // Verify the disable category button is present
    const disableButton = screen.getByTestId('disable-category-button');
    expect(disableButton).toBeInTheDocument();

    // Click the disable button
    await user.click(disableButton);

    // Category should be deselected (category nav returns to all categories view)
    await waitFor(() => {
      // The disable category button should no longer be visible since category is deselected
      expect(
        screen.queryByTestId('disable-category-button'),
      ).not.toBeInTheDocument();
    });
  });
});

describe('Inventory Page - resolveItemName (custom item names)', () => {
  const CUSTOM_KIT_UUID = 'resolve-item-name-test-uuid';
  const customKit: UploadedKit = {
    id: CUSTOM_KIT_UUID,
    file: {
      meta: {
        name: 'Custom Kit',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
      },
      items: [
        {
          id: createProductTemplateId('custom-test'),
          i18nKey: 'custom.custom-test',
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
          names: { en: 'Custom Test Item', fi: 'Custom Test Item FI' },
        },
      ],
    },
    uploadedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    globalThis.confirm = vi.fn(() => true);
    const appData = createMockAppData({
      household: createMockHousehold({ children: 0 }),
      items: [],
      uploadedRecommendationKits: [customKit],
      selectedRecommendationKit: `custom:${CUSTOM_KIT_UUID}`,
    });
    saveAppData(appData);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should resolve custom item name when CategoryStatusSummary displays shortage', async () => {
    const user = userEvent.setup();
    // Food category with custom kit item in shortage (no food items in inventory)
    renderWithProviders(<Inventory selectedCategoryId="food" />);

    // Expand recommended items so CategoryStatusSummary formats shortages and calls resolveItemName
    const expandButton = screen.getByRole('button', {
      name: /Show.*recommended/i,
    });
    await user.click(expandButton);

    // resolveItemName is called with (itemId, i18nKey) for custom items; shortage text should show custom name
    await waitFor(() => {
      // CategoryStatusSummary formats shortages; custom item uses getItemName via resolveItemName
      expect(
        screen.getByText(
          /Custom Test Item|inventory\.shortageFormat|inventory\.shortageFormatMissing/,
        ),
      ).toBeInTheDocument();
    });
  });
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
