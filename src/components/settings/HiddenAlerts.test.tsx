import { render, screen, fireEvent } from '@testing-library/react';
import { ReactNode } from 'react';
import { HiddenAlerts } from './HiddenAlerts';
import {
  InventoryContext,
  InventoryContextValue,
} from '../../contexts/InventoryContext';
import {
  HouseholdContext,
  HouseholdContextValue,
} from '../../contexts/HouseholdContext';
import {
  createMockInventoryItem,
  createMockHousehold,
} from '../../utils/test/factories';

// Mock i18next
jest.mock('react-i18next', () => ({
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

const mockReactivateAlert = jest.fn();
const mockReactivateAllAlerts = jest.fn();

const createMockInventoryContext = (
  overrides?: Partial<InventoryContextValue>,
): InventoryContextValue => ({
  items: [],
  categories: [],
  addItem: jest.fn(),
  addItems: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  dismissedAlertIds: [],
  dismissAlert: jest.fn(),
  reactivateAlert: mockReactivateAlert,
  reactivateAllAlerts: mockReactivateAllAlerts,
  disabledRecommendedItems: [],
  disableRecommendedItem: jest.fn(),
  enableRecommendedItem: jest.fn(),
  enableAllRecommendedItems: jest.fn(),
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
  updateHousehold: jest.fn(),
  setPreset: jest.fn(),
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
      <InventoryContext.Provider value={inventoryContext}>
        {component}
      </InventoryContext.Provider>
    </HouseholdContext.Provider>,
  );
};

describe('HiddenAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show empty message when no hidden alerts', () => {
    renderWithContext(<HiddenAlerts />);

    expect(screen.getByText('settings.hiddenAlerts.empty')).toBeInTheDocument();
  });

  it('should show hidden alerts when there are dismissed alert IDs matching actual alerts', () => {
    // Create an item that is out of stock to generate a category-level critical alert
    const outOfStockItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Water',
      categoryId: 'water-beverages',
      quantity: 0,
      recommendedQuantity: 10,
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      // Category-level alert ID format
      dismissedAlertIds: ['category-out-of-stock-water-beverages'],
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
      id: 'item-1',
      name: 'Water',
      categoryId: 'water-beverages',
      quantity: 0,
      recommendedQuantity: 10,
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      dismissedAlertIds: ['category-out-of-stock-water-beverages'],
    });

    // Critical alerts show warning emoji
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should show warning alert with correct icon', () => {
    // Create item with 30% stock to trigger low-stock warning (below 50% threshold)
    const lowStockItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Water',
      categoryId: 'water-beverages',
      quantity: 3,
      recommendedQuantity: 10,
      neverExpires: true,
    });

    renderWithContext(<HiddenAlerts />, {
      items: [lowStockItem],
      dismissedAlertIds: ['category-low-stock-water-beverages'],
    });

    // Warning alerts show lightning emoji
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('should call reactivateAlert when clicking reactivate button', () => {
    const outOfStockItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Water',
      categoryId: 'water-beverages',
      quantity: 0,
      recommendedQuantity: 10,
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      dismissedAlertIds: ['category-out-of-stock-water-beverages'],
    });

    const reactivateButton = screen.getByText(
      'settings.hiddenAlerts.reactivate',
    );
    fireEvent.click(reactivateButton);

    expect(mockReactivateAlert).toHaveBeenCalledWith(
      'category-out-of-stock-water-beverages',
    );
  });

  it('should not show reactivate all button with only one hidden alert', () => {
    const outOfStockItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Water',
      categoryId: 'water-beverages',
      quantity: 0,
      recommendedQuantity: 10,
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      dismissedAlertIds: ['category-out-of-stock-water-beverages'],
    });

    expect(
      screen.queryByText('settings.hiddenAlerts.reactivateAll'),
    ).not.toBeInTheDocument();
  });

  it('should show reactivate all button with multiple hidden alerts', () => {
    const items = [
      createMockInventoryItem({
        id: 'item-1',
        name: 'Water',
        categoryId: 'water-beverages',
        quantity: 0,
        recommendedQuantity: 10,
      }),
      createMockInventoryItem({
        id: 'item-2',
        name: 'Food',
        categoryId: 'food',
        quantity: 0,
        recommendedQuantity: 10,
      }),
    ];

    renderWithContext(<HiddenAlerts />, {
      items,
      dismissedAlertIds: [
        'category-out-of-stock-water-beverages',
        'category-out-of-stock-food',
      ],
    });

    expect(
      screen.getByText('settings.hiddenAlerts.reactivateAll'),
    ).toBeInTheDocument();
  });

  it('should call reactivateAllAlerts when clicking reactivate all button', () => {
    const items = [
      createMockInventoryItem({
        id: 'item-1',
        name: 'Water',
        categoryId: 'water-beverages',
        quantity: 0,
        recommendedQuantity: 10,
      }),
      createMockInventoryItem({
        id: 'item-2',
        name: 'Food',
        categoryId: 'food',
        quantity: 0,
        recommendedQuantity: 10,
      }),
    ];

    renderWithContext(<HiddenAlerts />, {
      items,
      dismissedAlertIds: [
        'category-out-of-stock-water-beverages',
        'category-out-of-stock-food',
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
      id: 'item-1',
      name: 'Bottled Water',
      categoryId: 'water-beverages',
      quantity: 0,
      recommendedQuantity: 10,
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      dismissedAlertIds: ['category-out-of-stock-water-beverages'],
    });

    // Category name is displayed (from STANDARD_CATEGORIES)
    expect(screen.getByText(/Water & Beverages/i)).toBeInTheDocument();
  });

  it('should render alerts list with proper role', () => {
    const outOfStockItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Water',
      categoryId: 'water-beverages',
      quantity: 0,
      recommendedQuantity: 10,
    });

    renderWithContext(<HiddenAlerts />, {
      items: [outOfStockItem],
      dismissedAlertIds: ['category-out-of-stock-water-beverages'],
    });

    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('should only show alerts that are both dismissed AND still relevant', () => {
    // Item with full stock - no alert should be generated
    const fullyStockedItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Water',
      categoryId: 'water-beverages',
      quantity: 10,
      recommendedQuantity: 10,
      neverExpires: true,
    });

    renderWithContext(<HiddenAlerts />, {
      items: [fullyStockedItem],
      // This dismissed ID doesn't match any current alert since item is fully stocked
      dismissedAlertIds: ['category-out-of-stock-water-beverages'],
    });

    // Should show empty message since there are no relevant alerts
    expect(screen.getByText('settings.hiddenAlerts.empty')).toBeInTheDocument();
  });

  it('should show expired item alert with item name', () => {
    const expiredItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Canned Food',
      categoryId: 'food',
      quantity: 5,
      recommendedQuantity: 5,
      neverExpires: false,
      expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    });

    renderWithContext(<HiddenAlerts />, {
      items: [expiredItem],
      dismissedAlertIds: ['expired-item-1'],
    });

    expect(screen.getByText('Canned Food:')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument(); // Critical alert icon
  });
});
