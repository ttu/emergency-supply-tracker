import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { useMissingRecommendedItems } from './useMissingRecommendedItems';
import { SettingsProvider } from '@/features/settings';
import { HouseholdProvider } from '@/features/household';
import { InventoryProvider } from '@/features/inventory';
import { RecommendedItemsProvider } from '@/features/templates';
import { InventorySetProvider } from '@/features/inventory-set';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { saveAppData } from '@/shared/utils/storage/localStorage';
import {
  createCategoryId,
  createProductTemplateId,
  createQuantity,
  type AppData,
} from '@/shared/types';

function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <InventorySetProvider>
      <SettingsProvider>
        <NotificationProvider>
          <HouseholdProvider>
            <RecommendedItemsProvider>
              <InventoryProvider>{children}</InventoryProvider>
            </RecommendedItemsProvider>
          </HouseholdProvider>
        </NotificationProvider>
      </SettingsProvider>
    </InventorySetProvider>
  );
}

/** A household with pets so the pets category is in play unless overridden. */
const household = {
  adults: 2,
  children: 0,
  pets: 1,
  supplyDurationDays: 3,
  useFreezer: false,
};

const setup = (overrides: Partial<AppData> = {}) => {
  saveAppData(
    createMockAppData({
      settings: createMockSettings({ theme: 'cockpit' }),
      household,
      items: [],
      customCategories: [],
      ...overrides,
    }),
  );
  return renderHook(() => useMissingRecommendedItems(), { wrapper: Wrapper });
};

const bottledWater = () =>
  createMockInventoryItem({
    name: 'Bottled water',
    itemType: createProductTemplateId('bottled-water'),
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(20),
    unit: 'liters',
    neverExpires: true,
  });

const idsOf = (missing: { definition: { id: string } }[]) =>
  missing.map((m) => String(m.definition.id));

describe('useMissingRecommendedItems', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists recommended items an empty household does not have', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
    expect(idsOf(result.current)).toContain('bottled-water');
  });

  it('carries the scaled target quantity and unit for each item', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));

    const water = result.current.find(
      (m) => String(m.definition.id) === 'bottled-water',
    )!;
    // 3 L/person/day × 2 adults × 3 days.
    expect(water.recommended).toBe(18);
    expect(water.definition.unit).toBe('liters');
    expect(water.categoryId).toBe('water-beverages');
  });

  it('drops an item once the household owns it', async () => {
    const { result } = setup({ items: [bottledWater()] });
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
    expect(idsOf(result.current)).not.toContain('bottled-water');
  });

  it('drops items the user disabled', async () => {
    const { result } = setup({
      disabledRecommendedItems: [createProductTemplateId('bottled-water')],
    });
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
    expect(idsOf(result.current)).not.toContain('bottled-water');
  });

  it('drops items that scale to nothing for this household', async () => {
    const { result } = setup({
      household: { ...household, pets: 0 },
    });
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));

    // Pet items scale with pets; with none they are not recommended at all.
    for (const m of result.current) {
      expect(m.recommended).toBeGreaterThan(0);
    }
    expect(idsOf(result.current)).not.toContain('pet-food-dry');
  });

  it('is sorted by category so the list groups predictably', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));

    // Every category id appears in one contiguous run, so the list can be
    // rendered grouped without re-sorting in the view.
    const categories = result.current.map((m) => m.categoryId);
    const runs = categories.filter((c, i) => c !== categories[i - 1]);
    expect(runs).toHaveLength(new Set(runs).size);
  });
});
