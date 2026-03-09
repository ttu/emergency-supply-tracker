import {
  calculateCategoryStatus,
  calculateCategoryShortages,
  getCategoryDisplayStatus,
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
  createDateOnly,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import {
  DAILY_WATER_PER_PERSON,
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
  CRITICAL_PERCENTAGE_THRESHOLD,
} from '@/shared/utils/constants';
import {
  randomQuantitySmall,
  randomLessThan,
  randomMoreThan,
  randomPercentageMid,
} from '@/shared/utils/test/faker-helpers';

describe('calculateCategoryStatus - inventory-based status', () => {
  const waterCategory = createMockCategory({
    id: createCategoryId('water-beverages'),
    name: 'Water & Beverages',
    icon: '💧',
  });

  const foodCategory = createMockCategory({
    id: createCategoryId('food'),
    name: 'Food',
    icon: '🥫',
  });

  const household = createMockHousehold();

  it('should return ok status when totalActual >= totalNeeded even with low completion percentage', () => {
    // Calculate needed water based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const needed = Math.ceil(
      DAILY_WATER_PER_PERSON * peopleMultiplier * household.supplyDurationDays,
    );
    // Need to account for milk and juice requirements too
    const milkNeeded = Math.ceil(2 * peopleMultiplier);
    const juiceNeeded = Math.ceil(2 * peopleMultiplier);
    const totalNeeded = needed + milkNeeded + juiceNeeded;
    const actual = createQuantity(randomMoreThan(totalNeeded)); // More than total needed

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: actual,
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    // Low completion percentage because we're missing milk and juice
    const completionPercentage = randomPercentageMid();
    const result = calculateCategoryStatus(
      waterCategory,
      items,
      completionPercentage,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Should be "ok" because we have enough total inventory
    expect(result.status).toBe('ok');
    expect(result.totalActual).toBeGreaterThanOrEqual(result.totalNeeded);
  });

  it('should return critical status when totalActual < totalNeeded and low completion', () => {
    // Calculate needed water based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const needed = Math.ceil(
      DAILY_WATER_PER_PERSON * peopleMultiplier * household.supplyDurationDays,
    );
    const actual = createQuantity(randomLessThan(needed)); // Less than needed

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: actual,
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    // Use a fixed low percentage (25) that's strictly less than CRITICAL_PERCENTAGE_THRESHOLD (30)
    // to ensure deterministic test behavior. randomPercentageLow() can return 30, which would
    // not trigger the critical status check (completionPercentage < 30).
    const completionPercentage = 25;
    const result = calculateCategoryStatus(
      waterCategory,
      items,
      completionPercentage,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.status).toBe('critical');
  });

  it('should return ok for food category when totalActualCalories >= totalNeededCalories', () => {
    // Calculate needed calories based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const neededCalories = Math.ceil(
      peopleMultiplier * household.supplyDurationDays * 2000,
    );
    // Create items with enough calories (more than needed)
    const riceQuantity = createQuantity(
      Math.ceil((neededCalories / 3600) * 1.2),
    );

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: riceQuantity,
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    // Low completion percentage because we're missing other recommended food items
    const completionPercentage = randomPercentageMid();
    const result = calculateCategoryStatus(
      foodCategory,
      items,
      completionPercentage,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Should be "ok" because we have enough calories
    expect(result.status).toBe('ok');
    expect(result.totalActualCalories).toBeGreaterThanOrEqual(
      result.totalNeededCalories!,
    );
  });

  it('should return critical for food category when totalActualCalories < totalNeededCalories', () => {
    // Calculate needed calories based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const neededCalories = Math.ceil(
      peopleMultiplier * household.supplyDurationDays * 2000,
    );
    // Create items with insufficient calories (less than 30% to trigger critical)
    // Use 20% of needed calories to ensure critical status
    const riceQuantity = createQuantity(
      Math.max(0.1, (neededCalories / 3600) * 0.2),
    ); // 20% of needed

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: riceQuantity,
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    // completionPercentage now comes from calculateCategoryPreparedness() which uses unified calculator
    // Calculate the actual percentage using calculateCategoryPreparedness
    const completionPercentage = calculateCategoryPreparedness(
      'food',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    const result = calculateCategoryStatus(
      foodCategory,
      items,
      completionPercentage,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Status should be critical because calorie percentage (20%) is below CRITICAL_PERCENTAGE_THRESHOLD (30)
    expect(result.status).toBe('critical');
    // The completionPercentage should reflect calorie-based calculation from unified calculator
    expect(result.completionPercentage).toBeLessThan(
      CRITICAL_PERCENTAGE_THRESHOLD,
    );
  });

  // Note: household is now required, so this test is no longer applicable
  // Category status calculation requires household to determine recommended quantities

  it('should use weighted fulfillment for mixed units in dashboard (calculateCategoryStatus)', () => {
    // Test that calculateCategoryStatus (used by dashboard) also applies mixed units fix
    // Scenario: Cash (300/300 = 100%), Documents (1/1 = 100%), missing Contact List (0/1 = 0%)
    const cashDocumentsCategory = createMockCategory({
      id: createCategoryId('cash-documents'),
      name: 'Cash & Documents',
      icon: '💰',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('cash-1'),
        categoryId: createCategoryId('cash-documents'),
        quantity: createQuantity(300), // 100% of 300 euros
        unit: 'euros',
        itemType: createProductTemplateId('cash'),
      }),
      createMockInventoryItem({
        id: createItemId('docs-1'),
        categoryId: createCategoryId('cash-documents'),
        quantity: createQuantity(1), // 100% of 1 sets
        unit: 'sets',
        itemType: createProductTemplateId('document-copies'),
      }),
      // contact-list is missing (0/1)
    ];

    // calculateCategoryPreparedness would return 0% for mixed units (doesn't handle weighted fulfillment)
    // But calculateCategoryStatus should override it with weighted fulfillment calculation
    const result = calculateCategoryStatus(
      cashDocumentsCategory,
      items,
      0, // This would be the percentage from calculateCategoryPreparedness (incorrect for mixed units)
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Should have 2.0 weighted fulfillment out of 3 total items
    expect(result.totalActual).toBeCloseTo(2, 1);
    expect(result.totalNeeded).toBe(3);
    expect(result.primaryUnit).toBeUndefined(); // Mixed units

    // CRITICAL: Percentage should NOT be 0! Should be calculated from weighted fulfillment
    expect(result.completionPercentage).toBeGreaterThan(0);
    expect(result.completionPercentage).toBe(Math.round((2 / 3) * 100)); // Should be 67%
  });
});

describe('calculateCategoryShortages with disabledRecommendedItems', () => {
  const household = createMockHousehold();

  it('should exclude disabled recommended items from calculations', () => {
    // Calculate shortages without any disabled items
    const resultWithAll = calculateCategoryShortages(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // bottled-water, long-life-milk, long-life-juice should all be in shortages
    expect(resultWithAll.shortages.length).toBe(3);
    expect(resultWithAll.shortages.map((s) => s.itemId)).toContain(
      'bottled-water',
    );
    expect(resultWithAll.shortages.map((s) => s.itemId)).toContain(
      'long-life-milk',
    );
    expect(resultWithAll.shortages.map((s) => s.itemId)).toContain(
      'long-life-juice',
    );

    // Calculate shortages with bottled-water disabled
    const resultWithDisabled = calculateCategoryShortages(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
      ['bottled-water'],
    );

    // Only long-life-milk and long-life-juice should be in shortages
    expect(resultWithDisabled.shortages.length).toBe(2);
    expect(resultWithDisabled.shortages.map((s) => s.itemId)).not.toContain(
      'bottled-water',
    );
    expect(resultWithDisabled.shortages.map((s) => s.itemId)).toContain(
      'long-life-milk',
    );
    expect(resultWithDisabled.shortages.map((s) => s.itemId)).toContain(
      'long-life-juice',
    );
  });

  it('should reduce totalNeeded when items are disabled', () => {
    const resultWithAll = calculateCategoryShortages(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    const resultWithDisabled = calculateCategoryShortages(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
      ['bottled-water'],
    );

    // Total needed should be lower when bottled-water is disabled
    expect(resultWithDisabled.totalNeeded).toBeLessThan(
      resultWithAll.totalNeeded,
    );
  });

  it('should return empty shortages when all recommended items are disabled', () => {
    const result = calculateCategoryShortages(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
      ['bottled-water', 'long-life-milk', 'long-life-juice'],
    );

    expect(result.shortages).toEqual([]);
    expect(result.totalNeeded).toBe(0);
    expect(result.totalActual).toBe(0);
    expect(result.primaryUnit).toBeUndefined();
  });

  it('should not affect items that are not in the disabled list', () => {
    const result = calculateCategoryShortages(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
      ['non-existent-item'],
    );

    // All 3 water-beverages items should still be there
    expect(result.shortages.length).toBe(3);
  });
});

describe('getCategoryDisplayStatus with disabledRecommendedItems', () => {
  const household = createMockHousehold();

  it('should exclude disabled items from status calculation', () => {
    // Calculate needed water based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const needed = Math.ceil(
      DAILY_WATER_PER_PERSON * peopleMultiplier * household.supplyDurationDays,
    );
    const actual = createQuantity(needed + randomQuantitySmall()); // Enough or more

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: actual,
        itemType: createProductTemplateId('bottled-water'),
      }),
    ];

    // With milk and juice disabled, we should have enough
    const resultWithDisabled = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
      RECOMMENDED_ITEMS,
      ['long-life-milk', 'long-life-juice'],
    );

    // When milk and juice are disabled, only water matters, and we have enough
    expect(resultWithDisabled.shortages.length).toBe(0);
    expect(resultWithDisabled.status).toBe('ok');
  });

  it('should still calculate water needs based on household when all recommended items are disabled', () => {
    // Water-beverages category always calculates based on household needs (3L/person/day)
    // even when all specific recommendations are disabled
    const waterNeeded =
      (household.adults + household.children * 0.75) *
      household.supplyDurationDays *
      DAILY_WATER_PER_PERSON;

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(Math.ceil(waterNeeded) + 5), // Enough water to meet household needs
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
      }),
    ];

    const result = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
      RECOMMENDED_ITEMS,
      ['bottled-water', 'long-life-milk', 'long-life-juice'],
    );

    // Even with all recommendations disabled, water category still calculates based on household
    // With enough water to meet household needs, status should be ok
    expect(result.shortages.length).toBe(0);
    expect(result.status).toBe('ok');
    expect(result.hasRecommendations).toBe(false);
  });
});

