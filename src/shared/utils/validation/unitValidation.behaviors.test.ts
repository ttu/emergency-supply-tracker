import { describe, it, expect } from 'vitest';
import { isValidUnit } from './unitValidation';
import { VALID_UNITS } from '@/shared/types';

/**
 * Mutation-killing tests for unitValidation.ts line 22:
 *   if (unit === null || unit === undefined || typeof unit !== 'string')
 *
 * Targets:
 * - ConditionalExpression → false (guard removed entirely)
 * - LogicalOperator: || → && (guard requires ALL conditions)
 * - BlockStatement → {} (guard body emptied, falls through)
 *
 * Strategy: Verify that each branch of the guard individually returns false,
 * and that valid string inputs still return true (to kill "always false" mutants).
 * Also verify the return value is strictly boolean to catch block-emptied mutants.
 */
describe('isValidUnit – mutation killing tests for L22 guard', () => {
  // --- Tests targeting: null input (unit === null) ---

  it('should return exactly false for null (not falsy, strictly false)', () => {
    const result = isValidUnit(null as unknown as string);
    expect(result).toBe(false);
    expect(result).not.toBe(undefined); // kills BlockStatement → {} (returns undefined)
    expect(typeof result).toBe('boolean');
  });

  // --- Tests targeting: undefined input (unit === undefined) ---

  it('should return exactly false for undefined (not falsy, strictly false)', () => {
    const result = isValidUnit(undefined as unknown as string);
    expect(result).toBe(false);
    expect(result).not.toBe(undefined); // kills BlockStatement → {}
    expect(typeof result).toBe('boolean');
  });

  // --- Tests targeting: typeof unit !== 'string' ---

  it('should return exactly false for number input', () => {
    const result = isValidUnit(42 as unknown as string);
    expect(result).toBe(false);
    expect(typeof result).toBe('boolean');
  });

  it('should return exactly false for boolean true', () => {
    const result = isValidUnit(true as unknown as string);
    expect(result).toBe(false);
    expect(typeof result).toBe('boolean');
  });

  it('should return exactly false for boolean false', () => {
    const result = isValidUnit(false as unknown as string);
    expect(result).toBe(false);
    expect(typeof result).toBe('boolean');
  });

  it('should return exactly false for object input', () => {
    const result = isValidUnit({} as unknown as string);
    expect(result).toBe(false);
    expect(typeof result).toBe('boolean');
  });

  it('should return exactly false for array input', () => {
    const result = isValidUnit([] as unknown as string);
    expect(result).toBe(false);
    expect(typeof result).toBe('boolean');
  });

  it('should return exactly false for symbol input', () => {
    const result = isValidUnit(Symbol('test') as unknown as string);
    expect(result).toBe(false);
    expect(typeof result).toBe('boolean');
  });

  it('should return exactly false for NaN', () => {
    const result = isValidUnit(Number.NaN as unknown as string);
    expect(result).toBe(false);
    expect(typeof result).toBe('boolean');
  });

  it('should return exactly false for zero', () => {
    const result = isValidUnit(0 as unknown as string);
    expect(result).toBe(false);
    expect(typeof result).toBe('boolean');
  });

  // --- Tests ensuring valid strings return true (kills ConditionalExpression → false) ---

  it('should return true for every valid unit (guard must not block valid strings)', () => {
    for (const unit of VALID_UNITS) {
      const result = isValidUnit(unit);
      expect(result).toBe(true);
      expect(typeof result).toBe('boolean');
    }
  });

  it('should return true for first valid unit "pieces"', () => {
    expect(isValidUnit('pieces')).toBe(true);
  });

  it('should return true for last valid unit in array', () => {
    const lastUnit = VALID_UNITS[VALID_UNITS.length - 1];
    expect(isValidUnit(lastUnit)).toBe(true);
  });

  // --- Tests for invalid strings (must pass through guard, rejected by includes) ---

  it('should return false for invalid string (passes guard, fails includes)', () => {
    const result = isValidUnit('not-a-unit');
    expect(result).toBe(false);
    expect(typeof result).toBe('boolean');
  });

  it('should return false for empty string (passes typeof check, fails includes)', () => {
    const result = isValidUnit('');
    expect(result).toBe(false);
    expect(typeof result).toBe('boolean');
  });

  // --- Combined: verify guard vs includes distinction ---

  it('should return false for all non-string falsy values', () => {
    const falsyNonStrings = [null, undefined, 0, false, Number.NaN];
    for (const value of falsyNonStrings) {
      const result = isValidUnit(value as unknown as string);
      expect(result).toBe(false);
      expect(typeof result).toBe('boolean');
    }
  });

  it('should return false for all non-string truthy values', () => {
    const truthyNonStrings = [
      1,
      true,
      {},
      [],
      () => {},
      Symbol('x'),
      BigInt(1),
    ];
    for (const value of truthyNonStrings) {
      const result = isValidUnit(value as unknown as string);
      expect(result).toBe(false);
      expect(typeof result).toBe('boolean');
    }
  });
});
