/**
 * Additional mutation-killing tests for strategies/common.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import { calculateBaseRecommendedQuantity } from './common';
import type { RecommendedItemDefinition } from '@/shared/types';
import { createProductTemplateId, createQuantity } from '@/shared/types';
import { createMockHousehold } from '@/shared/utils/test/factories';
import type { CategoryCalculationContext } from './types';

function createContext(
  overrides: Partial<CategoryCalculationContext> = {},
): CategoryCalculationContext {
  const household = createMockHousehold({
    adults: 1,
    children: 0,
    pets: 2,
    supplyDurationDays: 3,
  });

  return {
    categoryId: 'tools-supplies',
    items: [],
    categoryItems: [],
    recommendedForCategory: [],
    household,
    disabledRecommendedItems: [],
    options: {},
    peopleMultiplier: 1,
    ...overrides,
  };
}

// ============================================================================
// L38: ArithmeticOperator - context.household.pets * PET_REQUIREMENT_MULTIPLIER
// Mutant: * → / (PET_REQUIREMENT_MULTIPLIER=1, equivalent)
// ============================================================================
describe('L38: pet scaling in calculateBaseRecommendedQuantity', () => {
  it('correctly scales pet items with pet count', () => {
    const context = createContext();

    const petRec: RecommendedItemDefinition = {
      id: createProductTemplateId('pet-food'),
      i18nKey: 'pet-food',
      category: 'tools-supplies',
      baseQuantity: createQuantity(1),
      unit: 'kilograms',
      scaleWithPets: true,
      scaleWithPeople: false,
      scaleWithDays: true,
    };

    const qty = calculateBaseRecommendedQuantity(petRec, context);
    // baseQuantity(1) * pets(2) * PET_MULTIPLIER(1) * days(3) = 6
    expect(qty).toBe(6);
  });

  it('does not apply pet scaling when scaleWithPets is false', () => {
    const context = createContext();

    const nonPetRec: RecommendedItemDefinition = {
      id: createProductTemplateId('flashlight'),
      i18nKey: 'flashlight',
      category: 'tools-supplies',
      baseQuantity: createQuantity(2),
      unit: 'pieces',
      scaleWithPets: false,
      scaleWithPeople: false,
      scaleWithDays: false,
    };

    const qty = calculateBaseRecommendedQuantity(nonPetRec, context);
    expect(qty).toBe(2); // No scaling
  });
});
