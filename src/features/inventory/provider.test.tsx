import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryProvider } from './provider';
import { useInventory } from './hooks/useInventory';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import * as localStorage from '@/shared/utils/storage/localStorage';
import * as analytics from '@/shared/utils/analytics';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  getAppData: vi.fn(),
  saveAppData: vi.fn(),
  createDefaultAppData: vi.fn(() => ({
    version: '1.0.0',
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
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => mockUUID),
  },
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
      <button
        onClick={() =>
          context.addItem({
            name: 'Test Item',
            itemType: 'test',
            categoryId: 'food',
            quantity: 5,
            unit: 'pieces',
            recommendedQuantity: 10,
            neverExpires: true,
          })
        }
      >
        Add Item
      </button>
      <button onClick={() => context.dismissAlert('alert-1')}>
        Dismiss Alert
      </button>
      <button onClick={() => context.reactivateAlert('alert-1')}>
        Reactivate Alert
      </button>
      <button onClick={() => context.reactivateAllAlerts()}>
        Reactivate All
      </button>
      <button onClick={() => context.disableRecommendedItem('item-1')}>
        Disable Recommended
      </button>
      <button onClick={() => context.enableRecommendedItem('item-1')}>
        Enable Recommended
      </button>
      <button onClick={() => context.enableAllRecommendedItems()}>
        Enable All Recommended
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
      createMockInventoryItem({ id: 'existing-1', name: 'Existing Item' }),
    ];
    mockGetAppData.mockReturnValue({
      items: existingItems,
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
    });

    render(
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
  });

  it('should provide categories', () => {
    let contextCategories: unknown[];

    render(
      <InventoryProvider>
        <TestComponent
          onContextReady={(ctx) => {
            contextCategories = ctx.categories;
          }}
        />
      </InventoryProvider>,
    );

    expect(contextCategories!).toBeDefined();
    expect(contextCategories!.length).toBeGreaterThan(0);
  });

  it('should add item correctly', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue(null);

    render(
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent('0');

    await user.click(screen.getByText('Add Item'));

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    expect(analytics.trackItemAdded).toHaveBeenCalledWith('Test Item', 'food');
  });

  it('should update item correctly', async () => {
    const existingItem = createMockInventoryItem({
      id: 'item-1',
      name: 'Original Name',
    });
    mockGetAppData.mockReturnValue({
      items: [existingItem],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
    });

    let updateItemFn: (
      id: string,
      updates: Partial<typeof existingItem>,
    ) => void;

    render(
      <InventoryProvider>
        <TestComponent
          onContextReady={(ctx) => {
            updateItemFn = ctx.updateItem;
          }}
        />
      </InventoryProvider>,
    );

    act(() => {
      updateItemFn('item-1', { name: 'Updated Name' });
    });

    await waitFor(() => {
      expect(mockSaveAppData).toHaveBeenCalled();
    });
  });

  it('should delete item correctly', async () => {
    const existingItem = createMockInventoryItem({
      id: 'item-1',
      name: 'To Delete',
    });
    mockGetAppData.mockReturnValue({
      items: [existingItem],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
    });

    let deleteItemFn: (id: string) => void;

    render(
      <InventoryProvider>
        <TestComponent
          onContextReady={(ctx) => {
            deleteItemFn = ctx.deleteItem;
          }}
        />
      </InventoryProvider>,
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');

    act(() => {
      deleteItemFn('item-1');
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
      <InventoryProvider>
        <TestComponent
          onContextReady={(ctx) => {
            addItemsFn = ctx.addItems;
          }}
        />
      </InventoryProvider>,
    );

    const newItems = [
      createMockInventoryItem({ id: 'bulk-1', name: 'Bulk 1' }),
      createMockInventoryItem({ id: 'bulk-2', name: 'Bulk 2' }),
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
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
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
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
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
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
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
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
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
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
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
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
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
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
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
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
    );

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('3');

    await user.click(screen.getByText('Enable All Recommended'));

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('0');
  });

  it('should save to localStorage when items change', async () => {
    const user = userEvent.setup();
    mockGetAppData.mockReturnValue(null);

    render(
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
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
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
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
      <InventoryProvider>
        <TestComponent />
      </InventoryProvider>,
    );

    expect(screen.getByTestId('disabled-count')).toHaveTextContent('3');
  });
});
