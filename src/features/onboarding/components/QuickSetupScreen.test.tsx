import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickSetupScreen } from './QuickSetupScreen';
import { createMockHousehold } from '@/shared/utils/test/factories';
import { RecommendedItemsProvider } from '@/features/templates';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { ns?: string }) => {
      // Translations organized by namespace
      const translations: Record<string, Record<string, string>> = {
        common: {
          'quickSetup.title': 'Quick Setup',
          'quickSetup.subtitle': 'Add recommended items to your inventory',
          'quickSetup.itemsCount': 'Items',
          'quickSetup.categoriesCount': 'Categories',
          'quickSetup.days': 'Days',
          'quickSetup.selectedItems': 'Selected',
          'quickSetup.showDetails': 'Show Details',
          'quickSetup.hideDetails': 'Hide Details',
          'quickSetup.selectAll': 'Select All',
          'quickSetup.deselectAll': 'Deselect All',
          'quickSetup.selectItem': 'Select {{item}}',
          'quickSetup.info':
            'These items are recommended based on your household configuration.',
          'quickSetup.noFreezer': 'Frozen items have been excluded.',
          'quickSetup.skip': 'Skip',
          'quickSetup.addAllItems': 'Add all items',
          'quickSetup.addItems': 'Add selected items',
        },
        categories: {
          'water-beverages': 'Water & Beverages',
          food: 'Food',
          'cooking-heat': 'Cooking & Heat',
          'light-power': 'Light & Power',
          'communication-info': 'Communication & Info',
          'medical-health': 'Medical & Health',
          'hygiene-sanitation': 'Hygiene & Sanitation',
          'tools-supplies': 'Tools & Supplies',
          'cash-documents': 'Cash & Documents',
        },
        products: {
          'bottled-water': 'Bottled Water',
          'long-life-milk': 'Long-life Milk',
          'long-life-juice': 'Long-life Juice',
          'canned-soup': 'Canned Soup',
          'canned-vegetables': 'Canned Vegetables',
          'canned-fish': 'Canned Fish',
          'canned-meat': 'Canned Meat',
          pasta: 'Pasta',
          rice: 'Rice',
          oats: 'Oats',
          crackers: 'Crackers',
          'energy-bars': 'Energy Bars',
          spreads: 'Spreads',
          'dried-fruits': 'Dried Fruits',
          nuts: 'Nuts',
          'salt-sugar': 'Salt and Sugar',
          'coffee-tea': 'Coffee and Tea',
          'frozen-vegetables': 'Frozen Vegetables',
          'frozen-meat': 'Frozen Meat',
          'frozen-meals': 'Frozen Meals',
        },
        units: {
          liters: 'L',
          cans: 'cans',
          kilograms: 'kg',
          pieces: 'pcs',
          packages: 'packages',
          boxes: 'boxes',
          bottles: 'bottles',
          rolls: 'rolls',
          canisters: 'canisters',
          pairs: 'pairs',
          meters: 'm',
          euros: '€',
          sets: 'sets',
          days: 'days',
          tubes: 'tubes',
          jars: 'jars',
        },
      };

      // If namespace is specified, look up in that namespace
      if (options?.ns && translations[options.ns]) {
        return translations[options.ns][key] || key;
      }

      // Default: look up in common namespace
      return translations.common[key] || key;
    },
  }),
}));

// Helper to wrap component with provider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<RecommendedItemsProvider>{ui}</RecommendedItemsProvider>);
};

