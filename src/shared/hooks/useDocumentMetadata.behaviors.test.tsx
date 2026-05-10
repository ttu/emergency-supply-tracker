/**
 * Mutation-killing tests for useDocumentMetadata.ts
 *
 * Target: ArrayDeclaration L74 [] — the useEffect dependency array [t, i18n.language].
 * If mutated to ["Stryker was here"], the effect would not re-run when language changes.
 * We verify the effect re-runs when the language/translation function changes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentMetadata } from './useDocumentMetadata';

const mockT = vi.fn((key: string) => key);
const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18n,
  }),
}));

describe('useDocumentMetadata mutation tests — useEffect deps', () => {
  let originalTitle: string;
  let originalLang: string;

  beforeEach(() => {
    originalTitle = document.title;
    originalLang = document.documentElement.lang;

    mockT.mockImplementation((key: string) => {
      const lang = mockI18n.language;
      const translations: Record<string, Record<string, string>> = {
        en: {
          'metadata.title': 'Emergency Supply Tracker',
          'metadata.description': 'Track your supplies',
        },
        fi: {
          'metadata.title': 'Hätätarvikelaskuri',
          'metadata.description': 'Seuraa tarvikkeitasi',
        },
      };
      return translations[lang]?.[key] ?? key;
    });
    mockI18n.language = 'en';
  });

  afterEach(() => {
    document.title = originalTitle;
    document.documentElement.lang = originalLang;
    vi.clearAllMocks();
  });

  it('updates document title when language changes between renders', () => {
    const { rerender } = renderHook(() => useDocumentMetadata());
    expect(document.title).toBe('Emergency Supply Tracker');

    // Change language
    mockI18n.language = 'fi';
    rerender();

    // If deps array is mutated, the effect won't re-run and title stays English
    expect(document.title).toBe('Hätätarvikelaskuri');
  });

  it('updates HTML lang attribute when language changes', () => {
    const { rerender } = renderHook(() => useDocumentMetadata());
    expect(document.documentElement.lang).toBe('en');

    mockI18n.language = 'fi';
    rerender();

    expect(document.documentElement.lang).toBe('fi');
  });
});
