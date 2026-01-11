import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickSetupScreen } from './QuickSetupScreen';
import { createMockHousehold } from '@/shared/utils/test/factories';

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
          'quickSetup.ownedItems': 'Owned',
          'quickSetup.showDetails': 'Show Details',
          'quickSetup.hideDetails': 'Hide Details',
          'quickSetup.selectAll': 'Select All',
          'quickSetup.deselectAll': 'Deselect All',
          'quickSetup.selectItem': 'Select {{item}}',
          'quickSetup.markAsOwned': 'Mark as owned',
          'quickSetup.info':
            'These items are recommended based on your household configuration.',
          'quickSetup.noFreezer': 'Frozen items have been excluded.',
          'quickSetup.skip': 'Skip',
          'quickSetup.addItems': 'Add Selected Items',
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
    render(
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
    render(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByText('Owned')).toBeInTheDocument();
    expect(screen.getByText('Days')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // supply days
  });

  it('shows details when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
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
    render(
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

  it('calls onAddItems when Add Selected Items button is clicked', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const addButton = screen.getByText('Add Selected Items');
    await user.click(addButton);

    expect(onAddItems).toHaveBeenCalledTimes(1);
    // Verify it's called with Set objects
    expect(onAddItems).toHaveBeenCalledWith(expect.any(Set), expect.any(Set));
  });

  it('calls onSkip when Skip button is clicked', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
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

    render(
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
    render(
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
    render(
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
    render(
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
    render(
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
    render(
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
  });

  it('allows selecting and deselecting items', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // Get first item checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    const firstItemCheckbox = checkboxes.find((cb) =>
      cb.getAttribute('id')?.startsWith('item-'),
    );
    expect(firstItemCheckbox).toBeInTheDocument();
    expect(firstItemCheckbox).toBeChecked(); // All items selected by default

    // Uncheck the item
    await user.click(firstItemCheckbox!);
    expect(firstItemCheckbox).not.toBeChecked();
  });

  it('shows "Mark as owned" checkbox for selected items', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // "Mark as owned" checkboxes should be visible for selected items
    const ownedCheckboxes = screen.getAllByText('Mark as owned');
    expect(ownedCheckboxes.length).toBeGreaterThan(0);
  });

  it('allows marking items as owned', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // Find an "owned" checkbox (not the item selection checkbox)
    const allCheckboxes = screen.getAllByRole('checkbox');
    const ownedCheckbox = Array.from(allCheckboxes).find((cb) => {
      const label = cb.closest('label');
      return label?.textContent?.includes('Mark as owned');
    });

    expect(ownedCheckbox).toBeInTheDocument();
    expect(ownedCheckbox).not.toBeChecked();

    // Mark as owned
    await user.click(ownedCheckbox!);
    expect(ownedCheckbox).toBeChecked();
  });

  it('shows Select All button when details are shown', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    expect(screen.getByText('Deselect All')).toBeInTheDocument();
  });

  it('allows selecting all items with Select All button', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // First, deselect an item
    const checkboxes = screen.getAllByRole('checkbox');
    const firstItemCheckbox = checkboxes.find((cb) =>
      cb.getAttribute('id')?.startsWith('item-'),
    );
    await user.click(firstItemCheckbox!);
    expect(firstItemCheckbox).not.toBeChecked();

    // Then click Select All
    const selectAllButton = screen.getByText('Select All');
    await user.click(selectAllButton);

    // Item should be selected again
    expect(firstItemCheckbox).toBeChecked();
  });

  it('allows deselecting all items with Deselect All button', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // Click Deselect All
    const deselectAllButton = screen.getByText('Deselect All');
    await user.click(deselectAllButton);

    // All item checkboxes should be unchecked
    const checkboxes = screen.getAllByRole('checkbox');
    const itemCheckboxes = checkboxes.filter((cb) =>
      cb.getAttribute('id')?.startsWith('item-'),
    );
    itemCheckboxes.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('disables Add Items button when no items are selected', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // Deselect all items
    const deselectAllButton = screen.getByText('Deselect All');
    await user.click(deselectAllButton);

    // Add Items button should be disabled
    const addButton = screen.getByText('Add Selected Items');
    expect(addButton).toBeDisabled();
  });

  it('passes selected and owned item IDs to onAddItems', async () => {
    const user = userEvent.setup();
    const onAddItems = vi.fn();
    const onSkip = vi.fn();
    render(
      <QuickSetupScreen
        household={defaultHousehold}
        onAddItems={onAddItems}
        onSkip={onSkip}
      />,
    );

    const toggleButton = screen.getByText('Show Details');
    await user.click(toggleButton);

    // Mark an item as owned
    const allCheckboxes = screen.getAllByRole('checkbox');
    const ownedCheckbox = Array.from(allCheckboxes).find((cb) => {
      const label = cb.closest('label');
      return label?.textContent?.includes('Mark as owned');
    });
    await user.click(ownedCheckbox!);

    // Click Add Items
    const addButton = screen.getByText('Add Selected Items');
    await user.click(addButton);

    expect(onAddItems).toHaveBeenCalledTimes(1);
    const [selectedIds, ownedIds] = onAddItems.mock.calls[0];
    expect(selectedIds).toBeInstanceOf(Set);
    expect(ownedIds).toBeInstanceOf(Set);
    expect(selectedIds.size).toBeGreaterThan(0);
    expect(ownedIds.size).toBeGreaterThan(0);
  });
});
