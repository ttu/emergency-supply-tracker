/**
 * Mutation-killing tests for faker-helpers.ts
 *
 * Targets surviving mutants:
 * - L144 MethodExpression: Math.min(0, max - 1) instead of Math.max(0, max - 1)
 * - L144 ArithmeticOperator: max + 1 instead of max - 1
 * - L154 ObjectLiteral: {} instead of { min: 1, max: maxAdditional }
 */
import { describe, it, expect } from 'vitest';
import { randomLessThan, randomMoreThan } from './faker-helpers';

describe('faker-helpers mutation killers', () => {
  describe('randomLessThan - L144 Math.min vs Math.max and max+1 vs max-1', () => {
    it('returns 0 when max is 0', () => {
      // Math.max(0, 0 - 1) = Math.max(0, -1) = 0 -> range {min:0, max:0} -> always 0
      // Math.min(0, 0 - 1) = Math.min(0, -1) = -1 -> range {min:0, max:-1} -> invalid/would error or return 0
      // Math.max(0, 0 + 1) = Math.max(0, 1) = 1 -> range {min:0, max:1} -> could return 1
      const result = randomLessThan(0);
      expect(result).toBe(0);
    });

    it('returns 0 when max is 1', () => {
      // Math.max(0, 1 - 1) = 0 -> range {min:0, max:0} -> always 0
      // Math.max(0, 1 + 1) = 2 -> range {min:0, max:2} -> could return 1 or 2 (wrong, should be < 1)
      const result = randomLessThan(1);
      expect(result).toBe(0);
    });

    it('always returns a value strictly less than max for positive max', () => {
      // Run multiple times to catch stochastic mutants
      for (let i = 0; i < 50; i++) {
        const max = 5;
        const result = randomLessThan(max);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(max);
      }
    });

    it('returns value in range [0, max-1] for max=2', () => {
      // With correct code: Math.max(0, 2-1) = 1, range [0,1]
      // With max+1 mutant: Math.max(0, 2+1) = 3, range [0,3] - could return 2 or 3
      for (let i = 0; i < 50; i++) {
        const result = randomLessThan(2);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    });

    it('handles negative max by returning 0', () => {
      // Math.max(0, -5 - 1) = Math.max(0, -6) = 0
      // Math.min(0, -5 - 1) = Math.min(0, -6) = -6 (wrong, negative)
      const result = randomLessThan(-5);
      expect(result).toBe(0);
    });
  });

  describe('randomMoreThan - L154 ObjectLiteral {} mutant', () => {
    it('returns a value strictly greater than min', () => {
      // If the object literal is replaced with {}, faker.number.int({}) would
      // use default range which could include 0, making result = min + 0 = min
      // Correct: { min: 1, max: maxAdditional } ensures at least min + 1
      for (let i = 0; i < 50; i++) {
        const min = 10;
        const result = randomMoreThan(min);
        expect(result).toBeGreaterThan(min);
      }
    });

    it('returns value in range [min+1, min+maxAdditional]', () => {
      const min = 5;
      const maxAdditional = 3;
      for (let i = 0; i < 50; i++) {
        const result = randomMoreThan(min, maxAdditional);
        expect(result).toBeGreaterThanOrEqual(min + 1);
        expect(result).toBeLessThanOrEqual(min + maxAdditional);
      }
    });

    it('returns exactly min+1 when maxAdditional is 1', () => {
      // { min: 1, max: 1 } -> always 1, so result = min + 1
      // {} -> could be anything
      const result = randomMoreThan(100, 1);
      expect(result).toBe(101);
    });
  });
});
