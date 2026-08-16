import { afterEach, expect, inject, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { defaultI18nMock } from './i18n';
import { faker } from '@faker-js/faker';
import { reloadInventoryFilters } from '@/features/inventory/hooks/useInventoryFilters';

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers);

// jsdom keeps one localStorage per file, and module-level stores outlive
// individual tests, so anything a component persists would leak into the next
// test and quietly decide its starting state. Each test starts empty.
// (`useInventoryFilters` has no runtime dependencies — the import is free.)
afterEach(() => {
  globalThis.localStorage?.clear();
  reloadInventoryFilters();
});

// Seed faker for test runs
// The seed is generated once in globalSetup.ts and provided to all workers
// This ensures all workers use the same seed for reproducibility
const seed = inject('fakerSeed');
faker.seed(seed);

// Global i18next mock - applied to all tests automatically
// Individual tests can override by calling vi.mock('react-i18next', ...)
// before importing the component under test
vi.mock('react-i18next', () => defaultI18nMock);
