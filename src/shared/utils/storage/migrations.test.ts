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
  applyTestMigrations,
  type TestMigration,
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

    it('should use 1.0.0 as default version when version is missing', () => {
      const data = createAppData({});
      delete (data as { version?: string }).version;
      // With CURRENT_SCHEMA_VERSION at 1.0.0, data defaults to 1.0.0, so no migration needed
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
          pets: 0,
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

  describe('applyTestMigrations', () => {
    it('should apply a single migration', () => {
      const migrations: TestMigration[] = [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrate: (data) => ({
            ...data,
            settings: { ...data.settings, theme: 'dark' as const },
          }),
        },
      ];

      const data = createAppData({ version: '1.0.0' });
      const result = applyTestMigrations(data, migrations, '1.1.0');

      expect(result.version).toBe('1.1.0');
      expect(result.settings.theme).toBe('dark');
      expect(result.lastModified).toBeDefined();
    });

    it('should apply multiple migrations sequentially', () => {
      const migrations: TestMigration[] = [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrate: (data) => ({
            ...data,
            household: { ...data.household, adults: data.household.adults + 1 },
          }),
        },
        {
          fromVersion: '1.1.0',
          toVersion: '1.2.0',
          migrate: (data) => ({
            ...data,
            household: {
              ...data.household,
              children: data.household.children + 1,
            },
          }),
        },
      ];

      const data = createAppData({
        version: '1.0.0',
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 7,
          useFreezer: false,
        },
      });
      const result = applyTestMigrations(data, migrations, '1.2.0');

      expect(result.version).toBe('1.2.0');
      expect(result.household.adults).toBe(3); // 2 + 1
      expect(result.household.children).toBe(1); // 0 + 1
    });

    it('should skip migrations for newer versions', () => {
      const migrations: TestMigration[] = [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrate: (data) => ({
            ...data,
            household: { ...data.household, adults: 999 },
          }),
        },
      ];

      const data = createAppData({
        version: '1.1.0',
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 7,
          useFreezer: false,
        },
      });
      const result = applyTestMigrations(data, migrations, '1.1.0');

      // Migration should not be applied since data is already at 1.1.0
      expect(result.household.adults).toBe(2);
    });

    it('should throw MigrationError when migration function throws', () => {
      const migrations: TestMigration[] = [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrate: () => {
            throw new Error('Migration failed');
          },
        },
      ];

      const data = createAppData({ version: '1.0.0' });

      expect(() => applyTestMigrations(data, migrations, '1.1.0')).toThrow(
        MigrationError,
      );
    });

    it('should include error details in MigrationError', () => {
      const migrations: TestMigration[] = [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrate: () => {
            throw new Error('Specific error message');
          },
        },
      ];

      const data = createAppData({ version: '1.0.0' });

      try {
        applyTestMigrations(data, migrations, '1.1.0');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MigrationError);
        const migrationError = error as MigrationError;
        expect(migrationError.fromVersion).toBe('1.0.0');
        expect(migrationError.toVersion).toBe('1.1.0');
        expect(migrationError.message).toContain('Specific error message');
        expect(migrationError.cause).toBeInstanceOf(Error);
      }
    });

    it('should handle non-Error throws in migration', () => {
      const migrations: TestMigration[] = [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrate: () => {
            throw 'string error'; // Non-Error throw
          },
        },
      ];

      const data = createAppData({ version: '1.0.0' });

      try {
        applyTestMigrations(data, migrations, '1.1.0');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MigrationError);
        const migrationError = error as MigrationError;
        expect(migrationError.message).toContain('Unknown error');
        expect(migrationError.cause).toBeUndefined();
      }
    });

    it('should throw for unsupported versions', () => {
      const migrations: TestMigration[] = [];
      const data = createAppData({ version: '0.1.0' });

      expect(() => applyTestMigrations(data, migrations, '1.0.0')).toThrow(
        MigrationError,
      );
    });

    it('should preserve all data fields through migration', () => {
      const migrations: TestMigration[] = [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          migrate: (data) => ({ ...data }),
        },
      ];

      const data = createAppData({
        version: '1.0.0',
        household: {
          adults: 3,
          children: 2,
          pets: 0,
          supplyDurationDays: 14,
          useFreezer: true,
        },
        items: [],
        customCategories: [],
      });

      const result = applyTestMigrations(data, migrations, '1.1.0');

      expect(result.household.adults).toBe(3);
      expect(result.household.children).toBe(2);
      expect(result.household.supplyDurationDays).toBe(14);
      expect(result.household.useFreezer).toBe(true);
    });

    it('should apply migrations with no applicable migrations', () => {
      const migrations: TestMigration[] = [
        {
          fromVersion: '2.0.0',
          toVersion: '2.1.0',
          migrate: (data) => ({ ...data }),
        },
      ];

      const data = createAppData({ version: '1.0.0' });
      const result = applyTestMigrations(data, migrations, '1.0.0');

      // No migrations applied, but version and lastModified updated
      expect(result.version).toBe('1.0.0');
      expect(result.lastModified).toBeDefined();
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
