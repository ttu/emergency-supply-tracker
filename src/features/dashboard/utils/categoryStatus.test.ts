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
  randomPercentageLow,
  randomPercentageMid,
} from '@/shared/utils/test/faker-helpers';

describe('calculateCategoryStatus', () => {
  const waterCategory = createMockCategory({
    id: 'water',
    name: 'Water',
    icon: '💧',
  });

  it('should calculate status for empty category', () => {
    const items: InventoryItem[] = [];
    const result = calculateCategoryStatus(waterCategory, items, 0);

    expect(result).toEqual({
      categoryId: 'water',
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
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 0,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Water Bottles',
        categoryId: 'water',
        quantity: 10,
        unit: 'bottles',
        recommendedQuantity: 24,
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
      createMockInventoryItem({
        id: '3',
        name: 'Water Purification',
        categoryId: 'water',
        quantity: 5,
        unit: 'tablets',
        recommendedQuantity: 5,
        neverExpires: false,
        expirationDate: '2025-12-31',
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
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 0,
        unit: 'gallons',
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
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 28,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Food',
        categoryId: 'food',
        quantity: 10,
        unit: 'cans',
        recommendedQuantity: 10,
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const result = calculateCategoryStatus(waterCategory, items, 100);
    expect(result.itemCount).toBe(1);
  });
});

describe('calculateAllCategoryStatuses', () => {
  const categories = [
    createMockCategory({ id: 'water', name: 'Water', icon: '💧' }),
    createMockCategory({ id: 'food', name: 'Food', icon: '🥫' }),
    createMockCategory({ id: 'medical', name: 'Medical', icon: '⚕️' }),
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
          id: '1',
          name: 'Pasta',
          categoryId: 'food',
          quantity: pastaQuantity,
          unit: 'kilograms',
          recommendedQuantity: 1,
          productTemplateId: 'pasta', // 1 L/kg water requirement
          neverExpires: false,
          expirationDate: '2025-12-31',
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
          id: '1',
          name: 'Crackers',
          categoryId: 'food',
          unit: 'packages',
          neverExpires: false,
          expirationDate: '2025-12-31',
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
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: actual,
        unit: 'liters',
        recommendedQuantity: needed,
        productTemplateId: 'bottled-water',
        neverExpires: false,
        expirationDate: '2025-12-31',
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
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: waterNeeded,
        unit: 'liters',
        recommendedQuantity: waterNeeded,
        productTemplateId: 'bottled-water',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Long Life Milk',
        categoryId: 'water-beverages',
        quantity: milkNeeded,
        unit: 'liters',
        recommendedQuantity: milkNeeded,
        productTemplateId: 'long-life-milk',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
      createMockInventoryItem({
        id: '3',
        name: 'Long Life Juice',
        categoryId: 'water-beverages',
        quantity: juiceNeeded,
        unit: 'liters',
        recommendedQuantity: juiceNeeded,
        productTemplateId: 'long-life-juice',
        neverExpires: false,
        expirationDate: '2025-12-31',
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
        id: '1',
        categoryId: 'water-beverages',
        quantity: 50, // missing 4
        productTemplateId: 'bottled-water',
      }),
      createMockInventoryItem({
        id: '2',
        categoryId: 'water-beverages',
        quantity: 0, // missing all
        productTemplateId: 'long-life-milk',
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
        id: '1',
        categoryId: 'food',
        quantity: soupQuantity,
        productTemplateId: 'canned-soup',
        caloriesPerUnit: soupCalories,
      }),
      createMockInventoryItem({
        id: '2',
        categoryId: 'food',
        quantity: pastaQuantity,
        productTemplateId: 'pasta',
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
        id: '1',
        categoryId: 'food',
        quantity: riceQuantity,
        productTemplateId: 'rice',
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
        id: '1',
        categoryId: 'water-beverages',
        quantity: 54,
        productTemplateId: 'bottled-water',
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
    id: 'water-beverages',
    name: 'Water & Beverages',
    icon: '💧',
  });

  const foodCategory = createMockCategory({
    id: 'food',
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
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: actual,
        unit: 'liters',
        recommendedQuantity: needed,
        productTemplateId: 'bottled-water',
        neverExpires: false,
        expirationDate: '2025-12-31',
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
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: actual,
        unit: 'liters',
        recommendedQuantity: needed,
        productTemplateId: 'bottled-water',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const completionPercentage = randomPercentageLow();
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
        id: '1',
        categoryId: 'food',
        quantity: riceQuantity,
        productTemplateId: 'rice',
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
        id: '1',
        categoryId: 'food',
        quantity: riceQuantity,
        productTemplateId: 'rice',
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
        id: '1',
        categoryId: 'water-beverages',
        quantity: actual,
        productTemplateId: 'bottled-water',
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
        id: '1',
        categoryId: 'water-beverages',
        quantity,
        productTemplateId: 'bottled-water',
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

describe('getCategoryDisplayStatus', () => {
  const household = createMockHousehold();

  it('should return all display data for a category', () => {
    const quantity = randomQuantityLarge();

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'water-beverages',
        quantity,
        productTemplateId: 'bottled-water',
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
        id: '1',
        categoryId: 'food',
        quantity,
        productTemplateId: 'rice',
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
        id: '1',
        categoryId: 'water-beverages',
        quantity,
        productTemplateId: 'bottled-water',
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
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: actual,
        unit: 'liters',
        recommendedQuantity: waterNeeded,
        productTemplateId: 'bottled-water',
        neverExpires: false,
        expirationDate: '2025-12-31',
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
        id: '1',
        categoryId: 'food',
        quantity: riceQuantity,
        productTemplateId: 'rice',
        caloriesPerUnit: 3600,
      }),
    ];

    const result = getCategoryDisplayStatus('food', items, household);

    expect(result.status).toBe('ok');
    expect(result.totalActualCalories).toBeGreaterThanOrEqual(
      result.totalNeededCalories!,
    );
  });

  it('should return critical when not enough inventory', () => {
    // Calculate needed water based on household
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    const needed = Math.ceil(
      DAILY_WATER_PER_PERSON * peopleMultiplier * household.supplyDurationDays,
    );
    // Use less than 30% of needed to guarantee 'critical' status
    // (critical threshold is 30%)
    const criticalPercentage = randomPercentageLow(); // 0-30%
    const actual = Math.floor((needed * criticalPercentage) / 100);

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'water-beverages',
        quantity: actual,
        productTemplateId: 'bottled-water',
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
