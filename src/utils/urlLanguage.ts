/**
 * Utility functions for reading and updating the lang query parameter in the URL.
 * Used for hreflang support where ?lang=en and ?lang=fi are used.
 */

const SUPPORTED_LANGUAGES = ['en', 'fi'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Checks if a language code is supported.
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

/**
 * Extracts the language from a URL search string.
 * @param search The URL search string (e.g., "?lang=en&foo=bar")
 * @returns The language code if valid, or null if not present or invalid.
 */
export function extractLanguageFromSearch(
  search: string,
): SupportedLanguage | null {
  const params = new URLSearchParams(search);
  const lang = params.get('lang');

  if (lang && isSupportedLanguage(lang)) {
    return lang;
  }

  return null;
}

/**
 * Gets the language from the URL query parameter.
 * @returns The language code if valid, or null if not present or invalid.
 */
export function getLanguageFromUrl(): SupportedLanguage | null {
  return extractLanguageFromSearch(window.location.search);
}

/**
 * Updates the URL with the specified language parameter.
 * Uses replaceState to avoid adding to browser history.
 * @param language The language code to set in the URL.
 */
export function setLanguageInUrl(language: SupportedLanguage): void {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', language);
  window.history.replaceState({}, '', url.toString());
}

/**
 * Determines the initial language to use based on priority:
 * 1. URL query parameter (?lang=xx)
 * 2. Stored settings (from localStorage)
 * 3. Default language ('en')
 *
 * @param storedLanguage The language from localStorage settings, if any.
 * @returns The language to use for initialization.
 */
export function getInitialLanguage(
  storedLanguage?: SupportedLanguage | null,
): SupportedLanguage {
  const urlLanguage = getLanguageFromUrl();

  if (urlLanguage) {
    return urlLanguage;
  }

  if (storedLanguage && isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  return 'en';
}
