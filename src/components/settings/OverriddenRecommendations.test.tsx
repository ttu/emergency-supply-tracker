import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverriddenRecommendations } from './OverriddenRecommendations';
import { InventoryProvider } from '../../contexts/InventoryProvider';
import { HouseholdProvider } from '../../contexts/HouseholdProvider';
import { SettingsProvider } from '../../contexts/SettingsProvider';
import {
  createMockInventoryItem,
  createMockAppData,
} from '../../utils/test/factories';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'settings.overriddenRecommendations.empty':
          'No overridden recommendations',
        'settings.overriddenRecommendations.description':
          'You have {{count}} overridden recommendation(s).',
        'settings.overriddenRecommendations.unmark': 'Unmark',
        'settings.overriddenRecommendations.unmarkAll': 'Unmark All',
        'categories.cooking-heat': 'Cooking & Heat',
        'products.candles': 'Candles',
      };
      if (options?.count) {
        return translations[key]?.replace('{{count}}', String(options.count));
      }
      if (options?.ns === 'categories') {
        return translations[`categories.${key}`] || key;
      }
      if (options?.ns === 'products') {
        return translations[`products.${key}`] || key;
      }
      return translations[key] || key;
    },
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SettingsProvider>
      <HouseholdProvider>
        <InventoryProvider>{component}</InventoryProvider>
      </HouseholdProvider>
    </SettingsProvider>,
  );
};

describe('OverriddenRecommendations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders empty message when no overridden items', () => {
    const appData = createMockAppData({
      items: [],
    });
    localStorage.setItem('emergencySupplyTracker', JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    expect(
      screen.getByText('No overridden recommendations'),
    ).toBeInTheDocument();
  });

  it('renders list of overridden items', () => {
    const markedItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Candles',
      itemType: 'candles',
      categoryId: 'cooking-heat',
      markedAsEnough: true,
      productTemplateId: 'candles',
    });

    const appData = createMockAppData({
      items: [markedItem],
    });
    localStorage.setItem('emergencySupplyTracker', JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    expect(screen.getByText('Candles')).toBeInTheDocument();
    expect(screen.getByText('(Cooking & Heat)')).toBeInTheDocument();
  });

  it('calls updateItem when unmark button is clicked', async () => {
    const user = userEvent.setup();
    const markedItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Candles',
      itemType: 'candles',
      categoryId: 'cooking-heat',
      markedAsEnough: true,
      productTemplateId: 'candles',
    });

    const appData = createMockAppData({
      items: [markedItem],
    });
    localStorage.setItem('emergencySupplyTracker', JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    const unmarkButton = screen.getByRole('button', { name: /Unmark/i });
    await user.click(unmarkButton);

    // Check that the item is no longer marked as enough
    const storedData = JSON.parse(
      localStorage.getItem('emergencySupplyTracker') || '{}',
    );
    const updatedItem = storedData.items.find(
      (item: { id: string }) => item.id === 'item-1',
    );
    expect(updatedItem.markedAsEnough).toBe(false);
  });

  it('shows unmark all button when multiple items are overridden', () => {
    const markedItem1 = createMockInventoryItem({
      id: 'item-1',
      name: 'Candles',
      itemType: 'candles',
      categoryId: 'cooking-heat',
      markedAsEnough: true,
      productTemplateId: 'candles',
    });

    const markedItem2 = createMockInventoryItem({
      id: 'item-2',
      name: 'Flashlight',
      itemType: 'flashlight',
      categoryId: 'light-power',
      markedAsEnough: true,
      productTemplateId: 'flashlight',
    });

    const appData = createMockAppData({
      items: [markedItem1, markedItem2],
    });
    localStorage.setItem('emergencySupplyTracker', JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    expect(
      screen.getByRole('button', { name: 'Unmark All' }),
    ).toBeInTheDocument();
  });

  it('unmarks all items when unmark all button is clicked', async () => {
    const user = userEvent.setup();
    const markedItem1 = createMockInventoryItem({
      id: 'item-1',
      name: 'Candles',
      itemType: 'candles',
      categoryId: 'cooking-heat',
      markedAsEnough: true,
      productTemplateId: 'candles',
    });

    const markedItem2 = createMockInventoryItem({
      id: 'item-2',
      name: 'Flashlight',
      itemType: 'flashlight',
      categoryId: 'light-power',
      markedAsEnough: true,
      productTemplateId: 'flashlight',
    });

    const appData = createMockAppData({
      items: [markedItem1, markedItem2],
    });
    localStorage.setItem('emergencySupplyTracker', JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    const unmarkAllButton = screen.getByRole('button', { name: 'Unmark All' });
    await user.click(unmarkAllButton);

    // Check that all items are no longer marked as enough
    const storedData = JSON.parse(
      localStorage.getItem('emergencySupplyTracker') || '{}',
    );
    storedData.items.forEach((item: { markedAsEnough?: boolean }) => {
      expect(item.markedAsEnough).toBe(false);
    });
  });

  it('shows item name when no matching recommended item is found', () => {
    const markedItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Custom Item',
      itemType: 'custom',
      categoryId: 'food',
      markedAsEnough: true,
      // No productTemplateId
    });

    const appData = createMockAppData({
      items: [markedItem],
    });
    localStorage.setItem('emergencySupplyTracker', JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    expect(screen.getByText('Custom Item')).toBeInTheDocument();
  });
});
