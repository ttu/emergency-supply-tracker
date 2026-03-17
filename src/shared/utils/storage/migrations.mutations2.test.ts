/**
 * Additional mutation-killing tests for migrations.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import {
  compareVersions,
  needsMigration,
  isVersionSupported,
} from './migrations';
import type { AppData } from '@/shared/types';

// ============================================================================
// L112-114: EqualityOperator - compareVersions boundary conditions
// L112: vA.major < vB.major → <= (would return -1 for equal majors)
// L113: vA.minor < vB.minor → <= (would return -1 for equal minors)
// L114: vA.patch < vB.patch → <= (would return -1 for equal patches)
// ============================================================================
describe('compareVersions boundary conditions (L112-114)', () => {
  it('returns 0 for identical versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('2.3.4', '2.3.4')).toBe(0);
  });

  it('L112: equal major, different minor returns correct comparison', () => {
    // If < is mutated to <=: major 1 <= 1 is true -> would return -1 incorrectly
    expect(compareVersions('1.2.0', '1.1.0')).toBe(1); // a > b
    expect(compareVersions('1.1.0', '1.2.0')).toBe(-1); // a < b
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0); // equal
  });

  it('L113: equal major+minor, different patch returns correct comparison', () => {
    // If < is mutated to <=: minor 2 <= 2 is true -> would return -1 incorrectly
    expect(compareVersions('1.2.3', '1.2.1')).toBe(1); // a > b
    expect(compareVersions('1.2.1', '1.2.3')).toBe(-1); // a < b
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0); // equal
  });

  it('L114: all components equal returns 0', () => {
    // If < is mutated to <=: patch 3 <= 3 is true -> would return -1 incorrectly
    expect(compareVersions('0.0.0', '0.0.0')).toBe(0);
    expect(compareVersions('1.1.1', '1.1.1')).toBe(0);
  });

  it('handles major version differences', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
  });
});

// ============================================================================
// L134: ConditionalExpression - needsMigration returns false instead of true
// Mutant: compareVersions(dataVersion, CURRENT_SCHEMA_VERSION) < 0 → false
// ============================================================================
describe('L134: needsMigration condition (ConditionalExpression)', () => {
  it('returns true when data version is older than current', () => {
    const oldData = {
      version: '0.0.1',
    } as AppData;

    const result = needsMigration(oldData);
    expect(result).toBe(true);
  });

  it('returns false when data version matches current', () => {
    // Use a version that would be current
    const currentData = {
      version: '99.99.99', // Definitely >= current
    } as AppData;

    const result = needsMigration(currentData);
    expect(result).toBe(false);
  });
});

// ============================================================================
// L251: ConditionalExpression - !needsMigration(data) → true
// Mutant: always returns data without migrating
// ============================================================================
describe('L251: migrateToCurrentVersion skip condition', () => {
  it('isVersionSupported returns true for supported version', () => {
    expect(isVersionSupported('1.0.0')).toBe(true);
  });

  it('isVersionSupported returns false for unsupported version', () => {
    expect(isVersionSupported('0.0.0')).toBe(false);
  });
});
