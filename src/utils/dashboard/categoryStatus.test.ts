import {
  calculateCategoryStatus,
  calculateAllCategoryStatuses,
  calculateCategoryShortages,
  getCategoryDisplayStatus,
} from './categoryStatus';
import type { InventoryItem } from '../../types';
import {
  createMockCategory,
  createMockInventoryItem,
  createMockHousehold,
} from '../test/factories';

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
      primaryUnit: null,
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
  const household = createMockHousehold({
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  });

  // Water calculation tests - 3 liters per person per day
  describe('water calculation - 3L per person per day', () => {
    it('should calculate 9 liters for 1 adult, 3 days', () => {
      const oneAdultHousehold = createMockHousehold({
        adults: 1,
        children: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      });

      const result = calculateCategoryShortages(
        'water-beverages',
        [],
        oneAdultHousehold,
      );

      // 1 adult × 3 days × 3L/day = 9 liters
      // Formula: baseQuantity(9) × adults(1) × days(3/3) = 9
      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(9);
    });

    it('should calculate 18 liters for 2 adults, 3 days', () => {
      const result = calculateCategoryShortages(
        'water-beverages',
        [],
        household,
      );

      // 2 adults × 3 days × 3L/day = 18 liters
      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(18);
    });

    it('should calculate 42 liters for 2 adults, 7 days', () => {
      const weekHousehold = createMockHousehold({
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      });

      const result = calculateCategoryShortages(
        'water-beverages',
        [],
        weekHousehold,
      );

      // 2 adults × 7 days × 3L/day = 42 liters
      // Formula: baseQuantity(9) × adults(2) × days(7/3) = 9 × 2 × 2.33 = 42
      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(42);
    });

    it('should calculate children at 75% of adult water needs', () => {
      const familyHousehold = createMockHousehold({
        adults: 2,
        children: 2,
        supplyDurationDays: 3,
        useFreezer: false,
      });

      const result = calculateCategoryShortages(
        'water-beverages',
        [],
        familyHousehold,
      );

      // (2 adults × 1.0 + 2 children × 0.75) × 3 days × 3L/day
      // = (2 + 1.5) × 9 = 3.5 × 9 = 31.5, rounded up to 32
      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(32);
    });

    it('should calculate 1 child at 75% of 1 adult', () => {
      const childOnlyHousehold = createMockHousehold({
        adults: 0,
        children: 1,
        supplyDurationDays: 3,
        useFreezer: false,
      });

      const result = calculateCategoryShortages(
        'water-beverages',
        [],
        childOnlyHousehold,
      );

      // 0 adults + 1 child × 0.75 = 0.75 people equivalent
      // 0.75 × 3 days × 3L/day = 6.75, rounded up to 7
      const waterShortage = result.shortages.find(
        (s) => s.itemId === 'bottled-water',
      );
      expect(waterShortage).toBeDefined();
      expect(waterShortage!.needed).toBe(7);
    });
  });

  it('should calculate shortages for water category', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: 9,
        unit: 'liters',
        recommendedQuantity: 18,
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

    // For 2 adults, 3 days: bottled-water needs 9 * 2 * (3/3) = 18 liters
    // (base 9L is calibrated for 1 person for 3 days = 3L/day)
    expect(result.shortages.length).toBeGreaterThan(0);
    expect(result.totalActual).toBe(9);
    expect(result.primaryUnit).toBe('liters');
  });

  it('should return no shortages when fully stocked', () => {
    // For 2 adults, 3 days:
    // - bottled-water: 9 * 2 * (3/3) = 18 liters
    // - long-life-milk: 2 * 2 = 4 liters (doesn't scale with days)
    // - long-life-juice: 2 * 2 = 4 liters (doesn't scale with days)
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: 18,
        unit: 'liters',
        recommendedQuantity: 18,
        productTemplateId: 'bottled-water',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Long Life Milk',
        categoryId: 'water-beverages',
        quantity: 4,
        unit: 'liters',
        recommendedQuantity: 4,
        productTemplateId: 'long-life-milk',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
      createMockInventoryItem({
        id: '3',
        name: 'Long Life Juice',
        categoryId: 'water-beverages',
        quantity: 4,
        unit: 'liters',
        recommendedQuantity: 4,
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
    expect(result.primaryUnit).toBeNull();
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
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'food',
        quantity: 5, // 5 cans of soup
        productTemplateId: 'canned-soup',
        caloriesPerUnit: 200,
      }),
      createMockInventoryItem({
        id: '2',
        categoryId: 'food',
        quantity: 2, // 2 kg pasta
        productTemplateId: 'pasta',
        caloriesPerUnit: 3500,
      }),
    ];

    const result = calculateCategoryShortages('food', items, household);

    // 5 cans * 200 kcal + 2 kg * 3500 kcal = 1000 + 7000 = 8000 kcal
    expect(result.totalActualCalories).toBe(8000);

    // 2 people * 3 days * 2000 kcal = 12000 kcal
    expect(result.totalNeededCalories).toBe(12000);

    // Missing = 12000 - 8000 = 4000 kcal
    expect(result.missingCalories).toBe(4000);
  });

  it('should return no missing calories when fully stocked', () => {
    // Create items with enough calories for 2 people * 3 days = 12000 kcal
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'food',
        quantity: 4, // 4 kg rice = 14400 kcal
        productTemplateId: 'rice',
        caloriesPerUnit: 3600,
      }),
    ];

    const result = calculateCategoryShortages('food', items, household);

    expect(result.totalActualCalories).toBe(14400);
    expect(result.totalNeededCalories).toBe(12000);
    expect(result.missingCalories).toBe(0); // We have more than needed
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

  const household = createMockHousehold({
    adults: 1,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  });

  it('should return ok status when totalActual >= totalNeeded even with low completion percentage', () => {
    // Have enough water (15L) but missing milk and juice (recommended items)
    // This should still be "ok" because we meet the minimum water requirement
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: 15, // More than the 9L needed for 1 adult, 3 days
        unit: 'liters',
        recommendedQuantity: 9,
        productTemplateId: 'bottled-water',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    // Low completion percentage because we're missing milk and juice
    const result = calculateCategoryStatus(waterCategory, items, 33, household);

    // Should be "ok" because we have enough total inventory (15 >= 13 needed)
    // even though completion percentage is low
    expect(result.status).toBe('ok');
    expect(result.totalActual).toBeGreaterThanOrEqual(result.totalNeeded);
  });

  it('should return critical status when totalActual < totalNeeded and low completion', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: 3, // Less than needed
        unit: 'liters',
        recommendedQuantity: 9,
        productTemplateId: 'bottled-water',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const result = calculateCategoryStatus(waterCategory, items, 10, household);

    expect(result.status).toBe('critical');
  });

  it('should return ok for food category when totalActualCalories >= totalNeededCalories', () => {
    // Have enough calories even if missing some recommended food items
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'food',
        quantity: 4, // 4 kg rice = 14400 kcal, more than 6000 needed for 1 person 3 days
        productTemplateId: 'rice',
        caloriesPerUnit: 3600,
      }),
    ];

    // Low completion percentage because we're missing other recommended food items
    const result = calculateCategoryStatus(foodCategory, items, 25, household);

    // Should be "ok" because we have enough calories
    expect(result.status).toBe('ok');
    expect(result.totalActualCalories).toBeGreaterThanOrEqual(
      result.totalNeededCalories!,
    );
  });

  it('should return critical for food category when totalActualCalories < totalNeededCalories', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'food',
        quantity: 1, // 1 kg rice = 3600 kcal, less than 6000 needed
        productTemplateId: 'rice',
        caloriesPerUnit: 3600,
      }),
    ];

    const result = calculateCategoryStatus(foodCategory, items, 10, household);

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

describe('getCategoryDisplayStatus', () => {
  const household = createMockHousehold({
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  });

  it('should return all display data for a category', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'water-beverages',
        quantity: 27,
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
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'food',
        quantity: 2,
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
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'water-beverages',
        quantity: 54,
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
    // User scenario: have enough water to meet total needs (including milk/juice recommendations)
    // For 2 adults, 3 days: water=18L, milk=4L, juice=4L = 26L total needed
    // Status should be "ok" because total quantity meets the needs
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: 30, // More than 26L total needed for 2 adults, 3 days
        unit: 'liters',
        recommendedQuantity: 18,
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

    // Should be "ok" because we have enough total quantity (30 >= 26)
    expect(result.status).toBe('ok');
    expect(result.totalActual).toBeGreaterThanOrEqual(result.totalNeeded);
  });

  it('should return ok for food when calories are sufficient despite missing items', () => {
    // Have enough calories from rice alone
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'food',
        quantity: 5, // 5 kg rice = 18000 kcal, more than 12000 needed
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
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        categoryId: 'water-beverages',
        quantity: 5, // Less than 18L needed
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
