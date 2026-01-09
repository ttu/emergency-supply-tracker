/**
 * Schema Migration System
 *
 * This module handles data migrations when the AppData schema changes.
 * Each migration transforms data from one schema version to the next.
 *
 * ## Adding a New Migration
 *
 * 1. Increment CURRENT_SCHEMA_VERSION
 * 2. Add a migration function: migrateVxToVy(data)
 * 3. Register it in MIGRATIONS array
 * 4. Update tests in migrations.test.ts
 *
 * ## Version Format
 *
 * Schema versions use semantic versioning (major.minor.patch):
 * - Major: Breaking changes requiring data transformation
 * - Minor: New optional fields (backward compatible)
 * - Patch: Bug fixes in migration logic
 *
 * ## Migration Rules
 *
 * - Migrations must be idempotent (safe to run multiple times)
 * - Migrations must handle missing/undefined fields gracefully
 * - Never delete user data; transform or archive it
 * - Each migration should be small and focused
 * - Test migrations with real-world data samples
 */

import type { AppData } from '@/shared/types';

/**
 * Current schema version.
 * Increment this when making schema changes that require migration.
 */
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Minimum supported schema version for migration.
 * Data older than this cannot be automatically migrated.
 */
export const MIN_SUPPORTED_VERSION = '1.0.0';

/**
 * Migration function type.
 * Takes data at version N and returns data at version N+1.
 */
type MigrationFn = (data: AppData) => AppData;

/**
 * Migration definition with source and target versions.
 */
interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: MigrationFn;
}

/**
 * Registered migrations in order.
 * Each migration transforms data from one version to the next.
 *
 * Example of adding a migration for version 1.1.0:
 *
 * ```typescript
 * {
 *   fromVersion: '1.0.0',
 *   toVersion: '1.1.0',
 *   migrate: migrateV100ToV110,
 * },
 * ```
 */
const MIGRATIONS: Migration[] = [
  // Add migrations here as schema evolves
  // Example:
  // {
  //   fromVersion: '1.0.0',
  //   toVersion: '1.1.0',
  //   migrate: migrateV100ToV110,
  // },
];

/**
 * Parses a semantic version string into components.
 */
const VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;

function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const match = VERSION_REGEX.exec(version);
  if (!match) {
    throw new Error(`Invalid version format: ${version}. Expected x.y.z`);
  }
  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  };
}

/**
 * Compares two semantic versions.
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vA.major < vB.major ? -1 : 1;
  if (vA.minor !== vB.minor) return vA.minor < vB.minor ? -1 : 1;
  if (vA.patch !== vB.patch) return vA.patch < vB.patch ? -1 : 1;
  return 0;
}

/**
 * Checks if a version is supported for migration.
 */
export function isVersionSupported(version: string): boolean {
  try {
    return compareVersions(version, MIN_SUPPORTED_VERSION) >= 0;
  } catch {
    return false;
  }
}

/**
 * Checks if data needs migration to current schema version.
 */
export function needsMigration(data: AppData): boolean {
  const dataVersion = data.version || '1.0.0';
  return compareVersions(dataVersion, CURRENT_SCHEMA_VERSION) < 0;
}

/**
 * Error thrown when migration fails.
 */
export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly fromVersion: string,
    public readonly toVersion: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}

/**
 * Migrates AppData from its current version to the latest schema version.
 *
 * @param data - AppData to migrate
 * @returns Migrated AppData at current schema version
 * @throws MigrationError if migration fails or version is unsupported
 *
 * @example
 * ```typescript
 * const oldData = getAppData(); // version 1.0.0
 * const newData = migrateToCurrentVersion(oldData); // version 1.1.0
 * saveAppData(newData);
 * ```
 */
/**
 * Validates that a version is supported for migration.
 * @throws MigrationError if version is not supported
 */
function validateVersionSupport(version: string): void {
  if (!isVersionSupported(version)) {
    throw new MigrationError(
      `Schema version ${version} is not supported. Minimum supported version is ${MIN_SUPPORTED_VERSION}.`,
      version,
      CURRENT_SCHEMA_VERSION,
    );
  }
}

/**
 * Applies a single migration to the data.
 * @throws MigrationError if migration fails
 */
