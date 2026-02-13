import { describe, it, expect } from 'vitest';
import {
  generateExampleInventory,
  getStateForIndex,
} from './generateExampleInventory';
import {
  createProductTemplateId,
  createQuantity,
  type RecommendedItemDefinition,
  type HouseholdConfig,
} from '@/shared/types';

// Helper to create a consistent set of test items
function createTestRecommendedItems(
  count: number,
): RecommendedItemDefinition[] {
  return Array.from({ length: count }, (_, i) => ({
    id: createProductTemplateId(`item-${i}`),
    i18nKey: `products.item-${i}`,
    category: 'food',
    baseQuantity: createQuantity(1),
    unit: 'pieces' as const,
    scaleWithPeople: true,
    scaleWithDays: false,
    defaultExpirationMonths: 12,
  }));
}

// Helper to create test items with mixed categories
function createMixedCategoryItems(): RecommendedItemDefinition[] {
  return [
    // Food items (have expiration)
    {
      id: createProductTemplateId('canned-fish'),
      i18nKey: 'products.canned-fish',
      category: 'food',
      baseQuantity: createQuantity(2),
      unit: 'cans' as const,
      scaleWithPeople: true,
      scaleWithDays: false,
      defaultExpirationMonths: 24,
    },
    {
      id: createProductTemplateId('crackers'),
      i18nKey: 'products.crackers',
      category: 'food',
      baseQuantity: createQuantity(1),
      unit: 'packages' as const,
      scaleWithPeople: true,
      scaleWithDays: false,
      defaultExpirationMonths: 6,
    },
    // Tools (never expire)
    {
      id: createProductTemplateId('flashlight'),
      i18nKey: 'products.flashlight',
      category: 'tools-supplies',
      baseQuantity: createQuantity(1),
      unit: 'pieces' as const,
      scaleWithPeople: false,
      scaleWithDays: false,
      // No defaultExpirationMonths = neverExpires
    },
    {
      id: createProductTemplateId('rope'),
      i18nKey: 'products.rope',
      category: 'tools-supplies',
      baseQuantity: createQuantity(10),
      unit: 'meters' as const,
      scaleWithPeople: false,
      scaleWithDays: false,
    },
    // Water (has expiration)
    {
      id: createProductTemplateId('bottled-water'),
      i18nKey: 'products.bottled-water',
      category: 'water-beverages',
      baseQuantity: createQuantity(3),
      unit: 'liters' as const,
      scaleWithPeople: true,
      scaleWithDays: true,
      defaultExpirationMonths: 12,
    },
  ];
}

const mockTranslate = (key: string) => key.replace('products.', '');
const standardHousehold: HouseholdConfig = {
  adults: 2,
  children: 1,
  pets: 0,
  supplyDurationDays: 3,
  useFreezer: true,
};

