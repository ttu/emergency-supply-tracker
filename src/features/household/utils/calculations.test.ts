import { describe, it, expect } from 'vitest';
import {
  calculateHouseholdMultiplier,
  calculateRecommendedQuantity,
} from './calculations';
import {
  createMockHousehold,
  createMockRecommendedItem,
} from '@/shared/utils/test/factories';
import { createProductTemplateId } from '@/shared/types';
import {
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';

describe('calculateHouseholdMultiplier', () => {
  it('calculates multiplier correctly for random household configurations', () => {
    const config = createMockHousehold();
    const expected =
      (config.adults * ADULT_REQUIREMENT_MULTIPLIER +
        config.children * CHILDREN_REQUIREMENT_MULTIPLIER) *
      config.supplyDurationDays;
    const result = calculateHouseholdMultiplier(config);
    expect(result).toBeCloseTo(expected, 1);
  });
});

describe('calculateRecommendedQuantity', () => {
  it('scales with people and days', () => {
    const baseQuantity = 3; // 3 liters per person per day
    const item = createMockRecommendedItem({
      id: createProductTemplateId('water'),
      i18nKey: 'products.water',
      category: 'water-beverages',
      baseQuantity,
      unit: 'liters',
      scaleWithPeople: true,
      scaleWithDays: true,
    });
    const household = createMockHousehold({ children: 0 });
    const expected =
      baseQuantity * household.adults * household.supplyDurationDays;
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(expected);
  });

  it('does not scale when flags are false', () => {
    const baseQuantity = 1;
    const item = createMockRecommendedItem({
      id: createProductTemplateId('flashlight'),
      i18nKey: 'products.flashlight',
      category: 'light-power',
      baseQuantity,
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
    });
    const household = createMockHousehold();
    const result = calculateRecommendedQuantity(item, household);
    // Should return baseQuantity regardless of household size
    expect(result).toBe(baseQuantity);
  });
});
