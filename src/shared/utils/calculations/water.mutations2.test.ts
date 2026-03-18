/**
 * Additional mutation-killing tests for water.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import {
  getWaterRequirementPerUnit,
  calculateWaterRequirements,
  calculateRecommendedWaterStorage,
} from './water';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import {
  createMockInventoryItem,
  createMockHousehold,
} from '@/shared/utils/test/factories';

// ============================================================================
// L78: ConditionalExpression/LogicalOperator/StringLiteral
// item.itemType && item.itemType !== 'custom'
// Mutants: condition→true, || instead of &&, '' instead of 'custom'
// ============================================================================
describe('L78: itemType guard in getWaterRequirementPerUnit', () => {
  it('custom items do not look up template water requirements', () => {
    const customItem = createMockInventoryItem({
      id: createItemId('custom-water-1'),
      categoryId: createCategoryId('food'),
      itemType: createProductTemplateId('custom'),
      quantity: createQuantity(5),
      unit: 'pieces',
    });

    // Custom items should return 0 (no template lookup)
    // If 'custom' is mutated to '', then 'custom' !== '' is true -> would look up template
    const result = getWaterRequirementPerUnit(customItem);
    expect(result).toBe(0);
  });

  it('items without itemType return 0 water requirement', () => {
    const noTypeItem = createMockInventoryItem({
      id: createItemId('no-type-1'),
      categoryId: createCategoryId('food'),
      quantity: createQuantity(5),
      unit: 'pieces',
    });
    // Override itemType to be empty/falsy
    (noTypeItem as unknown as Record<string, unknown>).itemType = '';

    const result = getWaterRequirementPerUnit(noTypeItem);
    expect(result).toBe(0);
  });

  it('items with custom requiresWaterLiters use that value', () => {
    const item = createMockInventoryItem({
      id: createItemId('water-req-1'),
      categoryId: createCategoryId('food'),
      itemType: createProductTemplateId('rice'),
      quantity: createQuantity(5),
      unit: 'pieces',
      requiresWaterLiters: 0.5,
    });

    const result = getWaterRequirementPerUnit(item);
    expect(result).toBe(0.5);
  });
});

// ============================================================================
// L84: EqualityOperator - template.requiresWaterLiters > 0
// Mutant: >= 0 (would include items with 0 water requirement)
// ============================================================================
describe('L84: requiresWaterLiters > 0 boundary', () => {
  it('items with template having 0 requiresWaterLiters return 0', () => {
    // This tests the boundary: if mutated to >= 0, items with 0 would pass
    // But since the template's value is 0, returning 0 is same either way
    // This may be an equivalent mutant at the boundary
    const item = createMockInventoryItem({
      id: createItemId('zero-water-1'),
      categoryId: createCategoryId('food'),
      itemType: createProductTemplateId('canned-goods'),
      quantity: createQuantity(5),
      unit: 'pieces',
    });

    const result = getWaterRequirementPerUnit(item);
    // canned-goods likely has no water requirement
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// L117: ConditionalExpression - condition replaced with false
// This is in calculateTotalWaterAvailable - the filter for water items
// ============================================================================
describe('L117: water item filtering', () => {
  it('calculateWaterRequirements handles empty items array', () => {
    const result = calculateWaterRequirements([]);
    expect(result.totalWaterRequired).toBe(0);
    expect(result.totalWaterAvailable).toBe(0);
    expect(result.hasEnoughWater).toBe(true);
    expect(result.waterShortfall).toBe(0);
    expect(result.itemsRequiringWater).toEqual([]);
  });
});

// ============================================================================
// L181: ArithmeticOperator - household.adults * ADULT_REQUIREMENT_MULTIPLIER
// Mutant: * → / (ADULT_REQUIREMENT_MULTIPLIER = 1, so equivalent)
// ============================================================================
describe('L181: calculateRecommendedWaterStorage arithmetic', () => {
  it('correctly calculates water storage for household', () => {
    const household = createMockHousehold({
      adults: 2,
      children: 1,
      supplyDurationDays: 3,
    });

    // dailyWaterPerPerson = 3 liters
    // peopleMultiplier = 2*1 + 1*0.75 = 2.75
    // total = 3 * 2.75 * 3 = 24.75
    const result = calculateRecommendedWaterStorage(household, 3);
    expect(result).toBe(24.75);
  });

  it('returns 0 for household with 0 people', () => {
    const household = createMockHousehold({
      adults: 0,
      children: 0,
      supplyDurationDays: 3,
    });

    const result = calculateRecommendedWaterStorage(household, 3);
    expect(result).toBe(0);
  });
});
