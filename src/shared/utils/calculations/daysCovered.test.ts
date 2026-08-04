import { describe, it, expect } from 'vitest';
import {
  calculateDaysCovered,
  type ResourceCoverageInput,
} from './daysCovered';
import { WATER_CATEGORY_ID } from '@/shared/utils/constants';

/**
 * Food coverage as the category status calculation reports it.
 * `totalNeededCalories` is always the requirement for the *whole* supply
 * duration, which is what lets the daily rate be recovered by division.
 */
function foodStatus(
  overrides: Partial<ResourceCoverageInput> = {},
): ResourceCoverageInput {
  return {
    categoryId: 'food',
    totalActual: 0,
    totalActualCalories: 21000,
    totalNeededCalories: 21000,
    ...overrides,
  };
}

function waterStatus(
  overrides: Partial<ResourceCoverageInput> = {},
): ResourceCoverageInput {
  return {
    categoryId: WATER_CATEGORY_ID,
    totalActual: 21,
    primaryUnit: 'liters',
    drinkingWaterNeeded: 21,
    preparationWaterNeeded: 0,
    ...overrides,
  };
}

describe('calculateDaysCovered', () => {
  describe('single resource', () => {
    it('reports food days when only food is measurable', () => {
      const result = calculateDaysCovered(
        [foodStatus({ totalActualCalories: 42000 })],
        7,
      );

      // 42000 kcal against a 3000 kcal/day rate
      expect(result.days).toBe(14);
      expect(result.foodDays).toBe(14);
      expect(result.waterDays).toBeUndefined();
      expect(result.limitedBy).toBe('food');
    });

    it('reports water days when only water is measurable', () => {
      const result = calculateDaysCovered(
        [waterStatus({ totalActual: 30 })],
        7,
      );

      // 30 L against a 3 L/day drinking rate
      expect(result.days).toBe(10);
      expect(result.waterDays).toBe(10);
      expect(result.foodDays).toBeUndefined();
      expect(result.limitedBy).toBe('water');
    });
  });

  describe('both resources', () => {
    it('returns the smaller of the two and names water as the constraint', () => {
      const result = calculateDaysCovered(
        [
          foodStatus({ totalActualCalories: 42000 }),
          waterStatus({ totalActual: 15 }),
        ],
        7,
      );

      expect(result.days).toBe(5);
      expect(result.limitedBy).toBe('water');
    });

    it('returns the smaller of the two and names food as the constraint', () => {
      const result = calculateDaysCovered(
        [
          foodStatus({ totalActualCalories: 9000 }),
          waterStatus({ totalActual: 30 }),
        ],
        7,
      );

      expect(result.days).toBe(3);
      expect(result.limitedBy).toBe('food');
    });

    it('matches the worked example from the design doc', () => {
      // 58-item household: both category panels read OK, yet the old
      // ok-ratio metric reported 2.8 days.
      const result = calculateDaysCovered(
        [
          foodStatus({
            totalActualCalories: 66355,
            totalNeededCalories: 21000,
          }),
          waterStatus({
            totalActual: 70,
            drinkingWaterNeeded: 21,
            preparationWaterNeeded: 43,
          }),
        ],
        7,
      );

      // food: 66355 / 3000 = 22.1 days
      // water: 70 / (3 + 43/22.118) = 14.2 days
      expect(result.foodDays).toBeCloseTo(22.1, 1);
      expect(result.days).toBeCloseTo(14.2, 5);
      expect(result.limitedBy).toBe('water');
    });
  });

  describe('preparation water', () => {
    it('uses the drinking rate alone when no food needs preparing', () => {
      const result = calculateDaysCovered(
        [foodStatus(), waterStatus({ totalActual: 30 })],
        7,
      );

      expect(result.waterDays).toBe(10);
    });

    it('lowers water days once food needs preparing', () => {
      const withoutPreparation = calculateDaysCovered(
        [foodStatus(), waterStatus({ totalActual: 30 })],
        7,
      );
      const withPreparation = calculateDaysCovered(
        [
          foodStatus(),
          waterStatus({ totalActual: 30, preparationWaterNeeded: 14 }),
        ],
        7,
      );

      expect(withPreparation.waterDays).toBeLessThan(
        withoutPreparation.waterDays!,
      );
    });

    it('does not punish stocking more food, because preparation water is amortised over it', () => {
      const lessFood = calculateDaysCovered(
        [
          foodStatus({ totalActualCalories: 21000 }),
          waterStatus({ totalActual: 30, preparationWaterNeeded: 14 }),
        ],
        7,
      );
      const moreFood = calculateDaysCovered(
        [
          foodStatus({ totalActualCalories: 63000 }),
          waterStatus({ totalActual: 30, preparationWaterNeeded: 14 }),
        ],
        7,
      );

      expect(moreFood.waterDays!).toBeGreaterThanOrEqual(lessFood.waterDays!);
    });
  });

  describe('when a resource cannot be measured', () => {
    it('returns 0 when neither category is present', () => {
      const result = calculateDaysCovered([], 7);

      expect(result.days).toBe(0);
      expect(result.foodDays).toBeUndefined();
      expect(result.waterDays).toBeUndefined();
      expect(result.limitedBy).toBeUndefined();
    });

    it('ignores categories that are neither food nor water', () => {
      const result = calculateDaysCovered(
        [
          { categoryId: 'light-power', totalActual: 12 },
          foodStatus({ totalActualCalories: 42000 }),
        ],
        7,
      );

      expect(result.days).toBe(14);
    });

    it('skips food when there is no calorie requirement to divide by', () => {
      const result = calculateDaysCovered(
        [
          foodStatus({ totalNeededCalories: 0 }),
          waterStatus({ totalActual: 30 }),
        ],
        7,
      );

      expect(result.foodDays).toBeUndefined();
      expect(result.days).toBe(10);
    });

    it('skips water when nothing is required for drinking or preparation', () => {
      const result = calculateDaysCovered(
        [
          foodStatus({ totalActualCalories: 42000 }),
          waterStatus({ drinkingWaterNeeded: 0, preparationWaterNeeded: 0 }),
        ],
        7,
      );

      expect(result.waterDays).toBeUndefined();
      expect(result.days).toBe(14);
    });

    it('skips water when the category total is a mixed-unit sum', () => {
      const result = calculateDaysCovered(
        [
          foodStatus({ totalActualCalories: 42000 }),
          waterStatus({ totalActual: 30, primaryUnit: 'pieces' }),
        ],
        7,
      );

      expect(result.waterDays).toBeUndefined();
      expect(result.days).toBe(14);
    });

    it('returns 0 for a household with no supply duration', () => {
      const result = calculateDaysCovered([foodStatus(), waterStatus()], 0);

      expect(result.days).toBe(0);
    });
  });

  describe('empty and invalid inventories', () => {
    it('reports zero days when no calories are stocked', () => {
      const result = calculateDaysCovered(
        [
          foodStatus({ totalActualCalories: 0 }),
          waterStatus({ totalActual: 30, preparationWaterNeeded: 14 }),
        ],
        7,
      );

      expect(result.days).toBe(0);
      expect(result.foodDays).toBe(0);
      expect(result.limitedBy).toBe('food');
    });

    it('reports zero days when no water is stocked', () => {
      const result = calculateDaysCovered(
        [foodStatus(), waterStatus({ totalActual: 0 })],
        7,
      );

      expect(result.days).toBe(0);
      expect(result.waterDays).toBe(0);
      expect(result.limitedBy).toBe('water');
    });

    it('never returns a non-finite value from corrupted stored data', () => {
      const result = calculateDaysCovered(
        [
          foodStatus({ totalActualCalories: Number.NaN }),
          waterStatus({ totalActual: Number.POSITIVE_INFINITY }),
        ],
        7,
      );

      expect(Number.isFinite(result.days)).toBe(true);
      expect(result.days).toBe(0);
    });

    it('clamps absurd totals so the tile cannot break its layout', () => {
      const result = calculateDaysCovered(
        [waterStatus({ totalActual: 10_000_000 })],
        7,
      );

      expect(result.days).toBe(999);
    });
  });

  describe('rounding', () => {
    it('rounds to one decimal, down', () => {
      // 7 L needed over 7 days = 1 L/day, so litres map straight onto days
      const result = calculateDaysCovered(
        [waterStatus({ totalActual: 7.04, drinkingWaterNeeded: 7 })],
        7,
      );

      expect(result.days).toBe(7);
    });

    it('rounds to one decimal, up', () => {
      const result = calculateDaysCovered(
        [waterStatus({ totalActual: 7.06, drinkingWaterNeeded: 7 })],
        7,
      );

      expect(result.days).toBeCloseTo(7.1, 5);
    });
  });
});
