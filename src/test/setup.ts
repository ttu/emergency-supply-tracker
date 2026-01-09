import { expect, inject, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { defaultI18nMock } from './i18n';
import { faker } from '@faker-js/faker';

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers);

// Seed faker for test runs
// The seed is generated once in globalSetup.ts and provided to all workers
// This ensures all workers use the same seed for reproducibility
const seed = inject('fakerSeed');
faker.seed(seed);

// Global i18next mock - applied to all tests automatically
// Individual tests can override by calling vi.mock('react-i18next', ...)
// before importing the component under test
vi.mock('react-i18next', () => defaultI18nMock);
