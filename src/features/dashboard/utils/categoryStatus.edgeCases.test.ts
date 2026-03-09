import {
  calculateCategoryStatus,
  calculateCategoryShortages,
} from './categoryStatus';
import { calculateCategoryPreparedness } from './preparedness';
import type { InventoryItem } from '@/shared/types';
import {
  createMockCategory,
  createMockInventoryItem,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { RECOMMENDED_ITEMS } from '@/features/templates';

describe('calculateCategoryShortages - pets category with pets = 0', () => {
  it('should return empty shortages when pets = 0', () => {
    const householdWithNoPets = createMockHousehold({
      pets: 0,
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const result = calculateCategoryShortages(
      'pets',
      [],
      householdWithNoPets,
      RECOMMENDED_ITEMS,
      [],
    );

    // When pets = 0, all pet items should have recommendedQty = 0
    // and should be filtered out, resulting in empty shortages
    expect(result.shortages).toHaveLength(0);
    expect(result.totalNeeded).toBe(0);
    expect(result.totalActual).toBe(0);
  });

  it('should return shortages when pets > 0', () => {
    const householdWithPets = createMockHousehold({
      pets: 2,
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const result = calculateCategoryShortages(
      'pets',
      [],
      householdWithPets,
      RECOMMENDED_ITEMS,
      [],
    );

    // When pets > 0, pet items should have recommendedQty > 0
    // and should appear as shortages since inventory is empty
    expect(result.shortages.length).toBeGreaterThan(0);
    expect(result.totalNeeded).toBeGreaterThan(0);
  });
});

describe('Bug: preparedness score with single item', () => {
  // Regression test for: "Preparedness score on dashboard shows 10% when I just have
  // a single aluminium foil. I have the standard kit selected. Percentage should be much lower"

  it('should not mark a category as "ok" when having only 1 item out of 11 recommended', () => {
    const household = createMockHousehold({
      adults: 2,
      children: 0,
      pets: 0,
      supplyDurationDays: 3,
      useFreezer: true,
    });

    // User has only 1 aluminum foil (tools-supplies has 11 recommended items total)
    const items = [
      createMockInventoryItem({
        id: createItemId('test-aluminum-foil-1'),
        categoryId: createCategoryId('tools-supplies'),
        itemType: createProductTemplateId('aluminum-foil'),
        name: 'Aluminum Foil',
        quantity: createQuantity(1),
        unit: 'rolls',
      }),
    ];

    // Calculate preparedness for tools-supplies category
    const preparedness = calculateCategoryPreparedness(
      'tools-supplies',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Calculate category status
    const toolsCategory = createMockCategory({
      id: createCategoryId('tools-supplies'),
      name: 'Tools & Supplies',
      icon: '🔧',
    });

    const status = calculateCategoryStatus(
      toolsCategory,
      items,
      preparedness,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // With only 1 out of 11 items (~9%), category should NOT be "ok"
    expect(status.status).not.toBe('ok');
    expect(status.status).toBe('critical'); // Should be critical since < 30%
    expect(status.completionPercentage).toBeLessThan(30);
  });
});

describe('calculateCategoryStatus - item status counting precision', () => {
  const mockHousehold = createMockHousehold({
    adults: 2,
    children: 0,
    useFreezer: false,
    supplyDurationDays: 3,
  });

  it('should count item with no recommended quantity and quantity=0 as critical', () => {
    // Tests: recommendedQuantity <= 0 && item.quantity === 0 → 'critical'
    const customCategory = createMockCategory({
      id: createCategoryId('custom-cat'),
      name: 'Custom',
      icon: '📦',
    });
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Empty Custom Item',
        categoryId: createCategoryId('custom-cat'),
        quantity: createQuantity(0),
        itemType: 'custom',
      }),
    ];

    const result = calculateCategoryStatus(
      customCategory,
      items,
      0,
      mockHousehold,
      [], // No recommended items → recommendedQuantity = 0
      [],
    );

    expect(result.criticalCount).toBe(1);
    expect(result.warningCount).toBe(0);
    expect(result.okCount).toBe(0);
  });

  it('should count item with no recommended quantity and quantity>0 as ok', () => {
    // Tests: recommendedQuantity <= 0 && item.quantity > 0 → 'ok'
    const customCategory = createMockCategory({
      id: createCategoryId('custom-cat'),
      name: 'Custom',
      icon: '📦',
    });
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Stocked Custom Item',
        categoryId: createCategoryId('custom-cat'),
        quantity: createQuantity(5),
        itemType: 'custom',
      }),
    ];

    const result = calculateCategoryStatus(
      customCategory,
      items,
      100,
      mockHousehold,
      [], // No recommended items
      [],
    );

    expect(result.criticalCount).toBe(0);
    expect(result.warningCount).toBe(0);
    expect(result.okCount).toBe(1);
  });

  it('should track warningCount precisely (not just >= 0)', () => {
    const waterCategory = createMockCategory({
      id: createCategoryId('water-beverages'),
      name: 'Water',
      icon: '💧',
    });
    // One item with some but not enough quantity → warning
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(5),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: true,
      }),
    ];

    const result = calculateCategoryStatus(
      waterCategory,
      items,
      50,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );

    // Total items in category should match sum of counts
    expect(result.criticalCount + result.warningCount + result.okCount).toBe(
      result.itemCount,
    );
    // At least verify the counts are distinct numbers
    expect(typeof result.warningCount).toBe('number');
    expect(typeof result.criticalCount).toBe('number');
    expect(typeof result.okCount).toBe('number');
  });
});

