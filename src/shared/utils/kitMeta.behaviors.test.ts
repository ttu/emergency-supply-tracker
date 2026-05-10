/**
 * Mutation-killing tests for kitMeta.ts
 *
 * Target: StringLiteral L20 "" — the final fallback in the nullish coalescing chain.
 * If mutated to "Stryker was here", empty objects would return a non-empty string.
 */
import { describe, it, expect } from 'vitest';
import { getLocalizedKitMetaString } from './kitMeta';

describe('getLocalizedKitMetaString mutation tests — empty fallback', () => {
  it('returns exactly empty string for empty object, not any other string', () => {
    const result = getLocalizedKitMetaString({}, 'en');
    // L20: Object.values(normalized)[0] ?? '' — the '' fallback
    // If mutated to a non-empty string, this test fails
    expect(result).toBe('');
    expect(result).toHaveLength(0);
  });

  it('returns exactly empty string for null value', () => {
    const result = getLocalizedKitMetaString(
      null as unknown as undefined,
      'en',
    );
    expect(result).toBe('');
  });
});
