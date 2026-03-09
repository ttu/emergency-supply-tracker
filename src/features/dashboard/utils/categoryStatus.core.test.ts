import {
  calculateCategoryStatus,
  calculateAllCategoryStatuses,
  calculateCategoryShortages,
} from './categoryStatus';
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
} from '@/shared/utils/constants';
import {
  randomChildrenMinOne,
  randomSupplyDurationDaysLong,
  randomQuantitySmall,
  randomQuantityFloat,
  randomLessThan,
} from '@/shared/utils/test/faker-helpers';

describe('calculateCategoryStatus', () => {
  const mockHousehold = createMockHousehold();
  const waterCategory = createMockCategory({
    id: createCategoryId('water'),
    name: 'Water',
    icon: '💧',
  });

  it('should calculate status for empty category', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(
      waterCategory,
      items,
      0,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result).toEqual({
      categoryId: createCategoryId('water'),
      itemCount: 0,
      status: 'critical',
      completionPercentage: 0,
      criticalCount: 0,
      warningCount: 0,
      okCount: 0,
      shortages: [],
      totalActual: 0,
      totalNeeded: 0,
      primaryUnit: undefined,
      totalActualCalories: undefined,
      totalNeededCalories: undefined,
      missingCalories: undefined,
      drinkingWaterNeeded: undefined,
      preparationWaterNeeded: undefined,
      hasRecommendations: false,
    });
  });

  it('should return critical status when completion < 30%', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(
      waterCategory,
      items,
      25,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.status).toBe('critical');
    expect(result.completionPercentage).toBe(25);
  });

  it('should return warning status when completion between 30-70%', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(
      waterCategory,
      items,
      50,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.status).toBe('warning');
    expect(result.completionPercentage).toBe(50);
  });

  it('should return ok status when completion >= 70%', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(
      waterCategory,
      items,
      80,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.status).toBe('ok');
    expect(result.completionPercentage).toBe(80);
  });

  it('should count items by status correctly', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        quantity: createQuantity(0),
        unit: 'liters', // 'gallons' is not a valid unit
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Water Bottles',
        categoryId: createCategoryId('water'),
        quantity: createQuantity(10),
        unit: 'bottles',
        itemType: createProductTemplateId('long-life-milk'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Water Purification',
        categoryId: createCategoryId('water'),
        quantity: createQuantity(5),
        unit: 'pieces', // 'tablets' is not a valid unit
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const result = calculateCategoryStatus(
      waterCategory,
      items,
      60,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.itemCount).toBe(3);
    expect(result.criticalCount).toBeGreaterThanOrEqual(0);
    expect(result.warningCount).toBeGreaterThanOrEqual(0);
    expect(result.okCount).toBeGreaterThanOrEqual(0);
    expect(result.criticalCount + result.warningCount + result.okCount).toBe(3);
  });

  it('should override to critical if any items are critical', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        quantity: createQuantity(0),
        unit: 'liters', // 'gallons' is not a valid unit
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: true,
      }),
    ];

    const result = calculateCategoryStatus(
      waterCategory,
      items,
      20,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );
    expect(result.status).toBe('critical');
    expect(result.criticalCount).toBe(1);
  });

  it('should only count items from the specified category', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        quantity: createQuantity(28),
        unit: 'liters', // 'gallons' is not a valid unit
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Food',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(10),
        unit: 'cans',
        itemType: createProductTemplateId('canned-soup'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const result = calculateCategoryStatus(
      waterCategory,
      items,
      100,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );
    expect(result.itemCount).toBe(1);
  });
});

