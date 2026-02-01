import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryProvider } from './provider';
import { useInventory } from './hooks/useInventory';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import * as localStorage from '@/shared/utils/storage/localStorage';
import * as analytics from '@/shared/utils/analytics';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
  createQuantity,
} from '@/shared/types';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  getAppData: vi.fn(),
  saveAppData: vi.fn(),
  createDefaultAppData: vi.fn(() => ({
    version: CURRENT_SCHEMA_VERSION,
    household: {
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    },
    settings: {
      language: 'en',
      theme: 'light',
      highContrast: false,
      advancedFeatures: {},
    },
    items: [],
    customCategories: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    lastModified: new Date().toISOString(),
  })),
}));

// Mock analytics
vi.mock('@/shared/utils/analytics', () => ({
  trackItemAdded: vi.fn(),
  trackItemDeleted: vi.fn(),
  trackItemsBulkAdded: vi.fn(),
}));

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-123';
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => mockUUID),
  },
  writable: true,
  configurable: true,
});

// Test component that uses the context
function TestComponent({
  onContextReady,
}: {
  onContextReady?: (ctx: ReturnType<typeof useInventory>) => void;
}) {
  const context = useInventory();

  if (onContextReady) {
    onContextReady(context);
  }

  return (
    <div>
      <div data-testid="items-count">{context.items.length}</div>
      <div data-testid="dismissed-count">
        {context.dismissedAlertIds.length}
      </div>
      <div data-testid="disabled-count">
        {context.disabledRecommendedItems.length}
      </div>
      <div data-testid="disabled-categories-count">
        {context.disabledCategories.length}
      </div>
      <button
        onClick={() =>
          context.addItem({
            name: 'Test Item',
            itemType: 'custom',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(5),
            unit: 'pieces',

            neverExpires: true,
          })
        }
      >
        Add Item
      </button>
      <button onClick={() => context.dismissAlert(createAlertId('alert-1'))}>
        Dismiss Alert
      </button>
      <button onClick={() => context.reactivateAlert(createAlertId('alert-1'))}>
        Reactivate Alert
      </button>
      <button onClick={() => context.reactivateAllAlerts()}>
        Reactivate All
      </button>
      <button
        onClick={() =>
          context.disableRecommendedItem(createProductTemplateId('item-1'))
        }
      >
        Disable Recommended
      </button>
      <button
        onClick={() =>
          context.enableRecommendedItem(createProductTemplateId('item-1'))
        }
      >
        Enable Recommended
      </button>
      <button onClick={() => context.enableAllRecommendedItems()}>
        Enable All Recommended
      </button>
      <button onClick={() => context.disableCategory('food')}>
        Disable Category
      </button>
      <button onClick={() => context.enableCategory('food')}>
        Enable Category
      </button>
      <button onClick={() => context.enableAllCategories()}>
        Enable All Categories
      </button>
    </div>
  );
}

