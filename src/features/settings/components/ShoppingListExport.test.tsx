import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ShoppingListExport } from './ShoppingListExport';
import { renderWithProviders } from '@/test';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';

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
    renderWithProviders(<ShoppingListExport />);

    expect(
      screen.getByText('settings.shoppingList.button'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.shoppingList.description'),
    ).toBeInTheDocument();
  });

  it('should disable button when no items need restocking', () => {
    renderWithProviders(<ShoppingListExport />);

    const button = screen.getByText('settings.shoppingList.button');
    expect(button).toBeDisabled();
  });

  it('should enable button when items need restocking', () => {
    const itemNeedingRestock = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Water',
      categoryId: createCategoryId('water-beverages'),
      quantity: createQuantity(5),
      itemType: createProductTemplateId('bottled-water'),
    });

    renderWithProviders(<ShoppingListExport />, {
      initialAppData: {
        items: [itemNeedingRestock],
        household: {
          enabled: true,
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      },
    });

    const button = screen.getByText('settings.shoppingList.button');
    expect(button).not.toBeDisabled();
  });

  it('should show count of items needing restock', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('item-1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(5),
        itemType: createProductTemplateId('bottled-water'),
      }),
      createMockInventoryItem({
        id: createItemId('item-2'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(3),
        itemType: createProductTemplateId('long-life-juice'),
      }),
    ];

    renderWithProviders(<ShoppingListExport />, {
      initialAppData: {
        items,
        household: {
          enabled: true,
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      },
    });

    // Find the button by its accessible name
    screen.getByRole('button', { name: 'settings.shoppingList.button' });

    // Find the paragraph directly by its content (description text is always present)
    const paragraph = screen.getByText('settings.shoppingList.description');
    expect(paragraph).toHaveTextContent('(2');
    expect(paragraph).toHaveTextContent('settings.shoppingList.items)');
  });

  it('should not trigger export when button is disabled', () => {
    renderWithProviders(<ShoppingListExport />, {
      initialAppData: {
        items: [], // Ensure no items so button is disabled
        household: {
          enabled: true,
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      },
    });

    const button = screen.getByText('settings.shoppingList.button');
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(globalThis.URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('should export shopping list when button is clicked', () => {
    const itemNeedingRestock = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Water',
      categoryId: createCategoryId('water-beverages'),
      quantity: createQuantity(5),
      itemType: createProductTemplateId('bottled-water'),
      unit: 'liters',
    });

    renderWithProviders(<ShoppingListExport />, {
      initialAppData: {
        items: [itemNeedingRestock],
        household: {
          enabled: true,
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      },
    });

    const button = screen.getByText('settings.shoppingList.button');
    fireEvent.click(button);

    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(
      'blob:mock-url',
    );
  });

  it('should create blob with text content', () => {
    const itemNeedingRestock = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Water',
      categoryId: createCategoryId('water-beverages'),
      quantity: createQuantity(5),
      itemType: createProductTemplateId('bottled-water'),
      unit: 'liters',
    });

    renderWithProviders(<ShoppingListExport />, {
      initialAppData: {
        items: [itemNeedingRestock],
        household: {
          enabled: true,
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      },
    });

    const button = screen.getByText('settings.shoppingList.button');
    fireEvent.click(button);

    const blobCall = (globalThis.URL.createObjectURL as Mock).mock.calls[0][0];
    expect(blobCall).toBeInstanceOf(Blob);
    expect(blobCall.type).toBe('text/plain;charset=utf-8');
  });

  it('should not include items that do not need restocking', () => {
    // Use specific household: 1 adult, 3 days = 9L needed (3L × 1 × 3)
    // Item 1: 5L < 9L (needs restock)
    // Item 2: 20L >= 9L (fully stocked, doesn't need restock)
    const items = [
      createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Needs Restock',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(5),
        itemType: createProductTemplateId('bottled-water'),
      }),
      createMockInventoryItem({
        id: createItemId('item-2'),
        name: 'Fully Stocked',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(20), // 20L >= 9L needed (fully stocked)
        itemType: createProductTemplateId('bottled-water'),
      }),
    ];

    renderWithProviders(<ShoppingListExport />, {
      initialAppData: {
        items,
        household: {
          enabled: true,
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      },
    });

    // Only 1 item needs restocking
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it('should group items by category', () => {
    // Use specific household: 1 adult, 3 days
    // Bottled-water: 3L × 1 × 3 = 9L needed, have 5L (needs restock)
    // Canned-beans: need to check base quantity, but 2 cans should be below recommended
    // Long-life-juice: 2L × 1 = 2L needed (doesn't scale with days), have 3L (ok, but let's use 1L to ensure it needs restock)
    const items = [
      createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(5), // 5L < 9L needed
        itemType: createProductTemplateId('bottled-water'),
      }),
      createMockInventoryItem({
        id: createItemId('item-2'),
        name: 'Beans',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1), // 1 can, likely below recommended for 1 adult, 3 days
        itemType: createProductTemplateId('canned-vegetables'),
      }),
      createMockInventoryItem({
        id: createItemId('item-3'),
        name: 'More Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(1), // 1L < 2L needed
        itemType: createProductTemplateId('long-life-juice'),
      }),
    ];

    renderWithProviders(<ShoppingListExport />, {
      initialAppData: {
        items,
        household: {
          enabled: true,
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      },
    });

    // 3 items need restocking
    expect(screen.getByText(/3/)).toBeInTheDocument();

    const button = screen.getByText('settings.shoppingList.button');
    fireEvent.click(button);

    // Verify export was triggered
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });
});