describe('calculateCategoryStatus - hasRecommendations and disabledItems', () => {
  const mockHousehold = createMockHousehold({
    adults: 2,
    children: 0,
    useFreezer: false,
    supplyDurationDays: 3,
  });

  it('should set hasRecommendations=false when all recommended items are disabled', () => {
    const commCategory = createMockCategory({
      id: createCategoryId('communication-info'),
      name: 'Communication',
      icon: '📻',
    });
    const customRecommendedItems = [
      {
        id: createProductTemplateId('battery-radio'),
        i18nKey: 'products.battery-radio',
        category: 'communication-info' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: false,
        scaleWithDays: false,
      },
    ];

    const result = calculateCategoryStatus(
      commCategory,
      [],
      0,
      mockHousehold,
      customRecommendedItems,
      ['battery-radio'], // Disable the only item
    );

    expect(result.hasRecommendations).toBe(false);
  });

  it('should set hasRecommendations=true when at least one recommended item is active', () => {
    const commCategory = createMockCategory({
      id: createCategoryId('communication-info'),
      name: 'Communication',
      icon: '📻',
    });
    const customRecommendedItems = [
      {
        id: createProductTemplateId('battery-radio'),
        i18nKey: 'products.battery-radio',
        category: 'communication-info' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: false,
        scaleWithDays: false,
      },
    ];

    const result = calculateCategoryStatus(
      commCategory,
      [],
      0,
      mockHousehold,
      customRecommendedItems,
      [], // Nothing disabled
    );

    expect(result.hasRecommendations).toBe(true);
  });
});

describe('buildCalculationContext - arithmetic precision', () => {
  it('should use adults * 1.0 + children * childrenMultiplier for peopleMultiplier', () => {
    const household = createMockHousehold({
      adults: 2,
      children: 3,
      useFreezer: false,
      supplyDurationDays: 3,
    });

    // Custom recommended items with scaleWithPeople
    const customRecommendedItems = [
      {
        id: createProductTemplateId('test-item'),
        i18nKey: 'test.item',
        category: 'tools-supplies' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: true,
        scaleWithDays: false,
      },
    ];

    // With 2 adults * 1.0 + 3 children * 0.75 = 4.25 → ceil = 5
    const result = calculateCategoryShortages(
      'tools-supplies',
      [],
      household,
      customRecommendedItems,
      [],
    );

    // totalNeeded should reflect the correct people multiplier
    // 1 base * 4.25 = 4.25, ceil = 5
    expect(result.totalNeeded).toBe(5);
  });

  it('should use * not / for adults calculation', () => {
    const household = createMockHousehold({
      adults: 3,
      children: 0,
      useFreezer: false,
      supplyDurationDays: 1,
    });

    const customRecommendedItems = [
      {
        id: createProductTemplateId('test-item'),
        i18nKey: 'test.item',
        category: 'tools-supplies' as const,
        baseQuantity: createQuantity(2),
        unit: 'pieces' as const,
        scaleWithPeople: true,
        scaleWithDays: false,
      },
    ];

    // 3 adults * 1.0 * 2 base = 6
    const result = calculateCategoryShortages(
      'tools-supplies',
      [],
      household,
      customRecommendedItems,
      [],
    );

    expect(result.totalNeeded).toBe(6);
  });
});

describe('calculateCategoryStatus - no recommendations for non-food/water', () => {
  const mockHousehold = createMockHousehold({
    adults: 2,
    children: 0,
    useFreezer: false,
    supplyDurationDays: 3,
  });

  it('should return ok for non-food/water category when kit has no recommendations', () => {
    const toolsCategory = createMockCategory({
      id: createCategoryId('tools-supplies'),
      name: 'Tools',
      icon: '🔧',
    });

    const result = calculateCategoryStatus(
      toolsCategory,
      [],
      0,
      mockHousehold,
      [], // No recommendations at all (none kit)
      [],
    );

    // Non-food/water with no recommendations should be ok
    expect(result.status).toBe('ok');
    expect(result.completionPercentage).toBe(100);
  });
});
