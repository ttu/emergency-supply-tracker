/**
 * Utility functions for reading and updating the lang query parameter in the URL.
 * Used for hreflang support where ?lang=en and ?lang=fi are used.
 */

const SUPPORTED_LANGUAGES = ['en', 'fi'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Domain-to-language mapping for multi-domain deployments.
 * Maps domain names to their default language.
 * Example: 'tama-sivu.fi' → 'fi', 'this-site.com' → 'en'
 */
const DOMAIN_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  // Add your domain mappings here
  // 'tama-sivu.fi': 'fi',
  // 'this-site.com': 'en',
};

/**
 * Gets the language based on the current domain.
 * Returns undefined if domain is not in the mapping.
 *
 * @returns The language code for the current domain, or undefined.
 */
export function getLanguageFromDomain(): SupportedLanguage | undefined {
  const hostname = window.location.hostname;

  // Check exact match first
  if (hostname in DOMAIN_LANGUAGE_MAP) {
    return DOMAIN_LANGUAGE_MAP[hostname];
  }

  // Check for subdomain matches (e.g., 'www.tama-sivu.fi' matches 'tama-sivu.fi')
  const domainParts = hostname.split('.');
  if (domainParts.length >= 2) {
    const baseDomain = domainParts.slice(-2).join('.');
    if (baseDomain in DOMAIN_LANGUAGE_MAP) {
      return DOMAIN_LANGUAGE_MAP[baseDomain];
    }
  }

  return undefined;
}

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
 * 2. Domain-based detection (if configured)
 * 3. Stored settings (from localStorage)
 * 4. Default language ('en')
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

  const domainLanguage = getLanguageFromDomain();
  if (domainLanguage) {
    return domainLanguage;
  }

  if (storedLanguage && isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  return 'en';
}
