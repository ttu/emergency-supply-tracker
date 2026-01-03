import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { useAlerts } from './useAlerts';
import {
  InventoryContext,
  InventoryContextValue,
} from '@/shared/contexts/InventoryContext';
import {
  HouseholdContext,
  HouseholdContextValue,
} from '@/shared/contexts/HouseholdContext';
import {
  createMockInventoryItem,
  createMockHousehold,
} from '@/shared/utils/test/factories';

const createWrapper = (
  inventoryValue: InventoryContextValue,
  householdValue: HouseholdContextValue,
) => {
  return ({ children }: { children: ReactNode }) => (
    <HouseholdContext.Provider value={householdValue}>
      <InventoryContext.Provider value={inventoryValue}>
        {children}
      </InventoryContext.Provider>
    </HouseholdContext.Provider>
  );
};

const createDefaultInventoryContext = (
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
  reactivateAlert: jest.fn(),
  reactivateAllAlerts: jest.fn(),
  disabledRecommendedItems: [],
  disableRecommendedItem: jest.fn(),
  enableRecommendedItem: jest.fn(),
  enableAllRecommendedItems: jest.fn(),
  ...overrides,
});

const createDefaultHouseholdContext = (
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

describe('useAlerts', () => {
  it('should return empty alerts when no inventory items', () => {
    const inventoryContext = createDefaultInventoryContext();
    const householdContext = createDefaultHouseholdContext();

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    // Should have info alerts for missing recommended items
    expect(result.current.criticalAlerts).toHaveLength(0);
    expect(result.current.warningAlerts).toHaveLength(0);
    expect(result.current.infoAlerts.length).toBeGreaterThan(0);
  });

  it('should generate critical alert for out of stock item', () => {
    const emptyItem = createMockInventoryItem({
      id: 'test-1',
      name: 'Water',
      quantity: 0,
      recommendedQuantity: 10,
    });

    const inventoryContext = createDefaultInventoryContext({
      items: [emptyItem],
    });
    const householdContext = createDefaultHouseholdContext();

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    const outOfStockAlerts = result.current.criticalAlerts.filter((a) =>
      a.message.includes('out of stock'),
    );
    expect(outOfStockAlerts).toHaveLength(1);
    expect(outOfStockAlerts[0].type).toBe('critical');
    expect(outOfStockAlerts[0].itemId).toBe('test-1');
    expect(result.current.hasCritical).toBe(true);
  });

  it('should generate critical alert for expired item', () => {
    const expiredItem = createMockInventoryItem({
      id: 'test-1',
      name: 'Canned Food',
      quantity: 5,
      recommendedQuantity: 5,
      neverExpires: false,
      expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    });

    const inventoryContext = createDefaultInventoryContext({
      items: [expiredItem],
    });
    const householdContext = createDefaultHouseholdContext();

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    const expiredAlerts = result.current.criticalAlerts.filter((a) =>
      a.message.includes('expired'),
    );
    expect(expiredAlerts).toHaveLength(1);
    expect(expiredAlerts[0].type).toBe('critical');
    expect(expiredAlerts[0].itemId).toBe('test-1');
  });

  it('should generate warning alert for low stock item', () => {
    const lowStockItem = createMockInventoryItem({
      id: 'test-1',
      name: 'Water',
      quantity: 2,
      recommendedQuantity: 10,
      neverExpires: true,
    });

    const inventoryContext = createDefaultInventoryContext({
      items: [lowStockItem],
    });
    const householdContext = createDefaultHouseholdContext();

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    const lowStockAlerts = result.current.warningAlerts.filter((a) =>
      a.message.includes('below 50%'),
    );
    expect(lowStockAlerts).toHaveLength(1);
    expect(lowStockAlerts[0].type).toBe('warning');
    expect(lowStockAlerts[0].itemId).toBe('test-1');
  });

  it('should generate warning alert for item expiring soon', () => {
    const expiringItem = createMockInventoryItem({
      id: 'test-1',
      name: 'Canned Food',
      quantity: 10,
      recommendedQuantity: 10,
      neverExpires: false,
      expirationDate: new Date(
        Date.now() + 15 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 15 days from now
    });

    const inventoryContext = createDefaultInventoryContext({
      items: [expiringItem],
    });
    const householdContext = createDefaultHouseholdContext();

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    const expiringAlerts = result.current.warningAlerts.filter((a) =>
      a.message.includes('expires in'),
    );
    expect(expiringAlerts).toHaveLength(1);
    expect(expiringAlerts[0].type).toBe('warning');
    // The exact days may vary slightly based on time of day, so just check it contains "days"
    expect(expiringAlerts[0].message).toMatch(/expires in \d+ days/);
  });

  it('should generate info alerts for missing recommended items', () => {
    const inventoryContext = createDefaultInventoryContext({ items: [] });
    const householdContext = createDefaultHouseholdContext();

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    expect(result.current.infoAlerts.length).toBeGreaterThan(0);
    expect(result.current.infoAlerts[0].type).toBe('info');
    expect(result.current.infoAlerts[0].message).toContain('Consider adding');
  });

  it('should not generate info alert for items already in inventory', () => {
    const existingItem = createMockInventoryItem({
      id: 'test-1',
      name: 'Bottled Water',
      categoryId: 'water-beverages',
      quantity: 54,
      recommendedQuantity: 54,
      productTemplateId: 'bottled-water',
      neverExpires: true,
    });

    const inventoryContext = createDefaultInventoryContext({
      items: [existingItem],
    });
    const householdContext = createDefaultHouseholdContext();

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    const bottledWaterInfoAlerts = result.current.infoAlerts.filter(
      (a) => a.id === 'missing-bottled-water',
    );
    expect(bottledWaterInfoAlerts).toHaveLength(0);
  });

  it('should skip freezer items when household does not use freezer', () => {
    const inventoryContext = createDefaultInventoryContext({ items: [] });
    const householdContext = createDefaultHouseholdContext({
      household: createMockHousehold({ useFreezer: false }),
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    const freezerItemAlerts = result.current.infoAlerts.filter((a) =>
      a.id.includes('frozen'),
    );
    expect(freezerItemAlerts).toHaveLength(0);
  });

  it('should include freezer items when household uses freezer', () => {
    const inventoryContext = createDefaultInventoryContext({ items: [] });
    const householdContext = createDefaultHouseholdContext({
      household: createMockHousehold({ useFreezer: true }),
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    const freezerItemAlerts = result.current.infoAlerts.filter((a) =>
      a.id.includes('frozen'),
    );
    expect(freezerItemAlerts.length).toBeGreaterThan(0);
  });

  it('should return hasAlerts true when there are alerts', () => {
    const inventoryContext = createDefaultInventoryContext({ items: [] });
    const householdContext = createDefaultHouseholdContext();

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    expect(result.current.hasAlerts).toBe(true);
    expect(result.current.alerts.length).toBeGreaterThan(0);
  });

  it('should correctly separate alerts by type', () => {
    const items = [
      createMockInventoryItem({
        id: 'critical-1',
        name: 'Empty Item',
        quantity: 0,
        recommendedQuantity: 10,
      }),
      createMockInventoryItem({
        id: 'warning-1',
        name: 'Low Item',
        quantity: 2,
        recommendedQuantity: 10,
        neverExpires: true,
      }),
    ];

    const inventoryContext = createDefaultInventoryContext({ items });
    const householdContext = createDefaultHouseholdContext();

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    expect(result.current.criticalAlerts.length).toBeGreaterThanOrEqual(1);
    expect(result.current.warningAlerts.length).toBeGreaterThanOrEqual(1);
    expect(result.current.infoAlerts.length).toBeGreaterThanOrEqual(0);

    // All critical alerts should have type 'critical'
    result.current.criticalAlerts.forEach((alert) => {
      expect(alert.type).toBe('critical');
    });

    // All warning alerts should have type 'warning'
    result.current.warningAlerts.forEach((alert) => {
      expect(alert.type).toBe('warning');
    });
  });

  it('should not generate alert for item with neverExpires true even if expirationDate is past', () => {
    const neverExpiresItem = createMockInventoryItem({
      id: 'test-1',
      name: 'Non-perishable',
      quantity: 10,
      recommendedQuantity: 10,
      neverExpires: true,
      expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });

    const inventoryContext = createDefaultInventoryContext({
      items: [neverExpiresItem],
    });
    const householdContext = createDefaultHouseholdContext();

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(inventoryContext, householdContext),
    });

    const expiredAlerts = result.current.criticalAlerts.filter(
      (a) => a.itemId === 'test-1' && a.message.includes('expired'),
    );
    expect(expiredAlerts).toHaveLength(0);
  });
});
