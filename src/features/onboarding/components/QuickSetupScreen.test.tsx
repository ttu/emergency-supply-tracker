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
          'quickSetup.showDetails': 'Show Details',
          'quickSetup.hideDetails': 'Hide Details',
          'quickSetup.info':
            'These items are recommended based on your household configuration.',
          'quickSetup.noFreezer': 'Frozen items have been excluded.',
          'quickSetup.skip': 'Skip',
          'quickSetup.addItems': 'Add Items',
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

    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
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

  it('calls onAddItems when Add Items button is clicked', async () => {
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

    const addButton = screen.getByText('Add Items');
    await user.click(addButton);

    expect(onAddItems).toHaveBeenCalledTimes(1);
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
});
