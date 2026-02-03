import { describe, it, expect } from 'vitest';
import {
  calculateCaloriesFromWeight,
  calculateTotalWeight,
  calculateTotalCalories,
  calculateItemTotalCalories,
  getTemplateWeightPerUnit,
  getTemplateCaloriesPerUnit,
  resolveCaloriesPerUnit,
  formatWeight,
  formatCalories,
} from './calories';
import type { InventoryItem, RecommendedItemDefinition } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';

describe('calculateCaloriesFromWeight', () => {
  it('calculates calories from weight and caloriesPer100g', () => {
    expect(calculateCaloriesFromWeight(150, 130)).toBe(195); // tuna can
    expect(calculateCaloriesFromWeight(400, 50)).toBe(200); // soup can
    expect(calculateCaloriesFromWeight(1000, 350)).toBe(3500); // 1kg pasta
  });

  it('rounds to nearest integer', () => {
    expect(calculateCaloriesFromWeight(153, 127)).toBe(194);
  });

  it('handles zero values', () => {
    expect(calculateCaloriesFromWeight(0, 100)).toBe(0);
    expect(calculateCaloriesFromWeight(100, 0)).toBe(0);
  });
});

describe('calculateTotalWeight', () => {
  it('calculates total weight from quantity and weight per unit', () => {
    expect(calculateTotalWeight(5, 150)).toBe(750); // 5 cans at 150g each
    expect(calculateTotalWeight(2, 1000)).toBe(2000); // 2 kg
  });

  it('handles fractional quantities', () => {
    expect(calculateTotalWeight(0.5, 1000)).toBe(500);
  });
});

describe('calculateTotalCalories', () => {
  it('calculates total calories from quantity and calories per unit', () => {
    expect(calculateTotalCalories(5, 200)).toBe(1000);
    expect(calculateTotalCalories(2, 3500)).toBe(7000);
  });

  it('handles fractional quantities', () => {
    expect(calculateTotalCalories(0.5, 3600)).toBe(1800);
  });

  it('converts kilograms to units when unit is kilograms', () => {
    // 1 kg with 100g per unit = 10 units, 10 * 400 = 4000 kcal
    expect(calculateTotalCalories(1, 400, 'kilograms', 100)).toBe(4000);
    // 1.5 kg with 100g per unit = 15 units, 15 * 400 = 6000 kcal
    expect(calculateTotalCalories(1.5, 400, 'kilograms', 100)).toBe(6000);
    // 0.5 kg with 100g per unit = 5 units, 5 * 400 = 2000 kcal
    expect(calculateTotalCalories(0.5, 400, 'kilograms', 100)).toBe(2000);
  });

  it('uses quantity directly when unit is not kilograms', () => {
    expect(calculateTotalCalories(5, 200, 'pieces')).toBe(1000);
    expect(calculateTotalCalories(2, 3500, 'cans')).toBe(7000);
  });

  it('uses quantity directly when weightGrams is not provided for kilograms', () => {
    // Falls back to direct multiplication if weightGrams not provided
    expect(calculateTotalCalories(1, 400, 'kilograms')).toBe(400);
  });
});

