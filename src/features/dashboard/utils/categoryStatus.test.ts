import {
  calculateCategoryStatus,
  calculateAllCategoryStatuses,
  calculateCategoryShortages,
  getCategoryDisplayStatus,
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
} from '@/shared/types';
import {
  DAILY_WATER_PER_PERSON,
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import {
  randomChildrenMinOne,
  randomSupplyDurationDaysLong,
  randomQuantitySmall,
  randomQuantityMedium,
  randomQuantityLarge,
  randomQuantityFloat,
  randomLessThan,
  randomMoreThan,
  randomPercentageMid,
} from '@/shared/utils/test/faker-helpers';

describe('calculateCategoryStatus', () => {
  const waterCategory = createMockCategory({
    id: createCategoryId('water'),
    name: 'Water',
    icon: '💧',
  });

  it('should calculate status for empty category', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(waterCategory, items, 0);

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
    });
  });

  it('should return critical status when completion < 30%', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(waterCategory, items, 25);

    expect(result.status).toBe('critical');
    expect(result.completionPercentage).toBe(25);
  });

  it('should return warning status when completion between 30-70%', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(waterCategory, items, 50);

    expect(result.status).toBe('warning');
    expect(result.completionPercentage).toBe(50);
  });

  it('should return ok status when completion >= 70%', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(waterCategory, items, 80);

    expect(result.status).toBe('ok');
    expect(result.completionPercentage).toBe(80);
  });

  it('should count items by status correctly', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        quantity: 0,
        unit: 'liters', // 'gallons' is not a valid unit
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Water Bottles',
        categoryId: createCategoryId('water'),
        quantity: 10,
        unit: 'bottles',
        recommendedQuantity: 24,
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Water Purification',
        categoryId: createCategoryId('water'),
        quantity: 5,
        unit: 'pieces', // 'tablets' is not a valid unit
        recommendedQuantity: 5,
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const result = calculateCategoryStatus(waterCategory, items, 60);

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
        quantity: 0,
        unit: 'liters', // 'gallons' is not a valid unit
        recommendedQuantity: 28,
        neverExpires: true,
      }),
    ];

    const result = calculateCategoryStatus(waterCategory, items, 20);
    expect(result.status).toBe('critical');
    expect(result.criticalCount).toBe(1);
  });

  it('should only count items from the specified category', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        quantity: 28,
        unit: 'liters', // 'gallons' is not a valid unit
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Food',
        categoryId: createCategoryId('food'),
        quantity: 10,
        unit: 'cans',
        recommendedQuantity: 10,
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const result = calculateCategoryStatus(waterCategory, items, 100);
    expect(result.itemCount).toBe(1);
  });
});

