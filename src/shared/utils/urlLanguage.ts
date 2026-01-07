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
 * @returns The language code if valid, or undefined if not present or invalid.
 */
export function extractLanguageFromSearch(
  search: string,
): SupportedLanguage | undefined {
  const params = new URLSearchParams(search);
  const lang = params.get('lang');

  if (lang && isSupportedLanguage(lang)) {
    return lang;
  }

  return undefined;
}

/**
 * Gets the language from the URL query parameter.
 * @returns The language code if valid, or undefined if not present or invalid.
 */
export function getLanguageFromUrl(): SupportedLanguage | undefined {
  return extractLanguageFromSearch(window.location.search);
}

/**
 * Removes the lang parameter from the URL.
 * Uses replaceState to avoid adding to browser history.
 */
export function clearLanguageFromUrl(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.has('lang')) {
    url.searchParams.delete('lang');
    window.history.replaceState({}, '', url.toString());
  }
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
  storedLanguage?: SupportedLanguage,
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
