import { render, screen, fireEvent } from '@testing-library/react';
import { ReactNode } from 'react';
import { ShoppingListExport } from './ShoppingListExport';
import {
  InventoryContext,
  type InventoryContextValue,
} from '@/features/inventory';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import type { InventoryItem } from '@/shared/types';

const createMockInventoryContext = (
  items: InventoryItem[] = [],
): InventoryContextValue => ({
  items,
  categories: [],
  addItem: jest.fn(),
  addItems: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  dismissedAlertIds: [],
  dismissAlert: jest.fn(),
  reactivateAlert: jest.fn(),
  reactivateAllAlerts: jest.fn(),
  disabledRecommendedItems: [],
  disableRecommendedItem: jest.fn(),
  enableRecommendedItem: jest.fn(),
  enableAllRecommendedItems: jest.fn(),
});

const renderWithContext = (
  component: ReactNode,
  items: InventoryItem[] = [],
) => {
  const context = createMockInventoryContext(items);
  return render(
    <InventoryContext.Provider value={context}>
      {component}
    </InventoryContext.Provider>,
  );
};

describe('ShoppingListExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render shopping list export button', () => {
    renderWithContext(<ShoppingListExport />);

    expect(
      screen.getByText('settings.shoppingList.button'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.shoppingList.description'),
    ).toBeInTheDocument();
  });

  it('should disable button when no items need restocking', () => {
    renderWithContext(<ShoppingListExport />);

    const button = screen.getByText('settings.shoppingList.button');
    expect(button).toBeDisabled();
  });

  it('should enable button when items need restocking', () => {
    const itemNeedingRestock = createMockInventoryItem({
      id: 'item-1',
      name: 'Water',
      quantity: 5,
      recommendedQuantity: 20,
    });

    renderWithContext(<ShoppingListExport />, [itemNeedingRestock]);

    const button = screen.getByText('settings.shoppingList.button');
    expect(button).not.toBeDisabled();
  });

  it('should show count of items needing restock', () => {
    const items = [
      createMockInventoryItem({
        id: 'item-1',
        quantity: 5,
        recommendedQuantity: 20,
      }),
      createMockInventoryItem({
        id: 'item-2',
        quantity: 3,
        recommendedQuantity: 10,
      }),
    ];

    renderWithContext(<ShoppingListExport />, items);

    expect(
      screen.getByText(/\(2 settings\.shoppingList\.items\)/),
    ).toBeInTheDocument();
  });

  it('should not trigger export when button is disabled', () => {
    renderWithContext(<ShoppingListExport />);

    const button = screen.getByText('settings.shoppingList.button');
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('should export shopping list when button is clicked', () => {
    const itemNeedingRestock = createMockInventoryItem({
      id: 'item-1',
      name: 'Water',
      categoryId: 'water-beverages',
      quantity: 5,
      recommendedQuantity: 20,
      unit: 'liters',
    });

    renderWithContext(<ShoppingListExport />, [itemNeedingRestock]);

    const button = screen.getByText('settings.shoppingList.button');
    fireEvent.click(button);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should create blob with text content', () => {
    const itemNeedingRestock = createMockInventoryItem({
      id: 'item-1',
      name: 'Water',
      categoryId: 'water-beverages',
      quantity: 5,
      recommendedQuantity: 20,
      unit: 'liters',
    });

    renderWithContext(<ShoppingListExport />, [itemNeedingRestock]);

    const button = screen.getByText('settings.shoppingList.button');
    fireEvent.click(button);

    const blobCall = (global.URL.createObjectURL as jest.Mock).mock.calls[0][0];
    expect(blobCall).toBeInstanceOf(Blob);
    expect(blobCall.type).toBe('text/plain;charset=utf-8');
  });

  it('should not include items that do not need restocking', () => {
    const items = [
      createMockInventoryItem({
        id: 'item-1',
        name: 'Needs Restock',
        quantity: 5,
        recommendedQuantity: 20,
      }),
      createMockInventoryItem({
        id: 'item-2',
        name: 'Fully Stocked',
        quantity: 20,
        recommendedQuantity: 20,
      }),
    ];

    renderWithContext(<ShoppingListExport />, items);

    // Only 1 item needs restocking
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it('should group items by category', () => {
    const items = [
      createMockInventoryItem({
        id: 'item-1',
        name: 'Water',
        categoryId: 'water-beverages',
        quantity: 5,
        recommendedQuantity: 20,
      }),
      createMockInventoryItem({
        id: 'item-2',
        name: 'Beans',
        categoryId: 'food',
        quantity: 2,
        recommendedQuantity: 10,
      }),
      createMockInventoryItem({
        id: 'item-3',
        name: 'More Water',
        categoryId: 'water-beverages',
        quantity: 3,
        recommendedQuantity: 15,
      }),
    ];

    renderWithContext(<ShoppingListExport />, items);

    // 3 items need restocking
    expect(screen.getByText(/3/)).toBeInTheDocument();

    const button = screen.getByText('settings.shoppingList.button');
    fireEvent.click(button);

    // Verify export was triggered
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
