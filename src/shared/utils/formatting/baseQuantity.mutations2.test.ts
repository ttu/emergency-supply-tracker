/**
 * Additional mutation-killing tests for formatting/baseQuantity.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import { formatBaseQuantity } from './baseQuantity';

// ============================================================================
// L27: ConditionalExpression/LogicalOperator/ArithmeticOperator
// isFractional = baseQuantity !== rounded && baseQuantity % 1 !== 0
// Mutant: || instead of &&, * instead of /, conditions → true
// ============================================================================
describe('L27: isFractional detection', () => {
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
