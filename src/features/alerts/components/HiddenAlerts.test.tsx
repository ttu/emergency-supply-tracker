import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactNode } from 'react';
import { HiddenAlerts } from './HiddenAlerts';
import {
  InventoryContext,
  type InventoryContextValue,
} from '@/features/inventory';
import { HouseholdContext, HouseholdContextValue } from '@/features/household';
import { RecommendedItemsProvider } from '@/features/templates';
import {
  createMockInventoryItem,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import {
  createDateOnly,
  createItemId,
  createCategoryId,
  createAlertId,
  createProductTemplateId,
} from '@/shared/types';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; ns?: string }) => {
      // Category translations
      const categoryTranslations: Record<string, string> = {
        'water-beverages': 'Water & Beverages',
        food: 'Food',
        'cooking-heat': 'Cooking & Heat',
        'light-power': 'Light & Power',
        'communication-info': 'Communication & Info',
        'medical-health': 'Medical & Health',
        'hygiene-sanitation': 'Hygiene & Sanitation',
        'tools-supplies': 'Tools & Supplies',
        'cash-documents': 'Cash & Documents',
      };

      if (options?.ns === 'categories') {
        return categoryTranslations[key] || key;
      }
      if (options?.count !== undefined) {
        return `${key} (${options.count})`;
      }
      return key;
    },
  }),
}));

const mockReactivateAlert = vi.fn();
const mockReactivateAllAlerts = vi.fn();

const createMockInventoryContext = (
  overrides?: Partial<InventoryContextValue>,
): InventoryContextValue => ({
  items: [],
  categories: [],
  addItem: vi.fn(),
  addItems: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  dismissedAlertIds: [],
  dismissAlert: vi.fn(),
  reactivateAlert: mockReactivateAlert,
  reactivateAllAlerts: mockReactivateAllAlerts,
  disabledRecommendedItems: [],
  disableRecommendedItem: vi.fn(),
  enableRecommendedItem: vi.fn(),
  enableAllRecommendedItems: vi.fn(),
  ...overrides,
});

const createMockHouseholdContext = (
  overrides?: Partial<HouseholdContextValue>,
): HouseholdContextValue => ({
  household: createMockHousehold({
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  }),
  updateHousehold: vi.fn(),
  setPreset: vi.fn(),
  ...overrides,
});

const renderWithContext = (
  component: ReactNode,
  inventoryOverrides?: Partial<InventoryContextValue>,
  householdOverrides?: Partial<HouseholdContextValue>,
) => {
  const inventoryContext = createMockInventoryContext(inventoryOverrides);
  const householdContext = createMockHouseholdContext(householdOverrides);
  return render(
    <HouseholdContext.Provider value={householdContext}>
      <RecommendedItemsProvider>
        <InventoryContext.Provider value={inventoryContext}>
          {component}
        </InventoryContext.Provider>
      </RecommendedItemsProvider>
    </HouseholdContext.Provider>,
  );
};

