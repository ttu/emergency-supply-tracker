/**
 * Mutation-killing tests for recommendedQuantity.ts
 *
 * Targets surviving mutants:
 * - L21 ArithmeticOperator: division vs multiplication (adults * multiplier)
 * - L42 ArithmeticOperator: division vs multiplication (adults * multiplier in calculateRecommendedQuantity)
 * - L48 ArithmeticOperator: division vs multiplication (pets * multiplier)
 */
import { describe, it, expect } from 'vitest';
import {
  calculateHouseholdMultiplier,
  calculateRecommendedQuantity,
} from './recommendedQuantity';
import {
  createMockHousehold,
  createMockRecommendedItem,
} from '@/shared/utils/test/factories';
import { createQuantity } from '@/shared/types';
import {
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
  PET_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';

describe('recommendedQuantity mutation killers', () => {
  describe('L21: children * CHILDREN_REQUIREMENT_MULTIPLIER (not division)', () => {
    // NOTE: ADULT_REQUIREMENT_MULTIPLIER is 1.0, making * vs / equivalent for adults.
    // This test targets the children multiplier (0.75) where * vs / produces different results.
    it('household multiplier scales correctly with children multiplier', () => {
      const household1 = createMockHousehold({
        adults: 1,
        children: 2,
        pets: 0,
        supplyDurationDays: 1,
      });
      const household2 = createMockHousehold({
        adults: 1,
        children: 4,
        pets: 0,
        supplyDurationDays: 1,
      });

      const mult1 = calculateHouseholdMultiplier(household1);
      const mult2 = calculateHouseholdMultiplier(household2);

      // Correct: 1*1.0 + 2*0.75 = 2.5 and 1*1.0 + 4*0.75 = 4.0
      // Children division mutant: 1*1.0 + 2/0.75 = 3.67 and 1*1.0 + 4/0.75 = 6.33
      expect(mult1).toBe(
        (1 * ADULT_REQUIREMENT_MULTIPLIER +
          2 * CHILDREN_REQUIREMENT_MULTIPLIER) *
          1,
      );
      expect(mult2).toBe(
        (1 * ADULT_REQUIREMENT_MULTIPLIER +
          4 * CHILDREN_REQUIREMENT_MULTIPLIER) *
          1,
      );

      // Verify the ratio: doubling children from 2 to 4 should add 2*0.75=1.5
      expect(mult2 - mult1).toBeCloseTo(2 * CHILDREN_REQUIREMENT_MULTIPLIER);
    });

    it('multiplier increases with supplyDurationDays', () => {
      const household = createMockHousehold({
        adults: 2,
        children: 1,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateHouseholdMultiplier(household);
      // (2*1.0 + 1*0.75) * 3 = 2.75 * 3 = 8.25
      expect(result).toBe(
        (2 * ADULT_REQUIREMENT_MULTIPLIER +
          1 * CHILDREN_REQUIREMENT_MULTIPLIER) *
          3,
      );
    });
  });

  describe('L42: peopleMultiplier multiplication in calculateRecommendedQuantity', () => {
    it('scales quantity by people multiplier when scaleWithPeople is true', () => {
      const item = createMockRecommendedItem({
        baseQuantity: createQuantity(2),
        scaleWithPeople: true,
        scaleWithDays: false,
        scaleWithPets: false,
      });
      const household = createMockHousehold({
        adults: 2,
        children: 2,
        pets: 0,
        supplyDurationDays: 1,
      });

      const result = calculateRecommendedQuantity(item, household);
      // peopleMultiplier = 2*1.0 + 2*0.75 = 3.5
      // qty = 2 * 3.5 = 7
      // Division mutant: qty = 2 / 3.5 = 0.571... -> ceil = 1
      expect(result).toBe(
        Math.ceil(
          2 *
            (2 * ADULT_REQUIREMENT_MULTIPLIER +
              2 * CHILDREN_REQUIREMENT_MULTIPLIER),
        ),
      );
    });

    it('does not scale when scaleWithPeople is false', () => {
      const item = createMockRecommendedItem({
        baseQuantity: createQuantity(5),
        scaleWithPeople: false,
        scaleWithDays: false,
        scaleWithPets: false,
      });
      const household = createMockHousehold({
        adults: 3,
        children: 2,
        pets: 0,
        supplyDurationDays: 7,
      });

      const result = calculateRecommendedQuantity(item, household);
      expect(result).toBe(5);
    });
  });

  describe('L48: pets * PET_REQUIREMENT_MULTIPLIER (not division)', () => {
    it('scales quantity by pets when scaleWithPets is true', () => {
      const item = createMockRecommendedItem({
        baseQuantity: createQuantity(3),
        scaleWithPeople: false,
        scaleWithDays: false,
        scaleWithPets: true,
      });
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 2,
        supplyDurationDays: 1,
      });

      const result = calculateRecommendedQuantity(item, household);
      // qty = 3 * (2 * 1) = 6
      // Division mutant: 3 / (2 * 1) = 1.5 -> ceil = 2
      expect(result).toBe(Math.ceil(3 * 2 * PET_REQUIREMENT_MULTIPLIER));
    });

    it('returns base quantity when pets is 0 and scaleWithPets is true', () => {
      const item = createMockRecommendedItem({
        baseQuantity: createQuantity(4),
        scaleWithPeople: false,
        scaleWithDays: false,
        scaleWithPets: true,
      });
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 1,
      });

      const result = calculateRecommendedQuantity(item, household);
      // qty = 4 * (0 * 1) = 0 -> ceil = 0
      // Division would be 4 / 0 = Infinity -> ceil = Infinity
      expect(result).toBe(0);
    });
  });
});
