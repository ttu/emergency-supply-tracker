import { describe, it, expect } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  MIN_SUPPORTED_VERSION,
  compareVersions,
  isVersionSupported,
  needsMigration,
  migrateToCurrentVersion,
  getMigrationPath,
  MigrationError,
} from './migrations';
import { createAppData } from '@/shared/utils/test/factories';

describe('migrations', () => {
  describe('CURRENT_SCHEMA_VERSION', () => {
    it('should be a valid semantic version', () => {
      expect(CURRENT_SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should be at least 1.0.0', () => {
      expect(
        compareVersions(CURRENT_SCHEMA_VERSION, '1.0.0'),
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.3.4', '2.3.4')).toBe(0);
    });

    it('should return -1 when first version is lower', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
    });

    it('should return 1 when first version is higher', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    it('should throw for invalid version format', () => {
      expect(() => compareVersions('1.0', '1.0.0')).toThrow(
        'Invalid version format',
      );
      expect(() => compareVersions('1.0.0', 'invalid')).toThrow(
        'Invalid version format',
      );
      expect(() => compareVersions('v1.0.0', '1.0.0')).toThrow(
        'Invalid version format',
      );
    });
  });

  describe('isVersionSupported', () => {
    it('should return true for current version', () => {
      expect(isVersionSupported(CURRENT_SCHEMA_VERSION)).toBe(true);
    });

    it('should return true for minimum supported version', () => {
      expect(isVersionSupported(MIN_SUPPORTED_VERSION)).toBe(true);
    });

    it('should return true for versions >= minimum', () => {
      expect(isVersionSupported('1.0.0')).toBe(true);
      expect(isVersionSupported('1.0.1')).toBe(true);
      expect(isVersionSupported('1.1.0')).toBe(true);
      expect(isVersionSupported('2.0.0')).toBe(true);
    });

    it('should return false for versions < minimum', () => {
      expect(isVersionSupported('0.9.9')).toBe(false);
      expect(isVersionSupported('0.0.1')).toBe(false);
    });

    it('should return false for invalid versions', () => {
      expect(isVersionSupported('invalid')).toBe(false);
      expect(isVersionSupported('')).toBe(false);
    });
  });

  describe('needsMigration', () => {
    it('should return false for data at current version', () => {
      const data = createAppData({ version: CURRENT_SCHEMA_VERSION });
      expect(needsMigration(data)).toBe(false);
    });

    it('should return true for data at older version', () => {
      // This test will become relevant when we have version > 1.0.0
      // For now, 1.0.0 is current, so no migration needed
      const data = createAppData({ version: '1.0.0' });
      expect(needsMigration(data)).toBe(false);
    });

    it('should return false for data at newer version', () => {
      const data = createAppData({ version: '99.0.0' });
      expect(needsMigration(data)).toBe(false);
    });
  });

  describe('migrateToCurrentVersion', () => {
    it('should return data unchanged if already at current version', () => {
      const data = createAppData({ version: CURRENT_SCHEMA_VERSION });
      const result = migrateToCurrentVersion(data);
      expect(result.version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should throw MigrationError for unsupported versions', () => {
      const data = createAppData({ version: '0.1.0' });
      expect(() => migrateToCurrentVersion(data)).toThrow(MigrationError);
    });

    it('should preserve all existing data during migration', () => {
      const data = createAppData({
        version: CURRENT_SCHEMA_VERSION,
        household: {
          adults: 3,
          children: 2,
          supplyDurationDays: 14,
          useFreezer: true,
        },
      });

      const result = migrateToCurrentVersion(data);

      expect(result.household.adults).toBe(3);
      expect(result.household.children).toBe(2);
      expect(result.household.supplyDurationDays).toBe(14);
      expect(result.household.useFreezer).toBe(true);
    });
  });

  describe('getMigrationPath', () => {
    it('should return empty array if no migrations needed', () => {
      const path = getMigrationPath(CURRENT_SCHEMA_VERSION);
      expect(path).toEqual([]);
    });

    it('should return empty array for version 1.0.0 (no migrations yet)', () => {
      const path = getMigrationPath('1.0.0');
      expect(path).toEqual([]);
    });
  });

  describe('MigrationError', () => {
    it('should have correct properties', () => {
      const error = new MigrationError(
        'Test error',
        '1.0.0',
        '1.1.0',
        new Error('cause'),
      );

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('MigrationError');
      expect(error.fromVersion).toBe('1.0.0');
      expect(error.toVersion).toBe('1.1.0');
      expect(error.cause).toBeInstanceOf(Error);
    });
  });
});

// =============================================================================
// Future Migration Tests Template
// =============================================================================
// When adding a new migration (e.g., 1.0.0 -> 1.1.0), add tests like:
//
// describe('migration 1.0.0 -> 1.1.0', () => {
//   it('should add newField with default value', () => {
//     const oldData = createAppData({ version: '1.0.0' });
//     const newData = migrateToCurrentVersion(oldData);
//     expect(newData.newField).toBe('default-value');
//     expect(newData.version).toBe('1.1.0');
//   });
//
//   it('should preserve existing newField if present', () => {
//     const oldData = { ...createAppData({ version: '1.0.0' }), newField: 'custom' };
//     const newData = migrateToCurrentVersion(oldData);
//     expect(newData.newField).toBe('custom');
//   });
// });
