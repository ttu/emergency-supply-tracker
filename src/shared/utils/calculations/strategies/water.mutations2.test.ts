/**
 * Additional mutation-killing tests for strategies/water.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import { WaterCategoryStrategy } from './water';
import type { RecommendedItemDefinition } from '@/shared/types';
import { createProductTemplateId, createQuantity } from '@/shared/types';
import { createMockHousehold } from '@/shared/utils/test/factories';
import type { CategoryCalculationContext } from './types';

const strategy = new WaterCategoryStrategy();

function createWaterContext(
  overrides: Partial<CategoryCalculationContext> = {},
): CategoryCalculationContext {
  const household = createMockHousehold({
    adults: 2,
    children: 0,
    pets: 1,
    supplyDurationDays: 3,
  });

  return {
    categoryId: 'water-beverages',
    items: [],
    categoryItems: [],
    recommendedForCategory: [],
    household,
    disabledRecommendedItems: [],
    options: {},
    peopleMultiplier: 2,
    ...overrides,
  };
}

// ============================================================================
// L24-25: StringLiteral - WATER_CATEGORY_ID and BOTTLED_WATER_ID
// Mutant: '' instead of 'water-beverages' or 'bottled-water'
// ============================================================================
describe('L24-25: string constant values', () => {
  it('strategyId is "water-beverages"', () => {
    expect(strategy.strategyId).toBe('water-beverages');
    expect(strategy.strategyId).not.toBe('');
  });

  it('canHandle returns true for water-beverages', () => {
    expect(strategy.canHandle('water-beverages')).toBe(true);
  });

  it('canHandle returns false for other categories', () => {
    expect(strategy.canHandle('food')).toBe(false);
    expect(strategy.canHandle('')).toBe(false);
  });
});

// ============================================================================
// L36: StringLiteral - '' instead of 'water-beverages'
// ============================================================================
describe('L36: canHandle category check', () => {
  it('correctly identifies water-beverages category', () => {
    expect(strategy.canHandle('water-beverages')).toBe(true);
    expect(strategy.canHandle('tools-supplies')).toBe(false);
  });
});

// ============================================================================
// L59: ArithmeticOperator - pets * PET_REQUIREMENT_MULTIPLIER
// Mutant: * → / (PET_REQUIREMENT_MULTIPLIER=1, equivalent)
// ============================================================================
describe('L59: pet scaling in water calculation', () => {
  it('scales water requirement by pet count', () => {
    const context = createWaterContext();

    const petWaterRec: RecommendedItemDefinition = {
      id: createProductTemplateId('pet-water'),
      i18nKey: 'pet-water',
      category: 'water-beverages',
      baseQuantity: createQuantity(1),
      unit: 'liters',
      scaleWithPets: true,
      scaleWithPeople: false,
      scaleWithDays: true,
    };

    const qty = strategy.calculateRecommendedQuantity(petWaterRec, context);
    // baseQuantity(1) * pets(1) * PET_MULTIPLIER(1) * days(3) = 3
    expect(qty).toBe(3);
  });
});