describe('calculateAllCategoryStatuses', () => {
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
    );

    expect(results[0].completionPercentage).toBe(80);
    expect(results[1].completionPercentage).toBe(0);
    expect(results[2].completionPercentage).toBe(0);
  });

  it('should return empty array for no categories', () => {
    const items: InventoryItem[] = [];
    const preparedness = new Map<string, number>();

    const results = calculateAllCategoryStatuses([], items, preparedness);

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
      const pastaQuantity = 2.0;
      const items: InventoryItem[] = [
        createMockInventoryItem({
          id: createItemId('1'),
          name: 'Pasta',
          categoryId: createCategoryId('food'),
          quantity: pastaQuantity,
          unit: 'kilograms',
          recommendedQuantity: 1,
          productTemplateId: createProductTemplateId('pasta'), // 1 L/kg water requirement
          neverExpires: false,
          expirationDate: createDateOnly('2025-12-31'),
        }),
      ];

      const result = calculateCategoryShortages(
        'water-beverages',
        items,
        household,
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
    const actual = randomLessThan(needed);

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: actual,
        unit: 'liters',
        recommendedQuantity: needed,
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const result = calculateCategoryShortages(
      'water-beverages',
      items,
      household,
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
    const waterNeeded = Math.ceil(
      DAILY_WATER_PER_PERSON * peopleMultiplier * household.supplyDurationDays,
    );
    const milkNeeded = Math.ceil(2 * peopleMultiplier);
    const juiceNeeded = Math.ceil(2 * peopleMultiplier);

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: waterNeeded,
        unit: 'liters',
        recommendedQuantity: waterNeeded,
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Long Life Milk',
        categoryId: createCategoryId('water-beverages'),
        quantity: milkNeeded,
        unit: 'liters',
        recommendedQuantity: milkNeeded,
        productTemplateId: createProductTemplateId('long-life-milk'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Long Life Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: juiceNeeded,
        unit: 'liters',
        recommendedQuantity: juiceNeeded,
        productTemplateId: createProductTemplateId('long-life-juice'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const result = calculateCategoryShortages(
      'water-beverages',
      items,
      household,
    );

    expect(result.shortages.length).toBe(0);
  });

  it('should return empty for custom category with no recommendations', () => {
    const result = calculateCategoryShortages('custom-category', [], household);

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
        quantity: 50, // missing 4
        productTemplateId: createProductTemplateId('bottled-water'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        categoryId: createCategoryId('water-beverages'),
        quantity: 0, // missing all
        productTemplateId: createProductTemplateId('long-life-milk'),
      }),
    ];

    const result = calculateCategoryShortages(
      'water-beverages',
      items,
      household,
    );

    // Should be sorted with biggest shortage first
    if (result.shortages.length >= 2) {
      expect(result.shortages[0].missing).toBeGreaterThanOrEqual(
        result.shortages[1].missing,
      );
    }
  });

  it('should calculate calories for food category', () => {
    const soupQuantity = randomQuantitySmall();
    const pastaQuantity = randomQuantityFloat();
    const soupCalories = 200;
    const pastaCalories = 3500;

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: soupQuantity,
        productTemplateId: createProductTemplateId('canned-soup'),
        caloriesPerUnit: soupCalories,
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        categoryId: createCategoryId('food'),
        quantity: pastaQuantity,
        productTemplateId: createProductTemplateId('pasta'),
        caloriesPerUnit: pastaCalories,
      }),
    ];

    const result = calculateCategoryShortages('food', items, household);

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
    const riceQuantity = Math.ceil((neededCalories / 3600) * 1.2); // 20% more than needed

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: riceQuantity,
        productTemplateId: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const result = calculateCategoryShortages('food', items, household);

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
        quantity: 54,
        productTemplateId: createProductTemplateId('bottled-water'),
      }),
    ];

    const result = calculateCategoryShortages(
      'water-beverages',
      items,
      household,
    );

    expect(result.totalActualCalories).toBeUndefined();
    expect(result.totalNeededCalories).toBeUndefined();
    expect(result.missingCalories).toBeUndefined();
  });
});

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
    const actual = randomMoreThan(totalNeeded); // More than total needed

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: actual,
        unit: 'liters',
        recommendedQuantity: needed,
        productTemplateId: createProductTemplateId('bottled-water'),
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
    const actual = randomLessThan(needed); // Less than needed

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: actual,
        unit: 'liters',
        recommendedQuantity: needed,
        productTemplateId: createProductTemplateId('bottled-water'),
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
    const riceQuantity = Math.ceil((neededCalories / 3600) * 1.2);

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: riceQuantity,
        productTemplateId: createProductTemplateId('rice'),
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
    // Create items with insufficient calories
    const riceQuantity = Math.max(0.1, (neededCalories / 3600) * 0.5); // 50% of needed

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: riceQuantity,
        productTemplateId: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    // Use a fixed low percentage (25) that's strictly less than CRITICAL_PERCENTAGE_THRESHOLD (30)
    // to ensure deterministic test behavior. randomPercentageLow() can return 30, which would
    // not trigger the critical status check (completionPercentage < 30).
    const completionPercentage = 25;
    const result = calculateCategoryStatus(
      foodCategory,
      items,
      completionPercentage,
      household,
    );

    expect(result.status).toBe('critical');
  });

  it('should still use completion percentage when household is not provided', () => {
    const items: InventoryItem[] = [];

    // Without household, we can't calculate shortages, so use completion percentage
    const resultLow = calculateCategoryStatus(waterCategory, items, 20);
    expect(resultLow.status).toBe('critical');

    const resultMid = calculateCategoryStatus(waterCategory, items, 50);
    expect(resultMid.status).toBe('warning');

    const resultHigh = calculateCategoryStatus(waterCategory, items, 80);
    expect(resultHigh.status).toBe('ok');
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
      [],
    );

    const resultWithDisabled = calculateCategoryShortages(
      'water-beverages',
      [],
      household,
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
    const actual = needed + randomQuantitySmall(); // Enough or more

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: actual,
        productTemplateId: createProductTemplateId('bottled-water'),
      }),
    ];

    // With milk and juice disabled, we should have enough
    const resultWithDisabled = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
      ['long-life-milk', 'long-life-juice'],
    );

    // When milk and juice are disabled, only water matters, and we have enough
    expect(resultWithDisabled.shortages.length).toBe(0);
    expect(resultWithDisabled.status).toBe('ok');
  });

  it('should show ok status when all recommended items are disabled and there is inventory', () => {
    const quantity = randomQuantityMedium();

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity,
        productTemplateId: createProductTemplateId('bottled-water'),
      }),
    ];

    const result = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
      ['bottled-water', 'long-life-milk', 'long-life-juice'],
    );

    // When all items are disabled, status should be ok
    expect(result.shortages.length).toBe(0);
    expect(result.status).toBe('ok');
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
        quantity: 1,
        unit: 'pieces',
        productTemplateId: createProductTemplateId('battery-radio'),
      }),
    ];

    const result = calculateCategoryShortages(
      'communication-info',
      items,
      household,
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
        quantity: 1,
        unit: 'pieces',
        productTemplateId: createProductTemplateId('battery-radio'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        categoryId: createCategoryId('communication-info'),
        quantity: 1,
        unit: 'pieces',
        productTemplateId: createProductTemplateId('hand-crank-radio'),
      }),
    ];

    const result = calculateCategoryShortages(
      'communication-info',
      items,
      household,
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
        quantity: 5,
        unit: 'pieces',
        productTemplateId: createProductTemplateId('battery-radio'),
      }),
    ];

    const result = calculateCategoryShortages(
      'communication-info',
      items,
      household,
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
        quantity: 2,
        unit: 'pieces',
        recommendedQuantity: 5,
        // No productTemplateId - this is a custom item
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [customItem],
        household,
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
      const testCases = [
        { name: 'Battery Radio', recommendedId: 'battery-radio' },
        { name: 'Hand Crank Radio', recommendedId: 'hand-crank-radio' },
        { name: 'First Aid Kit', recommendedId: 'first-aid-kit' },
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
          quantity: 1,
          unit: 'pieces',
          recommendedQuantity: 1,
        });

        const result = calculateCategoryShortages(
          'communication-info',
          [customItem],
          household,
        );

        // Custom item should NOT match, so recommended item should still be in shortages
        const shortage = result.shortages.find(
          (s) => s.itemId === recommendedId,
        );
        if (shortage) {
          expect(shortage.actual).toBe(0);
        }
      };

      testCases.forEach(({ name, recommendedId }) => {
        testCustomItemDoesNotMatch(name, recommendedId);
      });
    });
  });

  describe('items should match by productTemplateId', () => {
    it('should match item with productTemplateId even if name differs', () => {
      const item = createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'My Custom Battery Radio', // Different name
        itemType: createProductTemplateId('battery-radio'),
        categoryId: createCategoryId('communication-info'),
        quantity: 0, // Not enough, so it appears in shortages
        unit: 'pieces',
        recommendedQuantity: 1,
        productTemplateId: createProductTemplateId('battery-radio'), // This enables matching
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [item],
        household,
      );

      // Should match by productTemplateId (even though quantity is 0)
      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      expect(batteryRadioShortage).toBeDefined();
      expect(batteryRadioShortage!.actual).toBe(0); // Matched but quantity is 0
      expect(batteryRadioShortage!.missing).toBe(1);
      // Verify it's counted in totalActual
      expect(result.totalActual).toBe(0);
    });

    it('should match multiple items with same productTemplateId and sum quantities', () => {
      const items = [
        createMockInventoryItem({
          id: createItemId('item-1'),
          name: 'Radio 1',
          categoryId: createCategoryId('communication-info'),
          quantity: 1,
          productTemplateId: createProductTemplateId('battery-radio'),
        }),
        createMockInventoryItem({
          id: createItemId('item-2'),
          name: 'Radio 2',
          categoryId: createCategoryId('communication-info'),
          quantity: 1,
          productTemplateId: createProductTemplateId('battery-radio'),
        }),
      ];

      const result = calculateCategoryShortages(
        'communication-info',
        items,
        household,
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
        quantity: 0, // Has 0, needs 1
        productTemplateId: createProductTemplateId('battery-radio'),
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [item],
        household,
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
        quantity: 0, // Not enough, so it appears in shortages
        unit: 'pieces',
        recommendedQuantity: 1,
        // No productTemplateId, but itemType matches
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [item],
        household,
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
        quantity: 0, // Not enough, so it appears in shortages
        unit: 'pieces',
        recommendedQuantity: 1,
        // No productTemplateId
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [item],
        household,
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
          quantity: 0, // Not enough, so it appears in shortages
          unit: 'pieces',
          recommendedQuantity: 1,
        });

        const result = calculateCategoryShortages(
          'communication-info',
          [item],
          household,
        );

        const shortage = result.shortages.find(
          (s) => s.itemId === expectedMatch,
        );
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
    it('should prioritize productTemplateId over name matching', () => {
      // Item with productTemplateId for one item but name matching another
      const item = createMockInventoryItem({
        id: createItemId('item-1'),
        name: 'Battery Radio', // Name would match 'battery-radio' if not custom
        itemType: 'custom',
        categoryId: createCategoryId('communication-info'),
        quantity: 0, // Not enough, so it appears in shortages
        unit: 'pieces',
        recommendedQuantity: 1,
        productTemplateId: createProductTemplateId('hand-crank-radio'), // But productTemplateId matches different item
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [item],
        household,
      );

      // Should match hand-crank-radio by productTemplateId
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
        quantity: 1,
        unit: 'pieces',
        recommendedQuantity: 1,
        markedAsEnough: true, // Marked as enough
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [customItem],
        household,
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
        quantity: 1,
        unit: 'pieces',
        recommendedQuantity: 2, // Needs 2, has 1
        markedAsEnough: true, // But marked as enough
        productTemplateId: createProductTemplateId('battery-radio'),
      });

      const result = calculateCategoryShortages(
        'communication-info',
        [matchingItem],
        household,
      );

      // Should NOT appear in shortages because markedAsEnough
      const batteryRadioShortage = result.shortages.find(
        (s) => s.itemId === 'battery-radio',
      );
      expect(batteryRadioShortage).toBeUndefined();
    });
  });
});