describe('HiddenAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty message when no hidden alerts', () => {
    renderWithContext(<HiddenAlerts />);

    expect(screen.getByText('settings.hiddenAlerts.empty')).toBeInTheDocument();
  });

  it('should show hidden alerts when there are dismissed alert IDs matching actual alerts', () => {
    // Create an item that is out of stock to generate a category-level critical alert
    const outOfStockItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Water',
      categoryId: createCategoryId('water-beverages'),
      quantity: 0,
      itemType: createProductTemplateId('bottled-water'),
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      // Category-level alert ID format
      dismissedAlertIds: [
        createAlertId('category-out-of-stock-water-beverages'),
      ],
    });

    // Should show description with count instead of empty message
    expect(
      screen.queryByText('settings.hiddenAlerts.empty'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/settings.hiddenAlerts.description/),
    ).toBeInTheDocument();
  });

  it('should show critical alert with correct icon', () => {
    const outOfStockItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Water',
      categoryId: createCategoryId('water-beverages'),
      quantity: 0,
      itemType: createProductTemplateId('bottled-water'),
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      dismissedAlertIds: [
        createAlertId('category-out-of-stock-water-beverages'),
      ],
    });

    // Critical alerts show warning emoji
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should show warning alert with correct icon', () => {
    // Use a specific household: 1 adult, 3 days = 9L needed (3L per day)
    // For water-beverages, we need water (9L), milk (2L), and juice (2L) = 13L total
    // With 5L of water and 0L milk/juice, we have 5L out of 13L = 38.5% (between 25% and 50%, so warning threshold)
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    // Create items with low stock to trigger warning (not critical)
    // Total needed: 13L (9L water + 2L milk + 2L juice)
    // For warning alert: need between 25% and 50% = 3.25L to 6.5L
    // Use 5L total = 38.5% (between 25% and 50%, so warning threshold)
    // Water: 5L out of 9L needed
    // Milk: 0L out of 2L needed
    // Juice: 0L out of 2L needed
    // Total: 5L out of 13L = 38.5% (warning threshold, not critical)
    const items = [
      createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: 5, // 5L out of 9L needed
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('item-2'),
        name: 'Milk',
        categoryId: createCategoryId('water-beverages'),
        quantity: 0, // 0L out of 2L needed
        unit: 'liters',
        itemType: createProductTemplateId('long-life-milk'),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('item-3'),
        name: 'Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: 0, // 0L out of 2L needed
        unit: 'liters',
        itemType: createProductTemplateId('long-life-juice'),
        neverExpires: true,
      }),
    ];

    renderWithContext(
      <HiddenAlerts />,
      {
        items,
        dismissedAlertIds: [
          createAlertId('category-low-stock-water-beverages'),
        ],
      },
      { household },
    );

    // Warning alerts show lightning emoji
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('should call reactivateAlert when clicking reactivate button', () => {
    const alertId = createAlertId('category-out-of-stock-water-beverages');
    const outOfStockItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Water',
      categoryId: createCategoryId('water-beverages'),
      quantity: 0,
      itemType: createProductTemplateId('bottled-water'),
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      dismissedAlertIds: [alertId],
    });

    const reactivateButton = screen.getByText(
      'settings.hiddenAlerts.reactivate',
    );
    fireEvent.click(reactivateButton);

    expect(mockReactivateAlert).toHaveBeenCalledWith(alertId);
  });

  it('should not show reactivate all button with only one hidden alert', () => {
    const outOfStockItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Water',
      categoryId: createCategoryId('water-beverages'),
      quantity: 0,
      itemType: createProductTemplateId('bottled-water'),
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      dismissedAlertIds: [
        createAlertId('category-out-of-stock-water-beverages'),
      ],
    });

    expect(
      screen.queryByText('settings.hiddenAlerts.reactivateAll'),
    ).not.toBeInTheDocument();
  });

  it('should show reactivate all button with multiple hidden alerts', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: 0,
        itemType: createProductTemplateId('bottled-water'),
      }),
      createMockInventoryItem({
        id: createItemId('item-2'),
        name: 'Food',
        categoryId: createCategoryId('food'),
        quantity: 0,
        itemType: createProductTemplateId('canned-soup'),
        // Food category uses calorie-based alerts, so with 0 calories it generates
        // category-critically-low-food, not category-out-of-stock-food
      }),
    ];

    renderWithContext(<HiddenAlerts />, {
      items,
      dismissedAlertIds: [
        createAlertId('category-out-of-stock-water-beverages'),
        createAlertId('category-critically-low-food'), // Food category uses calorie-based alerts
      ],
    });

    expect(
      screen.getByText('settings.hiddenAlerts.reactivateAll'),
    ).toBeInTheDocument();
  });

  it('should call reactivateAllAlerts when clicking reactivate all button', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: 0,
        itemType: createProductTemplateId('bottled-water'),
      }),
      createMockInventoryItem({
        id: createItemId('item-2'),
        name: 'Food',
        categoryId: createCategoryId('food'),
        quantity: 0,
        itemType: createProductTemplateId('canned-soup'),
        // Food category uses calorie-based alerts, so with 0 calories it generates
        // category-critically-low-food, not category-out-of-stock-food
      }),
    ];

    renderWithContext(<HiddenAlerts />, {
      items,
      dismissedAlertIds: [
        createAlertId('category-out-of-stock-water-beverages'),
        createAlertId('category-critically-low-food'), // Food category uses calorie-based alerts
      ],
    });

    const reactivateAllButton = screen.getByText(
      'settings.hiddenAlerts.reactivateAll',
    );
    fireEvent.click(reactivateAllButton);

    expect(mockReactivateAllAlerts).toHaveBeenCalled();
  });

  it('should show category name in alert for category-level alerts', () => {
    const outOfStockItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Bottled Water',
      categoryId: createCategoryId('water-beverages'),
      quantity: 0,
      itemType: createProductTemplateId('bottled-water'),
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      dismissedAlertIds: [
        createAlertId('category-out-of-stock-water-beverages'),
      ],
    });

    // Category name is displayed (from STANDARD_CATEGORIES)
    expect(screen.getByText(/Water & Beverages/i)).toBeInTheDocument();
  });

  it('should render alerts list with proper role', () => {
    const outOfStockItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Water',
      categoryId: createCategoryId('water-beverages'),
      quantity: 0,
      itemType: createProductTemplateId('bottled-water'),
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      dismissedAlertIds: [
        createAlertId('category-out-of-stock-water-beverages'),
      ],
    });

    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('should only show alerts that are both dismissed AND still relevant', () => {
    // Item with full stock - no alert should be generated
    const fullyStockedItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Water',
      categoryId: createCategoryId('water-beverages'),
      quantity: 10,
      itemType: createProductTemplateId('bottled-water'),
      neverExpires: true,
    });

    renderWithContext(<HiddenAlerts />, {
      items: [fullyStockedItem],
      // This dismissed ID doesn't match any current alert since item is fully stocked
      dismissedAlertIds: [
        createAlertId('category-out-of-stock-water-beverages'),
      ],
    });

    // Should show empty message since there are no relevant alerts
    expect(screen.getByText('settings.hiddenAlerts.empty')).toBeInTheDocument();
  });

  it('should show expired item alert with item name', () => {
    const expiredItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Canned Food',
      categoryId: createCategoryId('food'),
      quantity: 5,
      itemType: createProductTemplateId('bottled-water'),
      neverExpires: false,
      expirationDate: createDateOnly(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ), // Yesterday
    });

    renderWithContext(<HiddenAlerts />, {
      items: [expiredItem],
      dismissedAlertIds: [createAlertId('expired-item-1')],
    });

    expect(screen.getByText('Canned Food:')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument(); // Critical alert icon
  });
});