function applyMigration(
  data: AppData,
  migration: Migration,
): { data: AppData; newVersion: string } {
  try {
    const migratedData = migration.migrate(data);
    migratedData.version = migration.toVersion;
    return { data: migratedData, newVersion: migration.toVersion };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const cause = error instanceof Error ? error : undefined;
    throw new MigrationError(
      `Migration from ${migration.fromVersion} to ${migration.toVersion} failed: ${message}`,
      migration.fromVersion,
      migration.toVersion,
      cause,
    );
  }
}

/**
 * Finds migrations that need to be applied for a given version.
 */
function findApplicableMigrations(fromVersion: string): Migration[] {
  const applicable: Migration[] = [];
  let currentVersion = fromVersion;

  for (const migration of MIGRATIONS) {
    if (compareVersions(currentVersion, migration.fromVersion) === 0) {
      applicable.push(migration);
      currentVersion = migration.toVersion;
    }
  }

  return applicable;
}

/**
 * Applies a sequence of migrations to the data.
 */
function applyMigrations(data: AppData, migrations: Migration[]): AppData {
  let currentData = data;

  for (const migration of migrations) {
    const result = applyMigration(currentData, migration);
    currentData = result.data;
  }

  return currentData;
}

/**
 * Finalizes migrated data by updating version and timestamp.
 */
function finalizeMigration(data: AppData): AppData {
  return {
    ...data,
    version: CURRENT_SCHEMA_VERSION,
    lastModified: new Date().toISOString(),
  };
}

export function migrateToCurrentVersion(data: AppData): AppData {
  const currentVersion = data.version || '1.0.0';

  validateVersionSupport(currentVersion);

  if (!needsMigration(data)) {
    return data;
  }

  const migrations = findApplicableMigrations(currentVersion);
  const migratedData =
    migrations.length > 0
      ? applyMigrations({ ...data }, migrations)
      : { ...data };

  return finalizeMigration(migratedData);
}

/**
 * Gets a list of migrations that will be applied for a given version.
 * Useful for showing users what changes will be made.
 */
export function getMigrationPath(
  fromVersion: string,
): { from: string; to: string }[] {
  const path: { from: string; to: string }[] = [];
  let currentVersion = fromVersion;

  for (const migration of MIGRATIONS) {
    if (
      compareVersions(currentVersion, migration.fromVersion) === 0 &&
      compareVersions(currentVersion, CURRENT_SCHEMA_VERSION) < 0
    ) {
      path.push({ from: migration.fromVersion, to: migration.toVersion });
      currentVersion = migration.toVersion;
    }
  }

  return path;
}

// =============================================================================
// MIGRATION FUNCTIONS
// =============================================================================
// Add migration functions below as schema evolves.
// Each function should be pure and handle edge cases gracefully.
//
// Example migration for adding a new required field:
//
// function migrateV100ToV110(data: AppData): AppData {
//   return {
//     ...data,
//     newField: data.newField ?? 'default-value',
//   };
// }
//
// Example migration for renaming a field:
//
// function migrateV110ToV120(data: AppData): AppData {
//   const { oldFieldName, ...rest } = data as AppData & { oldFieldName?: string };
//   return {
//     ...rest,
//     newFieldName: oldFieldName ?? 'default',
//   };
// }
// =============================================================================

// =============================================================================
// TEST UTILITIES
// =============================================================================
// These exports are for testing migration logic with mock migrations.
// They should not be used in production code.

/**
 * Migration definition for testing.
 * @internal - exported for testing only
 */
export interface TestMigration {
  fromVersion: string;
  toVersion: string;
  migrate: MigrationFn;
}

/**
 * Applies a sequence of test migrations to data.
 * @internal - exported for testing only
 */
export function applyTestMigrations(
  data: AppData,
  migrations: TestMigration[],
  targetVersion: string,
): AppData {
  const currentVersion = data.version || '1.0.0';

  validateVersionSupport(currentVersion);

  // Find applicable migrations
  const applicable: TestMigration[] = [];
  let version = currentVersion;

  for (const migration of migrations) {
    if (compareVersions(version, migration.fromVersion) === 0) {
      applicable.push(migration);
      version = migration.toVersion;
    }
  }

  // Apply migrations
  let currentData = { ...data };
  for (const migration of applicable) {
    const result = applyMigration(currentData, migration);
    currentData = result.data;
  }

  // Finalize
  return {
    ...currentData,
    version: targetVersion,
    lastModified: new Date().toISOString(),
  };
}
