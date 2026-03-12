/**
 * Mutation-killing tests for localStorage.helpers.ts
 *
 * Target: StringLiteral L8 "" — the default exportedAt value.
 * If mutated to "Stryker was here", the exportedAt field would not match expected format.
 */
import { describe, it, expect } from 'vitest';
import { createTestExportMetadata } from './localStorage.helpers';

describe('createTestExportMetadata mutation tests', () => {
  it('returns exportedAt as a valid ISO date string, not an empty string replacement', () => {
    const metadata = createTestExportMetadata();
    // L8: exportedAt must be exactly '2024-01-01T00:00:00.000Z'
    // If mutant replaces "" on L8, it would change the string literal.
    // The actual "" on L8 is the exportedAt value — wait, L8 is '2024-01-01T00:00:00.000Z'.
    // Let me re-check: the "" is not on L8. Let me look again...
    // Actually looking at the code, L8 has exportedAt: '2024-01-01T00:00:00.000Z'
    // The "" StringLiteral on L8... the survivor is the empty string default.
    // Wait — the empty string is not on L8. Let me re-read the source.
    // L6: sections: string[] = [] — that's an ArrayDeclaration
    // The only "" in this file would be... there isn't one explicitly.
    // The Stryker report says StringLiteral L8 "". This could be the empty string
    // that Stryker generates as a mutation OF the '2024-01-01T00:00:00.000Z' literal.
    // OR it's testing that replacing '2024-01-01T00:00:00.000Z' with '' survives.
    // To kill it: verify the actual string value.
    expect(metadata.exportedAt).toBe('2024-01-01T00:00:00.000Z');
    expect(metadata.exportedAt).not.toBe('');
  });

  it('returns correct default values for all fields', () => {
    const metadata = createTestExportMetadata();
    expect(metadata.itemCount).toBe(0);
    expect(metadata.categoryCount).toBe(0);
    expect(metadata.includedSections).toEqual([]);
  });

  it('passes sections through to includedSections', () => {
    const metadata = createTestExportMetadata(['inventory', 'settings']);
    expect(metadata.includedSections).toEqual(['inventory', 'settings']);
  });
});
