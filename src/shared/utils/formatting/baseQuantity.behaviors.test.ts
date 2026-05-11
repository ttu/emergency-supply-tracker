import { describe, it, expect } from 'vitest';
import { formatBaseQuantity } from './baseQuantity';

describe('formatBaseQuantity behaviors', () => {
  describe('isFractional detection', () => {
    it('treats whole numbers as non-fractional (baseQuantity * 1 mutant)', () => {
      // For whole number 5: rounded=5, 5 !== 5 is false -> not fractional
      // If mutated to baseQuantity * 1, result is still 5, so no change
      // But we need to verify the whole number path is taken
      const result = formatBaseQuantity(5, 'liters', 'note', true);
      expect(result).toBe('5 liters');
      // Must NOT include rounding note for whole numbers
      expect(result).not.toContain('(');
    });

    it('treats fractional values as fractional (baseQuantity !== rounded)', () => {
      // For 0.5: rounded=1, 0.5 !== 1 is true AND 0.5 % 1 !== 0 is true
      const result = formatBaseQuantity(0.5, 'cans', 'rounding note', true);
      expect(result).toBe('1 cans (rounding note)');
    });

    it('handles value of exactly 1 as non-fractional', () => {
      const result = formatBaseQuantity(1, 'pieces', 'note', true);
      expect(result).toBe('1 pieces');
      expect(result).not.toContain('(');
    });

    it('detects 0.01 as fractional (both conditions must be true)', () => {
      // 0.01: rounded=1, 0.01 !== 1 is true, 0.01 % 1 !== 0 is true
      const result = formatBaseQuantity(0.01, 'units', '0.01 rounded up', true);
      expect(result).toBe('1 units (0.01 rounded up)');
    });

    it('LogicalOperator mutant: both conditions in isFractional matter', () => {
      // If || replaces &&, whole numbers would be treated as fractional
      // For whole number 3: rounded=3, 3 !== 3 is false, 3 % 1 === 0
      // With &&: false && false = false (correct, not fractional)
      // With ||: false || false = false (same for this case)
      // Need a case where they differ: value where one is true and other is false
      // Actually the && is checking `baseQuantity !== rounded && baseQuantity % 1 !== 0`
      // These are equivalent for normal cases. The || mutant matters when:
      // baseQuantity === rounded but baseQuantity % 1 !== 0 - impossible for integers
      // baseQuantity !== rounded but baseQuantity % 1 === 0 - also impossible
      // So we just need to verify the behavior is correct for fractional vs whole
      const wholeResult = formatBaseQuantity(2, 'cans', 'note', true);
      expect(wholeResult).toBe('2 cans');

      const fractionalResult = formatBaseQuantity(2.5, 'cans', 'note', true);
      expect(fractionalResult).toBe('3 cans (note)');
    });

    it('ArithmeticOperator: baseQuantity * 1 would not change value but catches other mutations', () => {
      // If isFractional check is replaced with `true`, all numbers become fractional
      // Verify whole numbers go through the non-fractional path
      const result3 = formatBaseQuantity(3, 'liters', 'some note', true);
      expect(result3).toBe('3 liters');
      // The value should be baseQuantity, not rounded (they're equal for whole numbers)
      // But if ConditionalExpression is true, it would show: "3 liters (some note)"
      expect(result3).not.toContain('(some note)');
    });
  });

  // ==========================================================================
  // L27: ConditionalExpression/LogicalOperator/ArithmeticOperator
  // isFractional = baseQuantity !== rounded && baseQuantity % 1 !== 0
  // Mutant: || instead of &&, * instead of /, conditions → true
  // ==========================================================================
  describe('isFractional detection (extra cases)', () => {
    it('whole numbers are NOT fractional', () => {
      const result = formatBaseQuantity(5, 'pieces', '(~5)');
      // Whole number: no rounding note
      expect(result).toBe('5 pieces');
      expect(result).not.toContain('(');
    });

    it('fractional numbers ARE fractional and show rounding note', () => {
      const result = formatBaseQuantity(2.7, 'liters', '(~2.7)');
      // Fractional: rounds up to 3 and shows note
      expect(result).toBe('3 liters ((~2.7))');
    });

    it('fractional without note shows just rounded value', () => {
      const result = formatBaseQuantity(2.7, 'liters', '(~2.7)', false);
      expect(result).toBe('3 liters');
    });

    it('value of 0 is not fractional', () => {
      const result = formatBaseQuantity(0, 'pieces', '(~0)');
      expect(result).toBe('0 pieces');
    });

    it('large whole number is not fractional', () => {
      const result = formatBaseQuantity(100, 'pieces', '(~100)');
      expect(result).toBe('100 pieces');
      expect(result).not.toContain('(');
    });
  });
});

// ===========================================================================
// Mutation-killing tests targeting specific surviving mutants (issue #277)
// L27: isFractional = baseQuantity !== rounded && baseQuantity % 1 !== 0
//      ConditionalExpression true/true; ArithmeticOperator % → *; LogicalOperator
// ===========================================================================
describe('mutation-killers: baseQuantity.ts (issue #277)', () => {
  it('whole number prints WITHOUT the rounding-note suffix (isFractional=false)', () => {
    const out = formatBaseQuantity(5, 'liters', 'NOTE', true);
    expect(out).toBe('5 liters');
    expect(out).not.toContain('NOTE');
    expect(out).not.toContain('(');
  });

  it('fractional number prints WITH the rounding-note suffix (isFractional=true)', () => {
    const out = formatBaseQuantity(0.67, 'cans', 'NOTE', true);
    expect(out).toBe('1 cans (NOTE)');
  });

  it('fractional + showRoundingNote=false drops the note but still rounds up', () => {
    // Distinguishes ArithmeticOperator % vs * mutation:
    //   With %: 0.67 % 1 = 0.67 !== 0 → fractional; output uses Math.ceil → "1 cans"
    //   With *: 0.67 * 1 = 0.67 !== 0 → fractional; same. So we also need:
    expect(formatBaseQuantity(0.67, 'cans', 'NOTE', false)).toBe('1 cans');
    // For a value where % and * disagree against 0:
    //   value=0 → 0%1=0 (false) vs 0*1=0 (false). Same.
    // The mutation truly survives unless % returns 0 for non-integer; instead, check
    // the OUTPUT contract: integer "5" must NOT be rounded up to "6".
    expect(formatBaseQuantity(5, 'liters', 'NOTE', false)).toBe('5 liters');
  });
});