describe('QuickSetupScreen', () => {
  const defaultHousehold = createMockHousehold({
    adults: 2,
    children: 1,
    supplyDurationDays: 3,
    useFreezer: true,
  });

  it('renders title and subtitle', () => {
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    expect(screen.getByText('Quick Setup')).toBeInTheDocument();
    expect(
      screen.getByText('Add recommended items to your inventory'),
    ).toBeInTheDocument();
  });

  it('displays summary information', () => {
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Days')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // supply days
  });

  it('shows details when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    expect(screen.getByText('Hide Details')).toBeInTheDocument();
    // Should show category names
    expect(screen.getByText('Water & Beverages')).toBeInTheDocument();
  });

  it('hides details when toggle button is clicked again', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);
    expect(screen.getByText('Hide Details')).toBeInTheDocument();

    const hideButton = screen.getByText('Hide Details');
    await user.click(hideButton);
    expect(screen.getByText('Show Details')).toBeInTheDocument();
  });

  it('calls onAddItems when Add all items button is clicked', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    // All items selected by default; button shows "Add all items"
    const addButton = screen.getByText('Add all items');
    await user.click(addButton);

    expect(onAddItems).toHaveBeenCalledTimes(1);
    expect(onAddItems).toHaveBeenCalledWith(expect.any(Set));
  });

  it('calls onSkip when Skip button is clicked', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const skipButton = screen.getByText('Skip');
    await user.click(skipButton);

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('shows freezer note when household has no freezer', () => {
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    const householdWithoutFreezer = createMockHousehold({
      ...defaultHousehold,
      useFreezer: false,
    });

    renderWithProvider(
      <QuickSetupScreen
        household={householdWithoutFreezer}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    expect(
      screen.getByText('Frozen items have been excluded.'),
    ).toBeInTheDocument();
  });

  it('does not show freezer note when household has freezer', () => {
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    expect(
      screen.queryByText('Frozen items have been excluded.'),
    ).not.toBeInTheDocument();
  });

  it('has accessible toggle button', () => {
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('updates aria-expanded when details are shown', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    const hideButton = screen.getByText('Hide Details');
    expect(hideButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should display translated item names and units when showing details', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    // Show the details section
    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // Verify translated category names are shown (not raw keys like "categories.water-beverages")
    expect(screen.getByText('Water & Beverages')).toBeInTheDocument();
    expect(
      screen.queryByText('categories.water-beverages'),
    ).not.toBeInTheDocument();

    // Verify translated product names are shown (not raw keys like "products.bottled-water")
    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
    expect(
      screen.queryByText('products.bottled-water'),
    ).not.toBeInTheDocument();

    // Verify translated unit names are shown (not raw keys like "units.liters")
    expect(screen.queryByText('units.liters')).not.toBeInTheDocument();
  });

  it('shows checkboxes for items when details are shown', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // Checkboxes should be present for items
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    // Items should be checked by default
    const itemCheckboxes = checkboxes.filter((cb) =>
      cb.getAttribute('id')?.startsWith('item-'),
    );
    itemCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it('allows selecting and deselecting items', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // Get first item checkbox (all checked by default)
    const checkboxes = screen.getAllByRole('checkbox');
    const firstItemCheckbox = checkboxes.find((cb) =>
      cb.getAttribute('id')?.startsWith('item-'),
    );
    expect(firstItemCheckbox).toBeInTheDocument();
    expect(firstItemCheckbox).toBeChecked(); // Items checked by default

    // Uncheck the item
    await user.click(firstItemCheckbox!);
    expect(firstItemCheckbox).not.toBeChecked();

    // Check the item again
    await user.click(firstItemCheckbox!);
    expect(firstItemCheckbox).toBeChecked();
  });

  it('shows Deselect All when all items selected (details shown)', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // When all items are selected (default), it should show "Deselect All"
    expect(screen.getByText('Deselect All')).toBeInTheDocument();
  });

  it('allows selecting all items with Select All button', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // Deselect all first (button shows "Deselect All" when all selected)
    await user.click(screen.getByRole('button', { name: 'Deselect All' }));

    // After deselecting, first item checkbox should be unchecked
    await waitFor(() => {
      const checkboxesAfterDeselect = screen.getAllByRole('checkbox');
      const firstItem = checkboxesAfterDeselect.find((cb) =>
        cb.getAttribute('id')?.startsWith('item-'),
      );
      expect(firstItem).not.toBeChecked();
    });

    // Click Select All
    await user.click(screen.getByRole('button', { name: 'Select All' }));

    // All items should be selected
    const checkboxesAfterSelect = screen.getAllByRole('checkbox');
    const itemCheckboxesAfterSelect = checkboxesAfterSelect.filter((cb) =>
      cb.getAttribute('id')?.startsWith('item-'),
    );
    itemCheckboxesAfterSelect.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it('allows deselecting all items with Deselect All button', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // All selected by default; click Deselect All
    await user.click(screen.getByRole('button', { name: 'Deselect All' }));

    // All item checkboxes should be unchecked
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      const itemCheckboxes = checkboxes.filter((cb) =>
        cb.getAttribute('id')?.startsWith('item-'),
      );
      itemCheckboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  it('disables Add Items button when no items are selected', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    // All selected by default; open details and deselect all
    await user.click(screen.getByText('Show Details'));
    await user.click(screen.getByRole('button', { name: 'Deselect All' }));

    const addButton = screen.getByTestId('add-items-button');
    await waitFor(() => expect(addButton).toBeDisabled());
  });

  it('passes selected item IDs to onAddItems', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // Deselect one item (all selected by default)
    const allCheckboxes = screen.getAllByRole('checkbox');
    const firstItemCheckbox = allCheckboxes.find((cb) =>
      cb.getAttribute('id')?.startsWith('item-'),
    );
    await user.click(firstItemCheckbox!);

    // Button shows "Add selected items" when selection is edited
    const addButton = screen.getByText('Add selected items');
    await user.click(addButton);

    expect(onAddItems).toHaveBeenCalledTimes(1);
    const [selectedIds] = onAddItems.mock.calls[0];
    expect(selectedIds).toBeInstanceOf(Set);
    expect(selectedIds.size).toBeGreaterThan(0);
  });

  it('shows Add all items when all selected, Add selected items when not', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    // Default: all selected → "Add all items"
    expect(screen.getByText('Add all items')).toBeInTheDocument();

    await user.click(screen.getByText('Show Details'));
    // Deselect all (button shows "Deselect All" when all selected)
    await user.click(screen.getByRole('button', { name: 'Deselect All' }));

    // None selected → "Add selected items" (button disabled)
    await waitFor(() => {
      expect(screen.getByText('Add selected items')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Select All' }));

    // All selected again → "Add all items"
    expect(screen.getByText('Add all items')).toBeInTheDocument();
  });
});
