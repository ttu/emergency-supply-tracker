import { describe, it, expect } from '@jest/globals';
import {
  calculateHouseholdMultiplier,
  calculateRecommendedQuantity,
} from './household';
import type { HouseholdConfig, RecommendedItemDefinition } from '../../types';

describe('calculateHouseholdMultiplier', () => {
  it('calculates multiplier for 2 adults, 1 child, 7 days', () => {
    const config: HouseholdConfig = {
      adults: 2,
      children: 1,
      supplyDurationDays: 7,
      hasFreezer: false,
    };
    // (2 * 1.0 + 1 * 0.75) * (7 / 3) = 2.75 * 2.33 ≈ 6.42
    const result = calculateHouseholdMultiplier(config);
    expect(result).toBeCloseTo(6.42, 1);
  });
});

describe('calculateRecommendedQuantity', () => {
  it('scales with people and days', () => {
    const item: RecommendedItemDefinition = {
      id: 'water',
      i18nKey: 'products.water',
      category: 'water-beverages',
      baseQuantity: 9,
      unit: 'liters',
      scaleWithPeople: true,
      scaleWithDays: true,
    };
    const household: HouseholdConfig = {
      adults: 2,
      children: 0,
      supplyDurationDays: 7,
      hasFreezer: false,
    };
    // 9 * 2 * (7/3) = 9 * 2 * 2.33 = 42
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(42);
  });

  it('does not scale when flags are false', () => {
    const item: RecommendedItemDefinition = {
      id: 'flashlight',
      i18nKey: 'products.flashlight',
      category: 'light-power',
      baseQuantity: 1,
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
    };
    const household: HouseholdConfig = {
      adults: 5,
      children: 3,
      supplyDurationDays: 14,
      hasFreezer: false,
    };
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(1);
  });
});
