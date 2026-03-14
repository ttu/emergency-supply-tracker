import { describe, it, expect } from 'vitest';
import {
  calculateHouseholdMultiplier,
  calculateRecommendedQuantity,
} from './calculations';
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

describe('household calculations - mutation killing tests', () => {
  describe('calculateHouseholdMultiplier arithmetic operators', () => {
    it('L21: adults multiplied (not divided) by ADULT_REQUIREMENT_MULTIPLIER', () => {
      // With adults=4, children=0, days=1:
      // correct: 4 * 1.0 + 0 * 0.75 = 4, then 4 * 1 = 4
      // mutant (÷): 4 / 1.0 = 4 -- same result with multiplier 1.0!
      // Use a different multiplier scenario: children > 0 to catch multiplication
      const config = createMockHousehold({
        adults: 3,
        children: 2,
        pets: 0,
        supplyDurationDays: 1,
      });
      const result = calculateHouseholdMultiplier(config);
      // correct: (3 * 1.0 + 2 * 0.75) * 1 = (3 + 1.5) * 1 = 4.5
      const expected =
        (3 * ADULT_REQUIREMENT_MULTIPLIER +
          2 * CHILDREN_REQUIREMENT_MULTIPLIER) *
        1;
      expect(result).toBeCloseTo(expected, 5);
      expect(result).toBeCloseTo(4.5, 5);
    });

    it('L42: peopleMultiplier uses multiplication not division for children', () => {
      // ADULT_REQUIREMENT_MULTIPLIER is 1.0, so * vs / is equivalent for adults.
      // Instead, target the children multiplier (0.75) where * vs / differs.
      // L42 area: adults * ADULT + children * CHILDREN
      // If children * CHILDREN is mutated to children / CHILDREN:
      //   correct: 1 * (0 * 1.0 + 4 * 0.75) = 3
      //   mutant:  1 * (0 * 1.0 + 4 / 0.75) = 5.33 -> ceil = 6
      const item = createMockRecommendedItem({
        id: createProductTemplateId('test-item'),
        baseQuantity: createQuantity(1),
        scaleWithPeople: true,
        scaleWithDays: false,
        scaleWithPets: false,
      });
      const household = createMockHousehold({
        adults: 0,
        children: 4,
        pets: 0,
        supplyDurationDays: 1,
      });
      const result = calculateRecommendedQuantity(item, household);
      expect(result).toBe(Math.ceil(4 * CHILDREN_REQUIREMENT_MULTIPLIER));
      expect(result).toBe(3);
    });

    it('L42: children multiplied (not divided) by childrenMultiplier', () => {
      const item = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        baseQuantity: createQuantity(1),
        scaleWithPeople: true,
        scaleWithDays: false,
        scaleWithPets: false,
      });
      const household = createMockHousehold({
        adults: 0,
        children: 4,
        pets: 0,
        supplyDurationDays: 1,
      });
      const result = calculateRecommendedQuantity(item, household);
      // correct: 1 * (0 * 1.0 + 4 * 0.75) = 1 * 3 = 3
      // mutant (children / 0.75): 1 * (0 + 4 / 0.75) = 1 * 5.33 = 6
      expect(result).toBe(Math.ceil(4 * CHILDREN_REQUIREMENT_MULTIPLIER));
      expect(result).toBe(3);
    });

    it('L43: qty multiplied (not divided) by peopleMultiplier', () => {
      // L43: qty *= peopleMultiplier
      // If mutated to /=, baseQuantity / peopleMultiplier
      const item = createMockRecommendedItem({
        id: createProductTemplateId('rice'),
        baseQuantity: createQuantity(2),
        scaleWithPeople: true,
        scaleWithDays: false,
        scaleWithPets: false,
      });
      const household = createMockHousehold({
        adults: 3,
        children: 0,
        pets: 0,
        supplyDurationDays: 1,
      });
      const result = calculateRecommendedQuantity(item, household);
      // correct: 2 * (3 * 1.0) = 6
      // mutant (/=): 2 / 3 = 0.67 -> ceil = 1
      expect(result).toBe(6);
    });

    it('L48: qty multiplied (not divided) by supplyDurationDays', () => {
      // L48: qty *= household.supplyDurationDays
      // If mutated to /=, qty / days
      const item = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        baseQuantity: createQuantity(3),
        scaleWithPeople: false,
        scaleWithDays: true,
        scaleWithPets: false,
      });
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 7,
      });
      const result = calculateRecommendedQuantity(item, household);
      // correct: 3 * 7 = 21
      // mutant (/=): 3 / 7 = 0.43 -> ceil = 1
      expect(result).toBe(21);
    });

    it('combined: scaleWithPeople + scaleWithDays uses multiplication throughout', () => {
      const item = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        baseQuantity: createQuantity(3),
        scaleWithPeople: true,
        scaleWithDays: true,
        scaleWithPets: false,
      });
      const household = createMockHousehold({
        adults: 2,
        children: 2,
        pets: 0,
        supplyDurationDays: 3,
      });
      const result = calculateRecommendedQuantity(item, household);
      // people = 2*1.0 + 2*0.75 = 3.5
      // qty = 3 * 3.5 * 3 = 31.5 -> ceil = 32
      const people =
        2 * ADULT_REQUIREMENT_MULTIPLIER + 2 * CHILDREN_REQUIREMENT_MULTIPLIER;
      expect(result).toBe(Math.ceil(3 * people * 3));
      expect(result).toBe(32);
    });

    it('L48 with pets: qty multiplied by pet multiplier', () => {
      const item = createMockRecommendedItem({
        id: createProductTemplateId('pet-food'),
        baseQuantity: createQuantity(2),
        scaleWithPeople: false,
        scaleWithDays: false,
        scaleWithPets: true,
      });
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 3,
        supplyDurationDays: 1,
      });
      const result = calculateRecommendedQuantity(item, household);
      // correct: 2 * (3 * 1) = 6
      // mutant (/=): 2 / 3 = 0.67 -> ceil = 1
      expect(result).toBe(Math.ceil(2 * 3 * PET_REQUIREMENT_MULTIPLIER));
      expect(result).toBe(6);
    });
  });
});