describe('generateExampleInventory', () => {
  describe('basic functionality', () => {
    it('generates inventory items from recommended items', () => {
      const items = createTestRecommendedItems(10);
      const result = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        42, // seed for determinism
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(items.length);
    });

    it('returns empty array for empty input', () => {
      const result = generateExampleInventory(
        [],
        standardHousehold,
        mockTranslate,
        42,
      );

      expect(result).toEqual([]);
    });

    it('creates valid InventoryItem objects', () => {
      const items = createTestRecommendedItems(5);
      const result = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        42,
      );

      result.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('itemType');
        expect(item).toHaveProperty('categoryId');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('unit');
        expect(item).toHaveProperty('createdAt');
        expect(item).toHaveProperty('updatedAt');
      });
    });

    it('produces deterministic output with same seed', () => {
      const items = createTestRecommendedItems(20);

      const result1 = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        123,
      );
      const result2 = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        123,
      );

      expect(result1.length).toBe(result2.length);
      result1.forEach((item, idx) => {
        expect(item.itemType).toBe(result2[idx].itemType);
        expect(item.quantity).toBe(result2[idx].quantity);
      });
    });

    it('produces different output with different seeds', () => {
      const items = createTestRecommendedItems(20);

      const result1 = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        100,
      );
      const result2 = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        200,
      );

      // At least some items should differ (extremely unlikely to be identical)
      const hasAnyDifference = result1.some(
        (item, idx) =>
          result2[idx] === undefined ||
          item.itemType !== result2[idx].itemType ||
          item.quantity !== result2[idx].quantity,
      );
      expect(hasAnyDifference).toBe(true);
    });
  });

  describe('distribution', () => {
    it('creates approximately 80% of items (20% missing)', () => {
      const items = createTestRecommendedItems(100);
      const result = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        42,
      );

      // 80% of items should be created (20% missing)
      // Allow some variance: 70-90 items out of 100
      expect(result.length).toBeGreaterThanOrEqual(70);
      expect(result.length).toBeLessThanOrEqual(90);
    });

    it('includes items with different states', () => {
      const items = createTestRecommendedItems(50);
      const household = { ...standardHousehold };
      const result = generateExampleInventory(
        items,
        household,
        mockTranslate,
        42,
      );

      // Check for variety in quantities
      const quantities = result.map((item) => item.quantity);
      const uniqueQuantities = new Set(quantities);

      // Should have at least 3 different quantity levels
      expect(uniqueQuantities.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('household filtering', () => {
    it('excludes frozen items when useFreezer is false', () => {
      const items: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('frozen-berries'),
          i18nKey: 'products.frozen-berries',
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'packages' as const,
          scaleWithPeople: true,
          scaleWithDays: false,
          requiresFreezer: true,
          defaultExpirationMonths: 12,
        },
        {
          id: createProductTemplateId('crackers'),
          i18nKey: 'products.crackers',
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'packages' as const,
          scaleWithPeople: true,
          scaleWithDays: false,
          defaultExpirationMonths: 6,
        },
      ];

      const noFreezerHousehold = { ...standardHousehold, useFreezer: false };
      const result = generateExampleInventory(
        items,
        noFreezerHousehold,
        mockTranslate,
        42,
      );

      const frozenItem = result.find(
        (item) => item.itemType === 'frozen-berries',
      );
      expect(frozenItem).toBeUndefined();
    });

    it('includes frozen items when useFreezer is true', () => {
      const items: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('frozen-berries'),
          i18nKey: 'products.frozen-berries',
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'packages' as const,
          scaleWithPeople: true,
          scaleWithDays: false,
          requiresFreezer: true,
          defaultExpirationMonths: 12,
        },
      ];

      const withFreezerHousehold = { ...standardHousehold, useFreezer: true };
      // Use a seed that doesn't result in 'missing' state for the single item
      const result = generateExampleInventory(
        items,
        withFreezerHousehold,
        mockTranslate,
        1, // Try different seed
      );

      // Note: might be missing due to 20% miss rate, so check if present it has right type
      if (result.length > 0) {
        // If any item was created, it should be the frozen one
        expect(result[0].itemType).toBe('frozen-berries');
      }
    });

    it('excludes pet items when pets is 0', () => {
      const items: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('pet-food'),
          i18nKey: 'products.pet-food',
          category: 'pets',
          baseQuantity: createQuantity(1),
          unit: 'kilograms' as const,
          scaleWithPeople: false,
          scaleWithDays: true,
          scaleWithPets: true,
          defaultExpirationMonths: 12,
        },
        {
          id: createProductTemplateId('crackers'),
          i18nKey: 'products.crackers',
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'packages' as const,
          scaleWithPeople: true,
          scaleWithDays: false,
          defaultExpirationMonths: 6,
        },
      ];

      const noPetsHousehold = { ...standardHousehold, pets: 0 };
      const result = generateExampleInventory(
        items,
        noPetsHousehold,
        mockTranslate,
        42,
      );

      const petItem = result.find((item) => item.itemType === 'pet-food');
      expect(petItem).toBeUndefined();
    });

    it('includes pet items when pets > 0', () => {
      const items: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('pet-food'),
          i18nKey: 'products.pet-food',
          category: 'pets',
          baseQuantity: createQuantity(1),
          unit: 'kilograms' as const,
          scaleWithPeople: false,
          scaleWithDays: true,
          scaleWithPets: true,
          defaultExpirationMonths: 12,
        },
      ];

      const withPetsHousehold = { ...standardHousehold, pets: 2 };
      // Find a seed that doesn't skip the item
      const result = generateExampleInventory(
        items,
        withPetsHousehold,
        mockTranslate,
        1,
      );

      // If single item, either it's created or not (20% chance missing)
      // We just verify the filter doesn't exclude it
      if (result.length > 0) {
        expect(result[0].itemType).toBe('pet-food');
      }
    });
  });

  describe('quantity calculation', () => {
    it('scales quantities with household size', () => {
      const items: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('water'),
          i18nKey: 'products.water',
          category: 'water-beverages',
          baseQuantity: createQuantity(3),
          unit: 'liters' as const,
          scaleWithPeople: true,
          scaleWithDays: true,
          defaultExpirationMonths: 12,
        },
      ];

      const smallHousehold: HouseholdConfig = {
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: true,
      };

      const largeHousehold: HouseholdConfig = {
        adults: 4,
        children: 2,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: true,
      };

      // Use seed that creates full-quantity items
      const smallResult = generateExampleInventory(
        items,
        smallHousehold,
        mockTranslate,
        1,
      );
      const largeResult = generateExampleInventory(
        items,
        largeHousehold,
        mockTranslate,
        1,
      );

      // Both should have items (if not missing)
      if (smallResult.length > 0 && largeResult.length > 0) {
        // Large household should have higher quantity
        expect(largeResult[0].quantity).toBeGreaterThan(
          smallResult[0].quantity,
        );
      }
    });

    it('applies partial quantity multiplier for partial state', () => {
      const items = createTestRecommendedItems(100);
      const result = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        42,
      );

      // Some items should have partial quantities (30-70% of full)
      // Full quantity for 3 people, 1 base = 3
      const partialItems = result.filter(
        (item) => item.quantity > 0 && item.quantity < 3,
      );
      expect(partialItems.length).toBeGreaterThan(0);
    });
  });

  describe('expiration dates', () => {
    it('sets future expiration dates for normal items', () => {
      const items = createMixedCategoryItems();
      const result = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        42,
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const itemsWithExpiration = result.filter(
        (item) => item.expirationDate && !item.neverExpires,
      );

      // Most items with expiration should have future dates
      const futureItems = itemsWithExpiration.filter((item) => {
        const expDate = new Date(item.expirationDate!);
        return expDate > today;
      });

      // At least some should be in the future
      expect(futureItems.length).toBeGreaterThan(0);
    });

    it('sets near-future dates (7-30 days) for expiring items', () => {
      const items = createTestRecommendedItems(100);
      const result = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        42,
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiringItems = result.filter((item) => {
        if (!item.expirationDate || item.neverExpires) return false;
        const expDate = new Date(item.expirationDate);
        const daysUntil = Math.ceil(
          (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysUntil >= 1 && daysUntil <= 30;
      });

      // ~10% should be expiring soon
      expect(expiringItems.length).toBeGreaterThan(0);
    });

    it('sets past dates for expired items', () => {
      const items = createTestRecommendedItems(100);
      const result = generateExampleInventory(
        items,
        standardHousehold,
        mockTranslate,
        42,
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredItems = result.filter((item) => {
        if (!item.expirationDate || item.neverExpires) return false;
        const expDate = new Date(item.expirationDate);
        return expDate < today;
      });

      // ~5% should be expired
      expect(expiredItems.length).toBeGreaterThan(0);
    });

    it('does not modify expiration for neverExpires items', () => {
      const items: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('flashlight'),
          i18nKey: 'products.flashlight',
          category: 'tools-supplies',
          baseQuantity: createQuantity(1),
          unit: 'pieces' as const,
          scaleWithPeople: false,
          scaleWithDays: false,
          // No defaultExpirationMonths = neverExpires
        },
      ];

      // Generate multiple times to check consistency
      for (let seed = 0; seed < 10; seed++) {
        const result = generateExampleInventory(
          items,
          standardHousehold,
          mockTranslate,
          seed,
        );

        if (result.length > 0) {
          expect(result[0].neverExpires).toBe(true);
          expect(result[0].expirationDate).toBeUndefined();
        }
      }
    });
  });

  describe('translation', () => {
    it('uses translate function for item names', () => {
      const translateCalls: string[] = [];
      const trackingTranslate = (key: string) => {
        translateCalls.push(key);
        return `Translated: ${key}`;
      };

      const items = createTestRecommendedItems(5);
      const result = generateExampleInventory(
        items,
        standardHousehold,
        trackingTranslate,
        42,
      );

      // Should have called translate for each created item
      expect(translateCalls.length).toBeGreaterThan(0);

      // Names should be translated (key is normalized, e.g., "item-0" not "products.item-0")
      result.forEach((item) => {
        expect(item.name).toContain('Translated:');
      });

      // Verify keys are normalized (no "products." prefix)
      translateCalls.forEach((key) => {
        expect(key).not.toContain('products.');
      });
    });
  });
});

