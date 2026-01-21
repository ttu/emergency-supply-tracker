import { describe, it, expect } from 'vitest';
import { formatBaseQuantity, formatBaseQuantityCompact } from './baseQuantity';

describe('formatBaseQuantity', () => {
  it('should format whole numbers without rounding note', () => {
    expect(formatBaseQuantity(5, 'liters')).toBe('5 liters');
    expect(formatBaseQuantity(1, 'cans')).toBe('1 cans');
    expect(formatBaseQuantity(10, 'pieces')).toBe('10 pieces');
  });

  it('should format fractional values with rounding note', () => {
    const result = formatBaseQuantity(0.67, 'cans');
    expect(result).toBe('1 cans (0.67 per person, rounded up in calculations)');
  });

  it('should format fractional values without rounding note when disabled', () => {
    expect(formatBaseQuantity(0.67, 'cans', false)).toBe('0.67 cans');
  });

  it('should handle values that round to 1', () => {
    const result = formatBaseQuantity(0.5, 'liters');
    expect(result).toBe(
      '1 liters (0.5 per person, rounded up in calculations)',
    );
  });

  it('should handle values that round to larger numbers', () => {
    const result = formatBaseQuantity(2.33, 'cans');
    expect(result).toBe('3 cans (2.33 per person, rounded up in calculations)');
  });
});

describe('formatBaseQuantityCompact', () => {
  it('should format whole numbers as-is', () => {
    expect(formatBaseQuantityCompact(5, 'liters')).toBe('5 liters');
    expect(formatBaseQuantityCompact(1, 'cans')).toBe('1 cans');
    expect(formatBaseQuantityCompact(10, 'pieces')).toBe('10 pieces');
  });

  it('should round up fractional values', () => {
    expect(formatBaseQuantityCompact(0.67, 'cans')).toBe('1 cans');
    expect(formatBaseQuantityCompact(0.5, 'liters')).toBe('1 liters');
    expect(formatBaseQuantityCompact(2.33, 'cans')).toBe('3 cans');
  });

  it('should handle edge cases', () => {
    expect(formatBaseQuantityCompact(0.01, 'pieces')).toBe('1 pieces');
    expect(formatBaseQuantityCompact(0.99, 'cans')).toBe('1 cans');
    expect(formatBaseQuantityCompact(1.01, 'liters')).toBe('2 liters');
  });
});