describe('InventoryProvider', () => {
  const mockGetAppData = localStorage.getAppData as Mock;
  const mockSaveAppData = localStorage.saveAppData as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppData.mockReturnValue(null);
  });

  it('should provide items from localStorage', () => {
    const existingItems = [
      createMockInventoryItem({
        id: createItemId('existing-1'),
        name: 'Existing Item',
      }),
    ];
    mockGetAppData.mockReturnValue({
      items: existingItems,
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
  });

  it('should provide categories', () => {
    let contextCategories: unknown[];

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent
            onContextReady={(ctx) => {
              contextCategories = ctx.categories;
            }}
          />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(contextCategories!).toBeDefined();
    expect(contextCategories!.length).toBeGreaterThan(0);
  });

  it('should add item correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue(null);

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent('0');

    await user.click(screen.getByText('Add Item'));

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    expect(analytics.trackItemAdded).toHaveBeenCalledWith('Test Item', 'food');
  });

  it('should update item correctly', async () => {
    const existingItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'Original Name',
    });
    mockGetAppData.mockReturnValue({
      items: [existingItem],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
    });

    let updateItemFn: (
      id: ReturnType<typeof createItemId>,
      updates: Partial<typeof existingItem>,
    ) => void;

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent
            onContextReady={(ctx) => {
              updateItemFn = ctx.updateItem;
            }}
          />
        </InventoryProvider>
      </NotificationProvider>,
    );

    act(() => {
      updateItemFn(createItemId('item-1'), { name: 'Updated Name' });
    });

    await waitFor(() => {
      expect(mockSaveAppData).toHaveBeenCalled();
    });
  });

  it('should delete item correctly', async () => {
    const existingItem = createMockInventoryItem({
      id: createItemId('item-1'),
      name: 'To Delete',
      categoryId: createCategoryId('food'),
    });
    mockGetAppData.mockReturnValue({
      items: [existingItem],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
    });

    let deleteItemFn: (id: ReturnType<typeof createItemId>) => void;

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent
            onContextReady={(ctx) => {
              deleteItemFn = ctx.deleteItem;
            }}
          />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');

    act(() => {
      deleteItemFn(createItemId('item-1'));
    });

    expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    expect(analytics.trackItemDeleted).toHaveBeenCalledWith(
      'To Delete',
      'food',
    );
  });

  it('should add multiple items with addItems', async () => {
    mockGetAppData.mockReturnValue(null);

    let addItemsFn: (
      items: ReturnType<typeof createMockInventoryItem>[],
    ) => void;

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent
            onContextReady={(ctx) => {
              addItemsFn = ctx.addItems;
            }}
          />
        </InventoryProvider>
      </NotificationProvider>,
    );

    const newItems = [
      createMockInventoryItem({ id: createItemId('bulk-1'), name: 'Bulk 1' }),
      createMockInventoryItem({ id: createItemId('bulk-2'), name: 'Bulk 2' }),
    ];

    act(() => {
      addItemsFn(newItems);
    });

    expect(screen.getByTestId('items-count')).toHaveTextContent('2');
    expect(analytics.trackItemsBulkAdded).toHaveBeenCalledWith(2);
  });

  it('should dismiss alert correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('dismissed-count')).toHaveTextContent('0');

    await user.click(screen.getByText('Dismiss Alert'));

    expect(screen.getByTestId('dismissed-count')).toHaveTextContent('1');
  });

  it('should not duplicate dismissed alert', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    await user.click(screen.getByText('Dismiss Alert'));
    await user.click(screen.getByText('Dismiss Alert'));

    expect(screen.getByTestId('dismissed-count')).toHaveTextContent('1');
  });

  it('should reactivate alert correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: ['alert-1'],
      disabledRecommendedItems: [],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('dismissed-count')).toHaveTextContent('1');

    await user.click(screen.getByText('Reactivate Alert'));

    expect(screen.getByTestId('dismissed-count')).toHaveTextContent('0');
  });

  it('should reactivate all alerts correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: ['alert-1', 'alert-2', 'alert-3'],
      disabledRecommendedItems: [],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('dismissed-count')).toHaveTextContent('3');

    await user.click(screen.getByText('Reactivate All'));

    expect(screen.getByTestId('dismissed-count')).toHaveTextContent('0');
  });

  it('should disable recommended item correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('0');

    await user.click(screen.getByText('Disable Recommended'));

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('1');
  });

  it('should not duplicate disabled recommended item', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    await user.click(screen.getByText('Disable Recommended'));
    await user.click(screen.getByText('Disable Recommended'));

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('1');
  });

  it('should enable recommended item correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: ['item-1'],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('1');

    await user.click(screen.getByText('Enable Recommended'));

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('0');
  });

  it('should enable all recommended items correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: ['item-1', 'item-2', 'item-3'],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('3');

    await user.click(screen.getByText('Enable All Recommended'));

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('0');
  });

  it('should save to localStorage when items change', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue(null);

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    await user.click(screen.getByText('Add Item'));

    await waitFor(() => {
      expect(mockSaveAppData).toHaveBeenCalled();
    });
  });

  it('should load dismissedAlertIds from localStorage', () => {
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: ['alert-1', 'alert-2'],
      disabledRecommendedItems: [],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('dismissed-count')).toHaveTextContent('2');
  });

  it('should load disabledRecommendedItems from localStorage', () => {
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: ['item-1', 'item-2', 'item-3'],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('3');
  });

  it('should disable category correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      disabledCategories: [],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('disabled-categories-count')).toHaveTextContent(
      '0',
    );

    await user.click(screen.getByText('Disable Category'));

    expect(screen.getByTestId('disabled-categories-count')).toHaveTextContent(
      '1',
    );
  });

  it('should not duplicate disabled category', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      disabledCategories: [],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    await user.click(screen.getByText('Disable Category'));
    await user.click(screen.getByText('Disable Category'));

    expect(screen.getByTestId('disabled-categories-count')).toHaveTextContent(
      '1',
    );
  });

  it('should enable category correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      disabledCategories: ['food'],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('disabled-categories-count')).toHaveTextContent(
      '1',
    );

    await user.click(screen.getByText('Enable Category'));

    expect(screen.getByTestId('disabled-categories-count')).toHaveTextContent(
      '0',
    );
  });

  it('should enable all categories correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      disabledCategories: ['food', 'water-beverages', 'cooking-heat'],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('disabled-categories-count')).toHaveTextContent(
      '3',
    );

    await user.click(screen.getByText('Enable All Categories'));

    expect(screen.getByTestId('disabled-categories-count')).toHaveTextContent(
      '0',
    );
  });

  it('should load disabledCategories from localStorage', () => {
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      disabledCategories: ['food', 'water-beverages'],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('disabled-categories-count')).toHaveTextContent(
      '2',
    );
  });

  it('should filter out invalid category IDs from localStorage', () => {
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      disabledCategories: ['food', 'invalid-category', 'water-beverages'],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <TestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    // Only valid categories should be loaded (food and water-beverages)
    expect(screen.getByTestId('disabled-categories-count')).toHaveTextContent(
      '2',
    );
  });
});

