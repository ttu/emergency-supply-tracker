import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { defaultI18nMock } from './i18n';
import { faker } from '@faker-js/faker';

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers);

// Seed faker for test runs
// Strategy:
// - Use FAKER_SEED env var if set (for reproducible debugging)
// - Otherwise use random seed per test run (better property-based testing)
// - Seed is logged so failures can be reproduced
// @ts-expect-error - process is available in Vitest Node.js environment
const envSeed: string | undefined = process.env.FAKER_SEED;
const seed = envSeed
  ? Number.parseInt(envSeed, 10)
  : Math.floor(Math.random() * 1000000);

faker.seed(seed);

// Log seed for reproducibility (only in non-CI or when explicitly set)
// @ts-expect-error - process is available in Vitest Node.js environment
const isCI = process.env.CI === 'true';
if (!isCI || envSeed) {
  console.log(
    `[Faker] Using seed: ${seed} (set FAKER_SEED=${seed} to reproduce)`,
  );
}

// Global i18next mock - applied to all tests automatically
// Individual tests can override by calling vi.mock('react-i18next', ...)
// before importing the component under test
vi.mock('react-i18next', () => defaultI18nMock);
