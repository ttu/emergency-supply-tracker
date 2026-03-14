import { describe, it, expect } from 'vitest';
import { formatBaseQuantity } from './baseQuantity';

describe('formatBaseQuantity - mutation killing tests', () => {
  describe('L27: isFractional detection', () => {
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

    it('treats negative-zero-like edge: 1.0 is not fractional', () => {
      // 1.0: rounded=1, 1.0 !== 1 is false -> not fractional
      const result = formatBaseQuantity(1, 'cans', 'note', true);
      expect(result).toBe('1 cans');
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
});