describe('Custom Category Management', () => {
  let mockGetAppData: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppData = vi.mocked(localStorage.getAppData);
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      disabledCategories: [],
      customCategories: [],
    });
  });

  // Test component that exposes custom category functionality
  function CustomCategoryTestComponent() {
    const {
      customCategories,
      categories,
      items,
      addCustomCategory,
      updateCustomCategory,
      deleteCustomCategory,
      addItem,
    } = useInventory();

    return (
      <div>
        <span data-testid="custom-categories-count">
          {customCategories.length}
        </span>
        <span data-testid="total-categories-count">{categories.length}</span>
        <span data-testid="custom-category-names">
          {customCategories.map((c) => c.name).join(',')}
        </span>
        <button
          onClick={() =>
            addCustomCategory({
              name: 'Test Category',
              icon: '🏕️',
              isCustom: true,
            })
          }
        >
          Add Custom Category
        </button>
        <button
          onClick={() => {
            if (customCategories[0]) {
              updateCustomCategory(customCategories[0].id, { name: 'Updated' });
            }
          }}
        >
          Update Category
        </button>
        <button
          onClick={() => {
            if (customCategories[0]) {
              deleteCustomCategory(customCategories[0].id);
            }
          }}
        >
          Delete Category
        </button>
        <button
          onClick={() => {
            if (customCategories[0]) {
              addItem({
                name: 'Test Item',
                categoryId: customCategories[0].id,
                quantity: createQuantity(1),
                unit: 'pieces',
                itemType: 'custom',
              });
            }
          }}
        >
          Add Item To Custom Category
        </button>
        <span data-testid="items-count">{items.length}</span>
      </div>
    );
  }

  it('should add a custom category', async () => {
    const user = userEvent.setup();

    render(
      <NotificationProvider>
        <InventoryProvider>
          <CustomCategoryTestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('custom-categories-count')).toHaveTextContent(
      '0',
    );

    await user.click(screen.getByText('Add Custom Category'));

    expect(screen.getByTestId('custom-categories-count')).toHaveTextContent(
      '1',
    );
    expect(screen.getByTestId('custom-category-names')).toHaveTextContent(
      'Test Category',
    );
  });

  it('should update a custom category', async () => {
    const user = userEvent.setup();

    render(
      <NotificationProvider>
        <InventoryProvider>
          <CustomCategoryTestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    // First add a category
    await user.click(screen.getByText('Add Custom Category'));
    expect(screen.getByTestId('custom-category-names')).toHaveTextContent(
      'Test Category',
    );

    // Then update it
    await user.click(screen.getByText('Update Category'));
    expect(screen.getByTestId('custom-category-names')).toHaveTextContent(
      'Updated',
    );
  });

  it('should delete a custom category when no items use it', async () => {
    const user = userEvent.setup();

    render(
      <NotificationProvider>
        <InventoryProvider>
          <CustomCategoryTestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    // Add a category
    await user.click(screen.getByText('Add Custom Category'));
    expect(screen.getByTestId('custom-categories-count')).toHaveTextContent(
      '1',
    );

    // Delete it
    await user.click(screen.getByText('Delete Category'));
    expect(screen.getByTestId('custom-categories-count')).toHaveTextContent(
      '0',
    );
  });

  it('should include custom categories in total categories count', async () => {
    const user = userEvent.setup();

    render(
      <NotificationProvider>
        <InventoryProvider>
          <CustomCategoryTestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    // Standard categories only (10)
    const initialCount = Number.parseInt(
      screen.getByTestId('total-categories-count').textContent || '0',
    );
    expect(initialCount).toBe(10);

    // Add custom category
    await user.click(screen.getByText('Add Custom Category'));

    // Now 11 categories
    expect(screen.getByTestId('total-categories-count')).toHaveTextContent(
      '11',
    );
  });

  it('should load custom categories from localStorage', () => {
    mockGetAppData.mockReturnValue({
      items: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      disabledCategories: [],
      customCategories: [
        {
          id: createCategoryId('custom-1'),
          name: 'Custom One',
          icon: '🏕️',
          isCustom: true,
        },
        {
          id: createCategoryId('custom-2'),
          name: 'Custom Two',
          icon: '🚗',
          isCustom: true,
        },
      ],
    });

    render(
      <NotificationProvider>
        <InventoryProvider>
          <CustomCategoryTestComponent />
        </InventoryProvider>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('custom-categories-count')).toHaveTextContent(
      '2',
    );
    expect(screen.getByTestId('total-categories-count')).toHaveTextContent(
      '12',
    );
  });
});
