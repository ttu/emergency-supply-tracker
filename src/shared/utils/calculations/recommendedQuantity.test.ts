import { describe, it, expect } from 'vitest';
import {
  calculateHouseholdMultiplier,
  calculateRecommendedQuantity,
} from './recommendedQuantity';
import {
  createMockHousehold,
  createMockRecommendedItem,
} from '@/shared/utils/test/factories';
import { createProductTemplateId, createQuantity } from '@/shared/types';
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

  it('calculates correctly for 2 adults, 1 child, 3 days with known values', () => {
    const config = createMockHousehold({
      adults: 2,
      children: 1,
      supplyDurationDays: 3,
    });
    // 2 * 1.0 + 1 * 0.75 = 2.75 people
    // 2.75 * 3 days = 8.25
    const result = calculateHouseholdMultiplier(config);
    expect(result).toBe(8.25);
  });

  it('uses custom childrenMultiplier when provided', () => {
    const config = createMockHousehold({
      adults: 1,
      children: 2,
      supplyDurationDays: 1,
    });
    // 1 * 1.0 + 2 * 0.5 = 2.0
    const result = calculateHouseholdMultiplier(config, 0.5);
    expect(result).toBe(2);
  });

  it('returns adults * days when no children', () => {
    const config = createMockHousehold({
      adults: 3,
      children: 0,
      supplyDurationDays: 5,
    });
    // 3 * 1.0 + 0 * 0.75 = 3
    // 3 * 5 = 15
    expect(calculateHouseholdMultiplier(config)).toBe(15);
  });
});

describe('calculateRecommendedQuantity', () => {
  it('scales with people and days', () => {
    const baseQuantity = 3; // 3 liters per person per day
    const item = createMockRecommendedItem({
      id: createProductTemplateId('water'),
      i18nKey: 'products.water',
      category: 'water-beverages',
      baseQuantity: createQuantity(baseQuantity),
      unit: 'liters',
      scaleWithPeople: true,
      scaleWithDays: true,
      scaleWithPets: false, // Explicitly set to false
    });
    const household = createMockHousehold({ children: 0, pets: 0 });
    const expected =
      baseQuantity * household.adults * household.supplyDurationDays;
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(expected);
  });

  it('computes known values for 2 adults, 1 child, 3 days', () => {
    const item = createMockRecommendedItem({
      id: createProductTemplateId('water'),
      i18nKey: 'products.water',
      category: 'water-beverages',
      baseQuantity: createQuantity(3),
      unit: 'liters',
      scaleWithPeople: true,
      scaleWithDays: true,
      scaleWithPets: false,
    });
    const household = createMockHousehold({
      adults: 2,
      children: 1,
      pets: 0,
      supplyDurationDays: 3,
    });
    // 3 * (2*1.0 + 1*0.75) * 3 = 3 * 2.75 * 3 = 24.75 → ceil = 25
    expect(calculateRecommendedQuantity(item, household)).toBe(25);
  });

  it('computes known values with custom childrenMultiplier', () => {
    const item = createMockRecommendedItem({
      id: createProductTemplateId('water'),
      i18nKey: 'products.water',
      category: 'water-beverages',
      baseQuantity: createQuantity(2),
      unit: 'liters',
      scaleWithPeople: true,
      scaleWithDays: false,
      scaleWithPets: false,
    });
    const household = createMockHousehold({
      adults: 1,
      children: 2,
      pets: 0,
      supplyDurationDays: 3,
    });
    // 2 * (1*1.0 + 2*0.5) = 2 * 2.0 = 4
    expect(calculateRecommendedQuantity(item, household, 0.5)).toBe(4);
  });

  it('does not scale when flags are false', () => {
    const baseQuantity = 1;
    const item = createMockRecommendedItem({
      id: createProductTemplateId('flashlight'),
      i18nKey: 'products.flashlight',
      category: 'light-power',
      baseQuantity: createQuantity(baseQuantity),
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
      scaleWithPets: false, // Explicitly set to false
    });
    const household = createMockHousehold();
    const result = calculateRecommendedQuantity(item, household);
    // Should return baseQuantity regardless of household size
    expect(result).toBe(baseQuantity);
  });

  it('scales with pets', () => {
    const baseQuantity = 1;
    const item = createMockRecommendedItem({
      id: createProductTemplateId('pet-water-bowl'),
      i18nKey: 'products.pet-water-bowl',
      category: 'pets',
      baseQuantity: createQuantity(baseQuantity),
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
      scaleWithPets: true,
    });
    const household = createMockHousehold({ pets: 2 });
    const expected = baseQuantity * household.pets * PET_REQUIREMENT_MULTIPLIER;
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(expected);
  });

  it('scales with pets and days', () => {
    const baseQuantity = 0.2;
    const item = createMockRecommendedItem({
      id: createProductTemplateId('pet-food-dry'),
      i18nKey: 'products.pet-food-dry',
      category: 'pets',
      baseQuantity: createQuantity(baseQuantity),
      unit: 'kilograms',
      scaleWithPeople: false,
      scaleWithDays: true,
      scaleWithPets: true,
    });
    const household = createMockHousehold({ pets: 2, supplyDurationDays: 3 });
    const expected = Math.ceil(
      baseQuantity *
        household.pets *
        PET_REQUIREMENT_MULTIPLIER *
        household.supplyDurationDays,
    );
    const result = calculateRecommendedQuantity(item, household);
    expect(result).toBe(expected);
  });

  it('returns 0 when scaleWithPets is true and pets is 0', () => {
    const baseQuantity = 1;
    const item = createMockRecommendedItem({
      id: createProductTemplateId('pet-water-bowl'),
      i18nKey: 'products.pet-water-bowl',
      category: 'pets',
      baseQuantity: createQuantity(baseQuantity),
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
