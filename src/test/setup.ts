import '@testing-library/jest-dom';
import { defaultI18nMock } from './i18n';

// Global i18next mock - applied to all tests automatically
// Individual tests can override by calling jest.mock('react-i18next', ...)
// before importing the component under test
jest.mock('react-i18next', () => defaultI18nMock);