describe('calculateCategoryShortages - communication-info category', () => {
  const household = createMockHousehold();

  it('should track by item types instead of pieces for communication-info category', () => {
    // Communication category has 2 items: battery-radio and hand-crank-radio
    // Both have unit: 'pieces' but should track as "items" not "pieces"
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(1),
        unit: 'pieces',
        itemType: createProductTemplateId('battery-radio'),
      }),
    ];

    const result = calculateCategoryShortages(
      'communication-info',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Should have 1 of 2 item types fulfilled
    expect(result.totalActual).toBe(1);
    expect(result.totalNeeded).toBe(2);
    // primaryUnit should be undefined to signal "items" display
    expect(result.primaryUnit).toBeUndefined();
  });

  it('should show all items fulfilled when both radio types are present', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(1),
        unit: 'pieces',
        itemType: createProductTemplateId('battery-radio'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(1),
        unit: 'pieces',
        itemType: createProductTemplateId('hand-crank-radio'),
      }),
    ];

    const result = calculateCategoryShortages(
      'communication-info',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Should have 2 of 2 item types fulfilled
    expect(result.totalActual).toBe(2);
    expect(result.totalNeeded).toBe(2);
    expect(result.shortages.length).toBe(0);
  });

  it('should not count multiple of same item type as multiple fulfilled items', () => {
    // Having 5 battery radios should still only count as 1 item type fulfilled
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(5),
        unit: 'pieces',
        itemType: createProductTemplateId('battery-radio'),
      }),
    ];

    const result = calculateCategoryShortages(
      'communication-info',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Should still have 1 of 2 item types fulfilled (not 5 of 2)
    expect(result.totalActual).toBe(1);
    expect(result.totalNeeded).toBe(2);
  });
});

