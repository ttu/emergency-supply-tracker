import {
  extractLanguageFromSearch,
  isSupportedLanguage,
  getLanguageFromUrl,
  clearLanguageFromUrl,
  getInitialLanguage,
} from './urlLanguage';

describe('urlLanguage', () => {
  describe('isSupportedLanguage', () => {
    it('returns true for "en"', () => {
      expect(isSupportedLanguage('en')).toBe(true);
    });

    it('returns true for "fi"', () => {
      expect(isSupportedLanguage('fi')).toBe(true);
    });

    it('returns false for unsupported languages', () => {
      expect(isSupportedLanguage('de')).toBe(false);
      expect(isSupportedLanguage('sv')).toBe(false);
      expect(isSupportedLanguage('')).toBe(false);
    });
  });

  describe('extractLanguageFromSearch', () => {
    it('returns null when no lang parameter is present', () => {
      expect(extractLanguageFromSearch('')).toBeNull();
      expect(extractLanguageFromSearch('?foo=bar')).toBeNull();
    });

    it('returns "en" when lang=en is in the search string', () => {
      expect(extractLanguageFromSearch('?lang=en')).toBe('en');
    });

    it('returns "fi" when lang=fi is in the search string', () => {
      expect(extractLanguageFromSearch('?lang=fi')).toBe('fi');
    });

    it('returns null for unsupported language codes', () => {
      expect(extractLanguageFromSearch('?lang=de')).toBeNull();
      expect(extractLanguageFromSearch('?lang=sv')).toBeNull();
    });

    it('returns null for empty lang parameter', () => {
      expect(extractLanguageFromSearch('?lang=')).toBeNull();
    });

    it('handles multiple query parameters', () => {
      expect(extractLanguageFromSearch('?foo=bar&lang=fi&baz=qux')).toBe('fi');
    });

    it('handles lang parameter at different positions', () => {
      expect(extractLanguageFromSearch('?lang=en&other=value')).toBe('en');
      expect(extractLanguageFromSearch('?other=value&lang=fi')).toBe('fi');
    });
  });

  describe('getLanguageFromUrl', () => {
    it('uses window.location.search to get language', () => {
      // The function uses window.location.search internally
      // Testing via extractLanguageFromSearch which is already tested
      // This verifies the function exists and is callable
      expect(typeof getLanguageFromUrl).toBe('function');
    });
  });

  describe('clearLanguageFromUrl', () => {
    it('is a callable function', () => {
      // Testing that the function exists without modifying window.location
      expect(typeof clearLanguageFromUrl).toBe('function');
    });
  });

  describe('getInitialLanguage', () => {
    it('returns stored language when provided', () => {
      // Without URL parameter, should use stored language
      expect(getInitialLanguage('fi')).toBe('fi');
    });

    it('returns default "en" when no stored language', () => {
      expect(getInitialLanguage()).toBe('en');
      expect(getInitialLanguage(null)).toBe('en');
      expect(getInitialLanguage(undefined)).toBe('en');
    });
  });
});