describe('calculateItemTotalCalories', () => {
  it('calculates total calories for item with regular unit', () => {
    const item: InventoryItem = {
      id: createItemId('1'),
      name: 'Test Item',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: createQuantity(5),
      unit: 'cans',
      weightGrams: 400,
      caloriesPerUnit: 200,
      neverExpires: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    expect(calculateItemTotalCalories(item)).toBe(1000);
  });

  it('calculates total calories for item with kilograms unit', () => {
    const item: InventoryItem = {
      id: createItemId('1'),
      name: 'Rice',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: createQuantity(1), // 1 kg
      unit: 'kilograms',
      weightGrams: 100, // 100g per unit
      caloriesPerUnit: 400, // 400 kcal per unit
      neverExpires: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    // 1 kg = 1000g / 100g = 10 units, 10 * 400 = 4000 kcal
    expect(calculateItemTotalCalories(item)).toBe(4000);
  });

  it('returns 0 when caloriesPerUnit is not set', () => {
    const item: InventoryItem = {
      id: createItemId('1'),
      name: 'Test Item',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: createQuantity(5),
      unit: 'cans',
      neverExpires: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    expect(calculateItemTotalCalories(item)).toBe(0);
  });

  it('handles zero calories per unit correctly', () => {
    const item: InventoryItem = {
      id: createItemId('1'),
      name: 'Water',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: createQuantity(10),
      unit: 'bottles',
      caloriesPerUnit: 0, // Zero calories (e.g., water)
      neverExpires: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    // Should return 0, not treat it as missing and use a default
    expect(calculateItemTotalCalories(item)).toBe(0);
  });

  it('handles fractional kilograms', () => {
    const item: InventoryItem = {
      id: createItemId('1'),
      name: 'Rice',
      itemType: 'custom',
      categoryId: createCategoryId('food'),
      quantity: createQuantity(1.5), // 1.5 kg
      unit: 'kilograms',
      weightGrams: 100, // 100g per unit
      caloriesPerUnit: 400, // 400 kcal per unit
      neverExpires: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    // 1.5 kg = 1500g / 100g = 15 units, 15 * 400 = 6000 kcal
    expect(calculateItemTotalCalories(item)).toBe(6000);
  });
});

describe('getTemplateWeightPerUnit', () => {
  it('returns weightGramsPerUnit when present', () => {
    const template: RecommendedItemDefinition = {
      id: createProductTemplateId('test'),
      i18nKey: 'test',
      category: 'food',
      baseQuantity: createQuantity(1),
      unit: 'cans',
      scaleWithPeople: true,
      scaleWithDays: true,
      weightGramsPerUnit: 150,
    };
    expect(getTemplateWeightPerUnit(template)).toBe(150);
  });

  it('returns undefined when no weight data', () => {
    const template: RecommendedItemDefinition = {
      id: createProductTemplateId('test'),
      i18nKey: 'test',
      category: 'tools-supplies',
      baseQuantity: createQuantity(1),
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
    };
    expect(getTemplateWeightPerUnit(template)).toBeUndefined();
  });
});

describe('getTemplateCaloriesPerUnit', () => {
  it('calculates from weightGramsPerUnit and caloriesPer100g when both present', () => {
    const template: RecommendedItemDefinition = {
      id: createProductTemplateId('test'),
      i18nKey: 'test',
      category: 'food',
      baseQuantity: createQuantity(1),
      unit: 'cans',
      scaleWithPeople: true,
      scaleWithDays: true,
      weightGramsPerUnit: 150,
      caloriesPer100g: 130,
      caloriesPerUnit: 200, // This should be ignored when weight data is available
    };
    expect(getTemplateCaloriesPerUnit(template)).toBe(195); // 150 * 130 / 100
  });

  it('returns caloriesPerUnit when weight data not available', () => {
    const template: RecommendedItemDefinition = {
      id: createProductTemplateId('test'),
      i18nKey: 'test',
      category: 'food',
      baseQuantity: createQuantity(1),
      unit: 'cans',
      scaleWithPeople: true,
      scaleWithDays: true,
      caloriesPerUnit: 200,
    };
    expect(getTemplateCaloriesPerUnit(template)).toBe(200);
  });

  it('returns undefined when no calorie data available', () => {
    const template: RecommendedItemDefinition = {
      id: createProductTemplateId('test'),
      i18nKey: 'test',
      category: 'tools-supplies',
      baseQuantity: createQuantity(1),
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
    };
    expect(getTemplateCaloriesPerUnit(template)).toBeUndefined();
  });
});

describe('resolveCaloriesPerUnit', () => {
  it('returns user-provided calories when set', () => {
    expect(resolveCaloriesPerUnit(300, 150, 130, 200)).toBe(300);
  });

  it('calculates from user weight and template caloriesPer100g', () => {
    expect(resolveCaloriesPerUnit(undefined, 200, 130, 195)).toBe(260);
  });

  it('falls back to template default', () => {
    expect(resolveCaloriesPerUnit(undefined, undefined, 130, 200)).toBe(200);
  });

  it('returns undefined when no data available', () => {
    expect(
      resolveCaloriesPerUnit(undefined, undefined, undefined, undefined),
    ).toBeUndefined();
  });

  it('ignores zero user values', () => {
    expect(resolveCaloriesPerUnit(0, 0, 130, 200)).toBe(200);
  });
});

describe('formatWeight', () => {
  it('formats grams for small values', () => {
    expect(formatWeight(150)).toBe('150 g');
    expect(formatWeight(500)).toBe('500 g');
  });

  it('converts to kg for 1000g or more', () => {
    expect(formatWeight(1000)).toBe('1.0 kg');
    expect(formatWeight(1500)).toBe('1.5 kg');
    expect(formatWeight(2500)).toBe('2.5 kg');
  });
});

describe('formatCalories', () => {
  it('formats small calorie values', () => {
    expect(formatCalories(200)).toBe('200 kcal');
    expect(formatCalories(500)).toBe('500 kcal');
  });

  it('formats large calorie values with decimal', () => {
    expect(formatCalories(1000)).toBe('1.0 kcal');
    expect(formatCalories(3500)).toBe('3.5 kcal');
  });
});
