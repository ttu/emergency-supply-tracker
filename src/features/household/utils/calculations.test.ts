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
  PET_REQUIREMENT_MULTIPLIER,
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
      scaleWithPets: false,
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
      scaleWithPets: false,
    });
    const household = createMockHousehold();
    const result = calculateRecommendedQuantity(item, household);
    // Should return baseQuantity regardless of household size
    expect(result).toBe(baseQuantity);
  });

  it('scales with pets only', () => {
    const baseQuantity = 1;
    const item = createMockRecommendedItem({
      id: createProductTemplateId('pet-carrier'),
      i18nKey: 'products.pet-carrier',
      category: 'pets',
      baseQuantity,
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
      scaleWithPets: true,
    });
    const household = createMockHousehold({ pets: 3 });
    const expected = baseQuantity * 3 * PET_REQUIREMENT_MULTIPLIER;
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(expected);
  });

  it('scales with pets and days', () => {
    const baseQuantity = 0.2; // 0.2 kg per pet per day
    const item = createMockRecommendedItem({
      id: createProductTemplateId('pet-food-dry'),
      i18nKey: 'products.pet-food-dry',
      category: 'pets',
      baseQuantity,
      unit: 'kilograms',
      scaleWithPeople: false,
      scaleWithDays: true,
      scaleWithPets: true,
    });
    const household = createMockHousehold({ pets: 2, supplyDurationDays: 3 });
    // 0.2 * 2 pets * 3 days = 1.2 -> ceil = 2
    const expected = Math.ceil(
      baseQuantity * 2 * PET_REQUIREMENT_MULTIPLIER * 3,
    );
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(expected);
  });

  it('returns 0 when scaleWithPets is true and pets is 0', () => {
    const baseQuantity = 1;
    const item = createMockRecommendedItem({
      id: createProductTemplateId('pet-carrier'),
      i18nKey: 'products.pet-carrier',
      category: 'pets',
      baseQuantity,
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
      scaleWithPets: true,
    });
    const household = createMockHousehold({ pets: 0 });
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(0);
  });
});
