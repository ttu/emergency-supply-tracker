import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverriddenRecommendations } from './OverriddenRecommendations';
import { HouseholdProvider } from '@/features/household';
import { InventoryProvider } from '@/features/inventory';
import { SettingsProvider } from '@/features/settings';
import {
  createMockInventoryItem,
  createMockAppData,
} from '@/shared/utils/test/factories';
import { STORAGE_KEY } from '@/shared/utils/storage/localStorage';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
} from '@/shared/types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    expect(
      screen.getByText('No overridden recommendations'),
    ).toBeInTheDocument();
  });

  it('renders list of overridden items', () => {
    const markedItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Candles',
      itemType: createProductTemplateId('candles'),
      categoryId: createCategoryId('cooking-heat'),
      markedAsEnough: true,
      productTemplateId: createProductTemplateId('candles'),
    });

    const appData = createMockAppData({
      items: [markedItem],
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    expect(screen.getByText('Candles')).toBeInTheDocument();
    expect(screen.getByText('(Cooking & Heat)')).toBeInTheDocument();
  });

  it('calls updateItem when unmark button is clicked', async () => {
    const user = userEvent.setup();
    const markedItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Candles',
      itemType: createProductTemplateId('candles'),
      categoryId: createCategoryId('cooking-heat'),
      markedAsEnough: true,
      productTemplateId: createProductTemplateId('candles'),
    });

    const appData = createMockAppData({
      items: [markedItem],
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    const unmarkButton = screen.getByRole('button', { name: /Unmark/i });
    await user.click(unmarkButton);

    // Check that the item is no longer marked as enough
    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const updatedItem = storedData.items.find(
      (item: { id: string }) => item.id === 'item-1',
    );
    expect(updatedItem.markedAsEnough).toBe(false);
  });

  it('shows unmark all button when multiple items are overridden', () => {
    const markedItem1 = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Candles',
      itemType: createProductTemplateId('candles'),
      categoryId: createCategoryId('cooking-heat'),
      markedAsEnough: true,
      productTemplateId: createProductTemplateId('candles'),
    });

    const markedItem2 = createMockInventoryItem({
      id: createItemId('item-2'),
      name: 'Flashlight',
      itemType: createProductTemplateId('flashlight'),
      categoryId: createCategoryId('light-power'),
      markedAsEnough: true,
      productTemplateId: createProductTemplateId('flashlight'),
    });

    const appData = createMockAppData({
      items: [markedItem1, markedItem2],
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    expect(
      screen.getByRole('button', { name: 'Unmark All' }),
    ).toBeInTheDocument();
  });

  it('unmarks all items when unmark all button is clicked', async () => {
    const user = userEvent.setup();
    const markedItem1 = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Candles',
      itemType: createProductTemplateId('candles'),
      categoryId: createCategoryId('cooking-heat'),
      markedAsEnough: true,
      productTemplateId: createProductTemplateId('candles'),
    });

    const markedItem2 = createMockInventoryItem({
      id: createItemId('item-2'),
      name: 'Flashlight',
      itemType: createProductTemplateId('flashlight'),
      categoryId: createCategoryId('light-power'),
      markedAsEnough: true,
      productTemplateId: createProductTemplateId('flashlight'),
    });

    const appData = createMockAppData({
      items: [markedItem1, markedItem2],
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    const unmarkAllButton = screen.getByRole('button', { name: 'Unmark All' });
    await user.click(unmarkAllButton);

    // Check that all items are no longer marked as enough
    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    storedData.items.forEach((item: { markedAsEnough?: boolean }) => {
      expect(item.markedAsEnough).toBe(false);
    });
  });

  it('shows item name when no matching recommended item is found', () => {
    const markedItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Custom Item',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      markedAsEnough: true,
      // No productTemplateId
    });

    const appData = createMockAppData({
      items: [markedItem],
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

    renderWithProviders(<OverriddenRecommendations />);

    expect(screen.getByText('Custom Item')).toBeInTheDocument();
  });
});