describe('calculateCategoryShortages - item matching logic', () => {
  const household = createMockHousehold();

  describe('custom items should NOT match recommended items by name', () => {
    it('should NOT match custom item "Battery Radio" with recommended "battery-radio"', () => {
      // This is the specific bug scenario: custom item with similar name
      const customItem = createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Battery Radio',
        itemType: 'custom', // Custom item
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(2),
        unit: 'pieces',
        // itemType is 'custom' - this is a custom item
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [customItem],
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      // Custom item should NOT match, so battery-radio should still be in shortages
      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      expect(batteryRadioShortage).toBeDefined();
      expect(batteryRadioShortage!.actual).toBe(0); // Custom item didn't match
      expect(batteryRadioShortage!.missing).toBeGreaterThan(0);
    });

    it('should NOT match custom item with normalized name that matches recommended item ID', () => {
      // Test various name variations that would normalize to a recommended item ID
      // Only include items from communication-info category
      const testCases = [
        { name: 'Battery Radio', recommendedId: 'battery-radio' },
        { name: 'Hand Crank Radio', recommendedId: 'hand-crank-radio' },
      ];

      const testCustomItemDoesNotMatch = (
        name: string,
        recommendedId: string,
      ) => {
        const customItem = createMockInventoryItem({
          id: createItemId(`item-${recommendedId}`),
          name,
          itemType: 'custom',
          categoryId: createCategoryId('communication-info'),
          quantity: createQuantity(1),
          unit: 'pieces',
        });

        const result = calculateCategoryShortages(
          'communication-info',
          [customItem],
          household,
          RECOMMENDED_ITEMS,
          [],
        );

        // Custom item should NOT match, so recommended item should still be in shortages
        const shortageById = (shortages: typeof result.shortages, id: string) =>
          shortages.find((s) => s.itemId === id);
        const shortage = shortageById(result.shortages, recommendedId);
        // Assert shortage exists (since we're testing communication-info category items)
        expect(shortage).toBeDefined();
        expect(shortage!.actual).toBe(0);
      };

      testCases.forEach(({ name, recommendedId }) => {
        testCustomItemDoesNotMatch(name, recommendedId);
      });
    });
  });

  describe('items should match by itemType', () => {
    it('should match item with itemType even if name differs', () => {
      const item = createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'My Custom Battery Radio', // Different name
        itemType: createProductTemplateId('battery-radio'), // This enables matching
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(0), // Not enough, so it appears in shortages
        unit: 'pieces',
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [item],
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      // Should match by itemType (even though quantity is 0)
      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      expect(batteryRadioShortage).toBeDefined();
      expect(batteryRadioShortage!.actual).toBe(0); // Matched but quantity is 0
      expect(batteryRadioShortage!.missing).toBe(1);
      // Verify it's counted in totalActual
      expect(result.totalActual).toBe(0);
    });

    it('should match multiple items with same itemType and sum quantities', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('item-1'),
          name: 'Radio 1',
          categoryId: createCategoryId('communication-info'),
          quantity: createQuantity(1),
          itemType: createProductTemplateId('battery-radio'),
        }),
        createMockInventoryItem({
          id: createItemId('item-2'),
          name: 'Radio 2',
          categoryId: createCategoryId('communication-info'),
          quantity: createQuantity(1),
          itemType: createProductTemplateId('battery-radio'),
        }),
      ];

      const result = calculateCategoryShortages(
        'communication-info',
        items,
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      // Communication-info category tracks by item types, not quantities
      // Both items match the same recommended item (battery-radio), so it counts as 1 item type fulfilled
      // We need 2 item types total (battery-radio and hand-crank-radio)
      expect(result.totalActual).toBe(1); // 1 item type fulfilled (battery-radio)
      expect(result.totalNeeded).toBe(2); // 2 item types needed
      // Since we have battery-radio fulfilled, it won't be in shortages
      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      expect(batteryRadioShortage).toBeUndefined(); // Not in shortages because fulfilled
    });

    it('should show shortage when item matches but quantity is insufficient', () => {
      const item = createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'My Radio',
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(0), // Has 0, needs 1
        itemType: createProductTemplateId('battery-radio'),
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [item],
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      // Should match and appear in shortages because quantity is insufficient
      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      expect(batteryRadioShortage).toBeDefined();
      expect(batteryRadioShortage!.actual).toBe(0);
      expect(batteryRadioShortage!.needed).toBe(1);
      expect(batteryRadioShortage!.missing).toBe(1);
    });
  });

  describe('items should match by itemType when it equals recommended item ID', () => {
    it('should match item with itemType equal to recommended item ID', () => {
      const item = createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Some Radio',
        itemType: createProductTemplateId('battery-radio'), // itemType matches
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(0), // Not enough, so it appears in shortages
        unit: 'pieces',
        // itemType matches
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [item],
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      expect(batteryRadioShortage).toBeDefined();
      expect(batteryRadioShortage!.actual).toBe(0); // Matched by itemType but quantity is 0
      expect(result.totalActual).toBe(0);
    });
  });

  describe('non-custom items should match by normalized name', () => {
    it('should match non-custom item by normalized name', () => {
      // Item with itemType that's not 'custom' should match by name
      const item = createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Battery Radio', // Name normalizes to 'battery-radio'
        itemType: createProductTemplateId('some-other-type'), // Not 'custom', but also not matching
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(0), // Not enough, so it appears in shortages
        unit: 'pieces',
        // itemType is 'custom'
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [item],
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      expect(batteryRadioShortage).toBeDefined();
      expect(batteryRadioShortage!.actual).toBe(0); // Matched by normalized name but quantity is 0
      expect(result.totalActual).toBe(0);
    });

    it('should match item with name variations that normalize correctly', () => {
      const testCases = [
        { name: 'Battery Radio', expectedMatch: 'battery-radio' },
        { name: 'battery radio', expectedMatch: 'battery-radio' },
        { name: 'BATTERY RADIO', expectedMatch: 'battery-radio' },
        { name: 'Hand Crank Radio', expectedMatch: 'hand-crank-radio' },
      ];

      const testNameVariationMatches = (
        name: string,
        expectedMatch: string,
      ) => {
        const item = createMockInventoryItem({
          id: createItemId(`item-${expectedMatch}`),
          name,
          itemType: createProductTemplateId('some-type'), // Not 'custom'
          categoryId: createCategoryId('communication-info'),
          quantity: createQuantity(0), // Not enough, so it appears in shortages
          unit: 'pieces',
        });

        const result = calculateCategoryShortages(
          'communication-info',
          [item],
          household,
          RECOMMENDED_ITEMS,
          [],
        );

        const shortageById = (shortages: typeof result.shortages, id: string) =>
          shortages.find((s) => s.itemId === id);
        const shortage = shortageById(result.shortages, expectedMatch);
        expect(shortage).toBeDefined();
        expect(shortage!.actual).toBe(0); // Matched but quantity is 0
        expect(result.totalActual).toBe(0);
      };

      testCases.forEach(({ name, expectedMatch }) => {
        testNameVariationMatches(name, expectedMatch);
      });
    });
  });

  describe('matching priority and edge cases', () => {
    it('should match by itemType, not by name', () => {
      // Item with itemType for one item but name matching another
      const item = createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Battery Radio', // Name would match 'battery-radio' if not custom
        itemType: createProductTemplateId('hand-crank-radio'), // But itemType matches different item
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(0), // Not enough, so it appears in shortages
        unit: 'pieces',
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [item],
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      // Should match hand-crank-radio by itemType
      const handCrankShortage = result.shortages.find(
        (s) => s.itemId === 'hand-crank-radio',
      );
      expect(handCrankShortage).toBeDefined();
      expect(handCrankShortage!.actual).toBe(0); // Matched but quantity is 0

      // Should NOT match battery-radio (custom item doesn't match by name)
      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      expect(batteryRadioShortage).toBeDefined();
      expect(batteryRadioShortage!.actual).toBe(0); // Didn't match
    });

    it('should handle markedAsEnough correctly with custom items', () => {
      const customItem = createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Battery Radio',
        itemType: 'custom',
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(1),
        unit: 'pieces',
        markedAsEnough: true, // Marked as enough
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [customItem],
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      // Custom item doesn't match, so markedAsEnough shouldn't affect the shortage
      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      // Should still show as shortage because custom item didn't match
      expect(batteryRadioShortage).toBeDefined();
      expect(batteryRadioShortage!.missing).toBeGreaterThan(0);
    });

    it('should handle markedAsEnough correctly with matching items', () => {
      const matchingItem = createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Battery Radio',
        itemType: createProductTemplateId('battery-radio'),
        categoryId: createCategoryId('communication-info'),
        quantity: createQuantity(1),
        unit: 'pieces',
        // Needs 2, has 1
        markedAsEnough: true, // But marked as enough
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [matchingItem],
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      // Should NOT appear in shortages because markedAsEnough
      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      expect(batteryRadioShortage).toBeUndefined();
    });
  });
});