describe('getCategoryDisplayStatus', () => {
  const household = createMockHousehold();

  it('should return all display data for a category', () => {
    const quantity = randomQuantityLarge();

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity,
        productTemplateId: createProductTemplateId('bottled-water'),
      }),
    ];

    const result = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
    );

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('completionPercentage');
    expect(result).toHaveProperty('totalActual');
    expect(result).toHaveProperty('totalNeeded');
    expect(result).toHaveProperty('primaryUnit');
    expect(result).toHaveProperty('shortages');
  });

  it('should calculate correct status from percentage', () => {
    const items: InventoryItem[] = [];

    // Empty category should be critical (0% completion)
    const result = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
    );

    expect(result.status).toBe('critical');
    expect(result.completionPercentage).toBe(0);
  });

  it('should include calorie data for food category', () => {
    const quantity = randomQuantityFloat();

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity,
        productTemplateId: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const result = getCategoryDisplayStatus('food', items, household);

    expect(result.totalActualCalories).toBeDefined();
    expect(result.totalNeededCalories).toBeDefined();
    expect(result.missingCalories).toBeDefined();
  });

  it('should not include calorie data for non-food categories', () => {
    const quantity = randomQuantityLarge();

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity,
        productTemplateId: createProductTemplateId('bottled-water'),
      }),
    ];

    const result = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
    );

    expect(result.totalActualCalories).toBeUndefined();
    expect(result.totalNeededCalories).toBeUndefined();
    expect(result.missingCalories).toBeUndefined();
  });

  it('should return ok status when totalActual >= totalNeeded even with missing recommended items', () => {
    // Calculate total needed based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const waterNeeded = Math.ceil(
      DAILY_WATER_PER_PERSON * peopleMultiplier * household.supplyDurationDays,
    );
    const milkNeeded = Math.ceil(2 * peopleMultiplier);
    const juiceNeeded = Math.ceil(2 * peopleMultiplier);
    const totalNeeded = waterNeeded + milkNeeded + juiceNeeded;
    const actual = randomMoreThan(totalNeeded); // More than needed

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: actual,
        unit: 'liters',
        recommendedQuantity: waterNeeded,
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const result = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
    );

    // Should be "ok" because we have enough total quantity
    expect(result.status).toBe('ok');
    expect(result.totalActual).toBeGreaterThanOrEqual(result.totalNeeded);
  });

  it('should return ok for food when calories are sufficient despite missing items', () => {
    // Calculate needed calories based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const neededCalories = Math.ceil(
      peopleMultiplier * household.supplyDurationDays * 2000,
    );
    // Create items with enough calories (more than needed)
    const riceQuantity = Math.ceil((neededCalories / 3600) * 1.2);

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: riceQuantity,
        productTemplateId: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const result = getCategoryDisplayStatus('food', items, household);

    expect(result.status).toBe('ok');
    expect(result.totalActualCalories).toBeGreaterThanOrEqual(
      result.totalNeededCalories!,
    );
  });

  it('should calculate completionPercentage based on calories for food category', () => {
    // Calculate needed calories based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const neededCalories =
      peopleMultiplier * household.supplyDurationDays * 2000;
    // Create items with exactly 50% of needed calories
    const targetPercentage = 50;
    const targetCalories = (neededCalories * targetPercentage) / 100;
    const riceQuantity = targetCalories / 3600; // 3600 cal per unit of rice

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: riceQuantity,
        productTemplateId: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const result = getCategoryDisplayStatus('food', items, household);

    // The completionPercentage should reflect calorie-based progress, not item count
    expect(result.completionPercentage).toBe(targetPercentage);
    expect(result.totalActualCalories).toBeCloseTo(targetCalories, 0);
    expect(result.totalNeededCalories).toBeCloseTo(neededCalories, 0);
  });

  it('should return critical when not enough inventory', () => {
    // Calculate needed water based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const needed = Math.ceil(
      DAILY_WATER_PER_PERSON * peopleMultiplier * household.supplyDurationDays,
    );
    // Use a fixed percentage (25%) that's strictly less than CRITICAL_PERCENTAGE_THRESHOLD (30%)
    // to guarantee 'critical' status. randomPercentageLow() can return 30, which could result
    // in exactly 30% completion, causing getStatusFromPercentage(30) to return 'warning' instead of 'critical'.
    const criticalPercentage = 25; // Fixed value < 30% to ensure critical status
    const actual = Math.floor((needed * criticalPercentage) / 100);

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: actual,
        productTemplateId: createProductTemplateId('bottled-water'),
      }),
    ];

    const result = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
    );

    expect(result.status).toBe('critical');
    expect(result.totalActual).toBeLessThan(result.totalNeeded);
  });
});
