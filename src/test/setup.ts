import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { defaultI18nMock } from './i18n';

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers);

// Global i18next mock - applied to all tests automatically
// Individual tests can override by calling vi.mock('react-i18next', ...)
// before importing the component under test
vi.mock('react-i18next', () => defaultI18nMock);
