/**
 * Centralized i18next mock utilities for testing
 *
 * This module provides a default mock and a configurable factory for tests
 * that need specific translations or i18n behavior.
 */

import { vi, type Mock } from 'vitest';

type TranslationParams = Record<string, unknown>;

/**
 * Interpolates template strings with parameters
 * Supports {{param}} syntax used by i18next
 */
function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    String(params[key] ?? `{{${key}}}`),
  );
}

/**
 * Default i18next mock that returns translation keys
 * This is automatically applied in setup.ts as the global mock
 */
export const defaultI18nMock = {
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
  // withTranslation HOC - returns a function that wraps components
  withTranslation: () => (Component: unknown) => Component,
  // Trans component - just returns children
  Trans: ({ children }: { children?: unknown }) => children,
  // I18nextProvider - just returns children
  I18nextProvider: ({ children }: { children?: unknown }) => children,
};

/**
 * Options for creating a custom i18next mock
 */
export interface I18nMockOptions {
  /**
   * Translation key-value pairs
   * @example { 'dashboard.title': 'Dashboard', 'app.name': 'My App' }
   */
  translations?: Record<string, string>;

  /**
   * Namespace-based translations for multi-namespace support
   * @example { categories: { 'food': 'Food' }, products: { 'water': 'Water' } }
   */
  namespaces?: Record<string, Record<string, string>>;

  /**
   * Current language code
   * @default 'en'
   */
  language?: string;

  /**
   * Mock function for i18n.changeLanguage
   * @default vi.fn().mockResolvedValue(undefined)
   */
  changeLanguage?: Mock;
}

/**
 * Creates a configurable i18next mock for tests needing specific translations
 *
 * @example
 * // Simple translations
 * vi.mock('react-i18next', () => require('@/test/i18n').createI18nMock({
 *   translations: {
 *     'dashboard.title': 'Dashboard',
 *     'dashboard.subtitle': 'Welcome, {{name}}!',
 *   },
 * }));
 *
 * @example
 * // With namespace support
 * vi.mock('react-i18next', () => require('@/test/i18n').createI18nMock({
 *   namespaces: {
 *     categories: { 'food': 'Food', 'water': 'Water' },
 *     products: { 'bottled-water': 'Bottled Water' },
 *   },
 * }));
 *
 * @example
 * // With custom changeLanguage mock
 * const mockChangeLanguage = vi.fn();
 * vi.mock('react-i18next', () => require('@/test/i18n').createI18nMock({
 *   changeLanguage: mockChangeLanguage,
 * }));
 */
export function createI18nMock(options: I18nMockOptions = {}) {
  const {
    translations = {},
    namespaces,
    language = 'en',
    changeLanguage = vi.fn().mockResolvedValue(undefined),
  } = options;

  return {
    useTranslation: () => ({
      t: (key: string, params?: TranslationParams) => {
        // Check namespace lookup (params.ns)
        if (namespaces && params?.ns && typeof params.ns === 'string') {
          const ns = namespaces[params.ns];
          if (ns && ns[key]) {
            return interpolate(ns[key], params);
          }
        }

        // Check direct translations
        if (translations[key]) {
          return interpolate(translations[key], params);
        }

        // Return key as fallback (standard i18next behavior)
        return key;
      },
      i18n: {
        language,
        changeLanguage,
      },
    }),
    // withTranslation HOC - returns a function that wraps components
    withTranslation: () => (Component: unknown) => Component,
    // Trans component - just returns children
    Trans: ({ children }: { children?: unknown }) => children,
    // I18nextProvider - just returns children
    I18nextProvider: ({ children }: { children?: unknown }) => children,
  };
}
