/**
 * Mutation-killing tests for default.ts (DefaultCategoryStrategy)
 *
 * Target: StringLiteral L32 "" — the strategyId value 'default'.
 * If mutated to "", the strategyId would be empty instead of 'default'.
 */
import { describe, it, expect } from 'vitest';
import { DefaultCategoryStrategy } from './default';

describe('DefaultCategoryStrategy mutation tests — strategyId', () => {
  it('has strategyId exactly equal to "default", not empty string', () => {
    const strategy = new DefaultCategoryStrategy();
    expect(strategy.strategyId).toBe('default');
    expect(strategy.strategyId).not.toBe('');
    expect(strategy.strategyId.length).toBeGreaterThan(0);
  });
});
