import { extractLanguageFromSearch, isSupportedLanguage } from './urlLanguage';

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
});