describe('calculateAllCategoryStatuses', () => {
  const mockHousehold = createMockHousehold();
  const categories = [
    createMockCategory({
      id: createCategoryId('water'),
      name: 'Water',
      icon: '💧',
    }),
    createMockCategory({
      id: createCategoryId('food'),
      name: 'Food',
      icon: '🥫',
    }),
    createMockCategory({
      id: createCategoryId('medical'),
      name: 'Medical',
      icon: '⚕️',
    }),
  ];

  it('should calculate status for all categories', () => {
    const items: InventoryItem[] = [];
    const preparedness = new Map<string, number>([
      ['water', 80],
      ['food', 50],
      ['medical', 20],
    ]);

    const results = calculateAllCategoryStatuses(
      categories,
      items,
      preparedness,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(results).toHaveLength(3);
    expect(results[0].categoryId).toBe('water');
    expect(results[1].categoryId).toBe('food');
    expect(results[2].categoryId).toBe('medical');
  });

  it('should use 0 as default preparedness if not in map', () => {
    const items: InventoryItem[] = [];
    const preparedness = new Map<string, number>([['water', 80]]);

    const results = calculateAllCategoryStatuses(
      categories,
      items,
      preparedness,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(results[0].completionPercentage).toBe(80);
    expect(results[1].completionPercentage).toBe(0);
    expect(results[2].completionPercentage).toBe(0);
  });

  it('should return empty array for no categories', () => {
    const items: InventoryItem[] = [];
    const preparedness = new Map<string, number>();

    const results = calculateAllCategoryStatuses(
      [],
      items,
      preparedness,
      mockHousehold,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(results).toHaveLength(0);
  });
});

describe('calculateCategoryShortages', () => {
  const household = createMockHousehold();

  // Water calculation tests - DAILY_WATER_PER_PERSON liters per person per day
  describe(`water calculation - ${DAILY_WATER_PER_PERSON}L per person per day`, () => {
    it('should calculate water correctly for random household configurations', () => {
      const oneAdultHousehold = createMockHousehold({ useFreezer: false });

      const result = calculateCategoryShortages(
        'water-beverages',
        [],
        oneAdultHousehold,
        RECOMMENDED_ITEMS,
        [],
      );

      // Calculate expected: DAILY_WATER_PER_PERSON × (adults × 1 + children × 0.75) × days
      const peopleMultiplier =
        oneAdultHousehold.adults * ADULT_REQUIREMENT_MULTIPLIER +
        oneAdultHousehold.children * CHILDREN_REQUIREMENT_MULTIPLIER;
      const expected = Math.ceil(
        DAILY_WATER_PER_PERSON *
          peopleMultiplier *
          oneAdultHousehold.supplyDurationDays,
      );

      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(expected);
    });

    it('should calculate water correctly for household', () => {
      const result = calculateCategoryShortages(
        'water-beverages',
        [],
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      // Calculate expected based on household configuration
      const peopleMultiplier =
        household.adults * ADULT_REQUIREMENT_MULTIPLIER +
        household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
      const expected = Math.ceil(
        DAILY_WATER_PER_PERSON *
          peopleMultiplier *
          household.supplyDurationDays,
      );

      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(expected);
    });

    it('should calculate water correctly for longer supply duration', () => {
      const weekHousehold = createMockHousehold({
        supplyDurationDays: randomSupplyDurationDaysLong(),
        useFreezer: false,
      });

      const result = calculateCategoryShortages(
        'water-beverages',
        [],
        weekHousehold,
        RECOMMENDED_ITEMS,
        [],
      );

      // Calculate expected: DAILY_WATER_PER_PERSON × (adults × 1 + children × 0.75) × days
      const peopleMultiplier =
        weekHousehold.adults * ADULT_REQUIREMENT_MULTIPLIER +
        weekHousehold.children * CHILDREN_REQUIREMENT_MULTIPLIER;
      const expected = Math.ceil(
        DAILY_WATER_PER_PERSON *
          peopleMultiplier *
          weekHousehold.supplyDurationDays,
      );

      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(expected);
    });

    it('should calculate children at correct multiplier for water needs', () => {
      const familyHousehold = createMockHousehold({
        children: randomChildrenMinOne(),
        useFreezer: false,
      });

      const result = calculateCategoryShortages(
        'water-beverages',
        [],
        familyHousehold,
        RECOMMENDED_ITEMS,
        [],
      );

      // Calculate expected: DAILY_WATER_PER_PERSON × (adults × 1 + children × 0.75) × days
      const peopleMultiplier =
        familyHousehold.adults * ADULT_REQUIREMENT_MULTIPLIER +
        familyHousehold.children * CHILDREN_REQUIREMENT_MULTIPLIER;
      const expected = Math.ceil(
        DAILY_WATER_PER_PERSON *
          peopleMultiplier *
          familyHousehold.supplyDurationDays,
      );

      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(expected);
    });

    it('should calculate correctly for children-only households', () => {
      const childOnlyHousehold = createMockHousehold({
        adults: 0,
        children: randomChildrenMinOne(),
        useFreezer: false,
      });

      const result = calculateCategoryShortages(
        'water-beverages',
        [],
        childOnlyHousehold,
        RECOMMENDED_ITEMS,
        [],
      );

      // Calculate expected: DAILY_WATER_PER_PERSON × (0 × 1 + children × 0.75) × days
      const peopleMultiplier =
        childOnlyHousehold.children * CHILDREN_REQUIREMENT_MULTIPLIER;
      const expected = Math.ceil(
        DAILY_WATER_PER_PERSON *
          peopleMultiplier *
          childOnlyHousehold.supplyDurationDays,
      );

      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(expected);
    });

    it('should include water for food preparation in bottled-water recommendation', () => {
      // Items include pasta which requires 1L per kg for preparation
      // Use a fixed value (2.0) instead of random to avoid floating-point precision issues
      // that can cause Math.ceil() to round incorrectly (e.g., 86.9999999999 -> 86 instead of 87)
      const pastaQuantity = createQuantity(2);
      const items: InventoryItem[] = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          itemType: createProductTemplateId('pasta'), // 1 L/kg water requirement
          neverExpires: false,
          expirationDate: createDateOnly('2025-12-31'),
        }),
      ];

      const result = calculateCategoryShortages(
        'water-beverages',
        items,
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      // Calculate expected: base water + preparation water
      // Note: ceiling is applied once at the end, not separately on base water
      const peopleMultiplier =
        household.adults * ADULT_REQUIREMENT_MULTIPLIER +
        household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
      const baseWater =
        DAILY_WATER_PER_PERSON *
        peopleMultiplier *
        household.supplyDurationDays;
      const preparationWater = pastaQuantity * 1; // 1 L/kg
      const expected = Math.ceil(baseWater + preparationWater);

      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(expected);
      expect(result.preparationWaterNeeded).toBeCloseTo(preparationWater, 1);
    });

    it('should not add preparation water when no food requires water', () => {
      const items: InventoryItem[] = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Crackers',
          categoryId: createCategoryId('food'),
          unit: 'packages',
          neverExpires: false,
          expirationDate: createDateOnly('2025-12-31'),
        }),
      ];

      const result = calculateCategoryShortages(
        'water-beverages',
        items,
        household,
        RECOMMENDED_ITEMS,
        [],
      );

      // Calculate expected: just base water requirement (no preparation water)
      const peopleMultiplier =
        household.adults * ADULT_REQUIREMENT_MULTIPLIER +
        household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
      const expected = Math.ceil(
        DAILY_WATER_PER_PERSON *
          peopleMultiplier *
          household.supplyDurationDays,
      );

      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(expected);
      expect(result.preparationWaterNeeded).toBe(0);
    });
  });

  it('should calculate shortages for water category', () => {
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const needed = Math.ceil(
      DAILY_WATER_PER_PERSON * peopleMultiplier * household.supplyDurationDays,
    );
    const actual = createQuantity(randomLessThan(needed));

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

    const result = calculateCategoryShortages(
      'water-beverages',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.shortages.length).toBeGreaterThan(0);
    expect(result.totalActual).toBe(actual);
    expect(result.primaryUnit).toBe('liters');
  });

  it('should return no shortages when fully stocked', () => {
    // Calculate needed quantities based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const waterNeeded = createQuantity(
      Math.ceil(
        DAILY_WATER_PER_PERSON *
          peopleMultiplier *
          household.supplyDurationDays,
      ),
    );
    const milkNeeded = createQuantity(Math.ceil(2 * peopleMultiplier));
    const juiceNeeded = createQuantity(Math.ceil(2 * peopleMultiplier));

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: waterNeeded,
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Long Life Milk',
        categoryId: createCategoryId('water-beverages'),
        quantity: milkNeeded,
        unit: 'liters',
        itemType: createProductTemplateId('long-life-milk'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Long Life Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: juiceNeeded,
        unit: 'liters',
        itemType: createProductTemplateId('long-life-juice'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const result = calculateCategoryShortages(
      'water-beverages',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.shortages.length).toBe(0);
  });

  it('should return empty for custom category with no recommendations', () => {
    const result = calculateCategoryShortages(
      'custom-category',
      [],
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.shortages).toEqual([]);
    expect(result.totalActual).toBe(0);
    expect(result.totalNeeded).toBe(0);
    expect(result.primaryUnit).toBeUndefined();
  });

  it('should sort shortages by missing amount descending', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(50), // missing 4
        itemType: createProductTemplateId('bottled-water'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0), // missing all
        itemType: createProductTemplateId('long-life-milk'),
      }),
    ];

    const result = calculateCategoryShortages(
      'water-beverages',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Should be sorted with biggest shortage first
    if (result.shortages.length >= 2) {
      expect(result.shortages[0].missing).toBeGreaterThanOrEqual(
        result.shortages[1].missing,
      );
    }
  });

  it('should calculate calories for food category', () => {
    const soupQuantity = createQuantity(randomQuantitySmall());
    const pastaQuantity = createQuantity(randomQuantityFloat());
    const soupCalories = 200;
    const pastaCalories = 3500;

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: soupQuantity,
        itemType: createProductTemplateId('canned-soup'),
        caloriesPerUnit: soupCalories,
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        categoryId: createCategoryId('food'),
        quantity: pastaQuantity,
        itemType: createProductTemplateId('pasta'),
        caloriesPerUnit: pastaCalories,
      }),
    ];

    const result = calculateCategoryShortages(
      'food',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    const actualCalories =
      soupQuantity * soupCalories + pastaQuantity * pastaCalories;
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const neededCalories = Math.ceil(
      peopleMultiplier * household.supplyDurationDays * 2000,
    );
    const missingCalories = Math.max(0, neededCalories - actualCalories);

    expect(result.totalActualCalories).toBeCloseTo(actualCalories, 0);
    expect(result.totalNeededCalories).toBe(neededCalories);
    expect(result.missingCalories).toBeCloseTo(missingCalories, 0);
  });

  it('should return no missing calories when fully stocked', () => {
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
    ); // 20% more than needed

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: riceQuantity,
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const result = calculateCategoryShortages(
      'food',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    const actualCalories = riceQuantity * 3600;
    expect(result.totalActualCalories).toBe(actualCalories);
    expect(result.totalNeededCalories).toBe(neededCalories);
    expect(result.missingCalories).toBe(0);
  });

  it('should not return calorie data for non-food categories', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(54),
        itemType: createProductTemplateId('bottled-water'),
      }),
    ];

    const result = calculateCategoryShortages(
      'water-beverages',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.totalActualCalories).toBeUndefined();
    expect(result.totalNeededCalories).toBeUndefined();
    expect(result.missingCalories).toBeUndefined();
  });
});
