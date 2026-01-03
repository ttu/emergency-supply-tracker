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
    let originalSearch: string;

    beforeEach(() => {
      originalSearch = window.location.search;
    });

    afterEach(() => {
      // Restore original search by navigating
      window.history.replaceState(
        {},
        '',
        window.location.pathname + originalSearch,
      );
    });

    it('returns language from URL when lang param is present', () => {
      window.history.replaceState({}, '', '/?lang=fi');
      expect(getLanguageFromUrl()).toBe('fi');
    });

    it('returns null when no lang param in URL', () => {
      window.history.replaceState({}, '', '/');
      expect(getLanguageFromUrl()).toBeNull();
    });

    it('returns null for unsupported language in URL', () => {
      window.history.replaceState({}, '', '/?lang=de');
      expect(getLanguageFromUrl()).toBeNull();
    });

    it('returns en when lang=en in URL', () => {
      window.history.replaceState({}, '', '/?lang=en');
      expect(getLanguageFromUrl()).toBe('en');
    });
  });

  describe('clearLanguageFromUrl', () => {
    let originalSearch: string;
    let replaceStateSpy: jest.SpyInstance;

    beforeEach(() => {
      originalSearch = window.location.search;
      replaceStateSpy = jest.spyOn(window.history, 'replaceState');
    });

    afterEach(() => {
      replaceStateSpy.mockRestore();
      window.history.replaceState(
        {},
        '',
        window.location.pathname + originalSearch,
      );
    });

    it('removes lang param and preserves other params', () => {
      window.history.replaceState({}, '', '/?lang=fi&other=value');
      replaceStateSpy.mockClear();

      clearLanguageFromUrl();

      expect(replaceStateSpy).toHaveBeenCalledTimes(1);
      const newUrl = replaceStateSpy.mock.calls[0][2];
      expect(newUrl).not.toContain('lang=');
      expect(newUrl).toContain('other=value');
    });

    it('does not call replaceState when no lang param', () => {
      window.history.replaceState({}, '', '/?other=value');
      replaceStateSpy.mockClear();

      clearLanguageFromUrl();

      expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    it('removes lang param when it is the only param', () => {
      window.history.replaceState({}, '', '/?lang=en');
      replaceStateSpy.mockClear();

      clearLanguageFromUrl();

      expect(replaceStateSpy).toHaveBeenCalledTimes(1);
      const newUrl = replaceStateSpy.mock.calls[0][2];
      expect(newUrl).not.toContain('lang=');
    });
  });

  describe('getInitialLanguage', () => {
    let originalSearch: string;

    beforeEach(() => {
      originalSearch = window.location.search;
    });

    afterEach(() => {
      window.history.replaceState(
        {},
        '',
        window.location.pathname + originalSearch,
      );
    });

    it('returns URL language when present (overrides stored)', () => {
      window.history.replaceState({}, '', '/?lang=fi');

      // URL language 'fi' should override stored 'en'
      expect(getInitialLanguage('en')).toBe('fi');
    });

    it('returns stored language when no URL parameter', () => {
      window.history.replaceState({}, '', '/');

      expect(getInitialLanguage('fi')).toBe('fi');
    });

    it('returns default "en" when no stored language and no URL param', () => {
      window.history.replaceState({}, '', '/');

      expect(getInitialLanguage()).toBe('en');
      expect(getInitialLanguage(null)).toBe('en');
      expect(getInitialLanguage(undefined)).toBe('en');
    });

    it('returns default "en" for unsupported URL lang', () => {
      window.history.replaceState({}, '', '/?lang=de');

      expect(getInitialLanguage()).toBe('en');
    });

    it('returns stored language when URL has unsupported lang', () => {
      window.history.replaceState({}, '', '/?lang=sv');

      expect(getInitialLanguage('fi')).toBe('fi');
    });

    it('returns default when URL has empty lang param', () => {
      window.history.replaceState({}, '', '/?lang=');

      expect(getInitialLanguage()).toBe('en');
    });
  });
});
