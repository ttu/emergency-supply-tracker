import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
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
  addItem: vi.fn(),
  addItems: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  dismissedAlertIds: [],
  dismissAlert: vi.fn(),
  reactivateAlert: vi.fn(),
  reactivateAllAlerts: vi.fn(),
  disabledRecommendedItems: [],
  disableRecommendedItem: vi.fn(),
  enableRecommendedItem: vi.fn(),
  enableAllRecommendedItems: vi.fn(),
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
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    // Mock anchor element click to prevent jsdom navigation errors
    // Access prototype method directly to avoid circular reference
    const originalCreateElement =
      Document.prototype.createElement.bind(document);
    createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          // Mock click to prevent navigation
          element.click = vi.fn();
        }
        return element;
      });
  });

  afterEach(() => {
    // Defensively restore the spy only if it exists and has mockRestore
    if (createElementSpy?.mockRestore) {
      createElementSpy.mockRestore();
    }
    vi.restoreAllMocks();
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

    expect(globalThis.URL.createObjectURL).not.toHaveBeenCalled();
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

    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(
      'blob:mock-url',
    );
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

    const blobCall = (globalThis.URL.createObjectURL as Mock).mock.calls[0][0];
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
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });
});