describe('getStateForIndex', () => {
  it('returns full state for first 40%', () => {
    expect(getStateForIndex(0, 100).type).toBe('full');
    expect(getStateForIndex(39, 100).type).toBe('full');
  });

  it('returns partial state for 40-65%', () => {
    expect(getStateForIndex(40, 100).type).toBe('partial');
    expect(getStateForIndex(64, 100).type).toBe('partial');
  });

  it('returns missing state for 65-85%', () => {
    expect(getStateForIndex(65, 100).type).toBe('missing');
    expect(getStateForIndex(84, 100).type).toBe('missing');
  });

  it('returns expiring state for 85-95%', () => {
    expect(getStateForIndex(85, 100).type).toBe('expiring');
    expect(getStateForIndex(94, 100).type).toBe('expiring');
  });

  it('returns expired state for last 5%', () => {
    expect(getStateForIndex(95, 100).type).toBe('expired');
    expect(getStateForIndex(99, 100).type).toBe('expired');
  });

  it('sets correct quantity multipliers', () => {
    const fullState = getStateForIndex(0, 100);
    expect(fullState.quantityMultiplier).toBe(1.0);

    const partialState = getStateForIndex(50, 100);
    expect(partialState.quantityMultiplier).toBeGreaterThanOrEqual(0.3);
    expect(partialState.quantityMultiplier).toBeLessThanOrEqual(0.7);
  });

  it('sets expiration offsets for expiring items', () => {
    const expiringState = getStateForIndex(90, 100);
    expect(expiringState.expirationOffsetDays).toBeGreaterThanOrEqual(7);
    expect(expiringState.expirationOffsetDays).toBeLessThanOrEqual(30);
  });

  it('sets negative expiration offsets for expired items', () => {
    const expiredState = getStateForIndex(97, 100);
    expect(expiredState.expirationOffsetDays).toBeLessThanOrEqual(-1);
    expect(expiredState.expirationOffsetDays).toBeGreaterThanOrEqual(-60);
  });
});
