import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickSetupScreen } from './QuickSetupScreen';
import type { HouseholdConfig } from '../../types';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
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
        'categories.water-beverages': 'Water & Beverages',
        'categories.food': 'Food',
        'categories.cooking-heat': 'Cooking & Heat',
        'products.bottled-water': 'Bottled Water',
        'products.canned-soup': 'Canned Soup',
        'units.liters': 'L',
        'units.cans': 'cans',
      };
      return translations[key] || key;
    },
  }),
}));

describe('QuickSetupScreen', () => {
  const defaultHousehold: HouseholdConfig = {
    adults: 2,
    children: 1,
    supplyDurationDays: 3,
    hasFreezer: true,
  };

  it('renders title and subtitle', () => {
    const onAddItems = jest.fn();
    const onSkip = jest.fn();
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
    const onAddItems = jest.fn();
    const onSkip = jest.fn();
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
    const onAddItems = jest.fn();
    const onSkip = jest.fn();
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
    const onAddItems = jest.fn();
    const onSkip = jest.fn();
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
    const onAddItems = jest.fn();
    const onSkip = jest.fn();
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
    const onAddItems = jest.fn();
    const onSkip = jest.fn();
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
    const onAddItems = jest.fn();
    const onSkip = jest.fn();
    const householdWithoutFreezer: HouseholdConfig = {
      ...defaultHousehold,
      hasFreezer: false,
    };

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
    const onAddItems = jest.fn();
    const onSkip = jest.fn();
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
    const onAddItems = jest.fn();
    const onSkip = jest.fn();
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
    const onAddItems = jest.fn();
    const onSkip = jest.fn();
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
});
