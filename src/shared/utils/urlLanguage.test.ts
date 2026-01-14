import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest';
import {
  extractLanguageFromSearch,
  isSupportedLanguage,
  getLanguageFromUrl,
  clearLanguageFromUrl,
  getInitialLanguage,
  getLanguageFromDomain,
  __DOMAIN_LANGUAGE_MAP__,
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
    it('returns undefined when no lang parameter is present', () => {
      expect(extractLanguageFromSearch('')).toBeUndefined();
      expect(extractLanguageFromSearch('?foo=bar')).toBeUndefined();
    });

    it('returns "en" when lang=en is in the search string', () => {
      expect(extractLanguageFromSearch('?lang=en')).toBe('en');
    });

    it('returns "fi" when lang=fi is in the search string', () => {
      expect(extractLanguageFromSearch('?lang=fi')).toBe('fi');
    });

    it('returns undefined for unsupported language codes', () => {
      expect(extractLanguageFromSearch('?lang=de')).toBeUndefined();
      expect(extractLanguageFromSearch('?lang=sv')).toBeUndefined();
    });

    it('returns undefined for empty lang parameter', () => {
      expect(extractLanguageFromSearch('?lang=')).toBeUndefined();
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
      originalSearch = globalThis.location.search;
    });

    afterEach(() => {
      // Restore original search by navigating
      globalThis.history.replaceState(
        {},
        '',
        globalThis.location.pathname + originalSearch,
      );
    });

    it('returns language from URL when lang param is present', () => {
      globalThis.history.replaceState({}, '', '/?lang=fi');
      expect(getLanguageFromUrl()).toBe('fi');
    });

    it('returns undefined when no lang param in URL', () => {
      globalThis.history.replaceState({}, '', '/');
      expect(getLanguageFromUrl()).toBeUndefined();
    });

    it('returns undefined for unsupported language in URL', () => {
      globalThis.history.replaceState({}, '', '/?lang=de');
      expect(getLanguageFromUrl()).toBeUndefined();
    });

    it('returns en when lang=en in URL', () => {
      globalThis.history.replaceState({}, '', '/?lang=en');
      expect(getLanguageFromUrl()).toBe('en');
    });
  });

  describe('clearLanguageFromUrl', () => {
    let originalSearch: string;
    let replaceStateSpy: MockInstance;

    beforeEach(() => {
      originalSearch = globalThis.location.search;
      replaceStateSpy = vi.spyOn(globalThis.history, 'replaceState');
    });

    afterEach(() => {
      replaceStateSpy.mockRestore();
      globalThis.history.replaceState(
        {},
        '',
        globalThis.location.pathname + originalSearch,
      );
    });

    it('removes lang param and preserves other params', () => {
      globalThis.history.replaceState({}, '', '/?lang=fi&other=value');
      replaceStateSpy.mockClear();

      clearLanguageFromUrl();

      expect(replaceStateSpy).toHaveBeenCalledTimes(1);
      const newUrl = replaceStateSpy.mock.calls[0][2];
      expect(newUrl).not.toContain('lang=');
      expect(newUrl).toContain('other=value');
    });

    it('does not call replaceState when no lang param', () => {
      globalThis.history.replaceState({}, '', '/?other=value');
      replaceStateSpy.mockClear();

      clearLanguageFromUrl();

      expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    it('removes lang param when it is the only param', () => {
      globalThis.history.replaceState({}, '', '/?lang=en');
      replaceStateSpy.mockClear();

      clearLanguageFromUrl();

      expect(replaceStateSpy).toHaveBeenCalledTimes(1);
      const newUrl = replaceStateSpy.mock.calls[0][2];
      expect(newUrl).not.toContain('lang=');
    });
  });

  describe('getLanguageFromDomain', () => {
    let originalHostname: string;

    beforeEach(() => {
      originalHostname = globalThis.location.hostname;
    });

    afterEach(() => {
      // Restore original hostname by navigating
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: originalHostname,
        },
        writable: true,
        configurable: true,
      });
    });

    it('returns undefined when domain is not in mapping', () => {
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: 'example.com',
        },
        writable: true,
        configurable: true,
      });

      expect(getLanguageFromDomain()).toBeUndefined();
    });

    it('returns undefined when hostname is localhost', () => {
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: 'localhost',
        },
        writable: true,
        configurable: true,
      });

      expect(getLanguageFromDomain()).toBeUndefined();
    });

    it('handles single-part hostname', () => {
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: 'localhost',
        },
        writable: true,
        configurable: true,
      });

      expect(getLanguageFromDomain()).toBeUndefined();
    });

    it('handles hostname with less than 2 parts', () => {
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: 'local',
        },
        writable: true,
        configurable: true,
      });

      expect(getLanguageFromDomain()).toBeUndefined();
    });

    it('returns language for exact domain match', () => {
      // Add test mapping
      __DOMAIN_LANGUAGE_MAP__['test-domain.com'] = 'fi';

      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: 'test-domain.com',
        },
        writable: true,
        configurable: true,
      });

      expect(getLanguageFromDomain()).toBe('fi');

      // Cleanup
      delete __DOMAIN_LANGUAGE_MAP__['test-domain.com'];
    });

    it('returns language for subdomain match', () => {
      // Add test mapping
      __DOMAIN_LANGUAGE_MAP__['example.com'] = 'en';

      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: 'www.example.com',
        },
        writable: true,
        configurable: true,
      });

      expect(getLanguageFromDomain()).toBe('en');

      // Cleanup
      delete __DOMAIN_LANGUAGE_MAP__['example.com'];
    });

    it('checks for subdomain matches when exact match fails', () => {
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: 'www.example.com',
        },
        writable: true,
        configurable: true,
      });

      // Since DOMAIN_LANGUAGE_MAP is empty, this will return undefined
      // But we're testing the logic path
      expect(getLanguageFromDomain()).toBeUndefined();
    });

    it('handles hostname with multiple subdomains', () => {
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: 'sub1.sub2.example.com',
        },
        writable: true,
        configurable: true,
      });

      expect(getLanguageFromDomain()).toBeUndefined();
    });
  });

  describe('getInitialLanguage', () => {
    let originalSearch: string;

    beforeEach(() => {
      originalSearch = globalThis.location.search;
    });

    afterEach(() => {
      globalThis.history.replaceState(
        {},
        '',
        globalThis.location.pathname + originalSearch,
      );
    });

    it('returns URL language when present (overrides stored)', () => {
      const originalSearch = globalThis.location.search;
      const originalHref = globalThis.location.href;

      // Mock location to reflect the URL change
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          search: '?lang=fi',
          href:
            globalThis.location.origin +
            globalThis.location.pathname +
            '?lang=fi',
        },
        writable: true,
        configurable: true,
      });
      globalThis.history.replaceState({}, '', '/?lang=fi');

      // URL language 'fi' should override stored 'en'
      expect(getInitialLanguage('en')).toBe('fi');

      // Restore
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          search: originalSearch,
          href: originalHref,
        },
        writable: true,
        configurable: true,
      });
      globalThis.history.replaceState(
        {},
        '',
        globalThis.location.pathname + originalSearch,
      );
    });

    it('returns stored language when no URL parameter', () => {
      globalThis.history.replaceState({}, '', '/');

      expect(getInitialLanguage('fi')).toBe('fi');
    });

    it('returns default "en" when no stored language and no URL param', () => {
      globalThis.history.replaceState({}, '', '/');

      expect(getInitialLanguage()).toBe('en');
      expect(getInitialLanguage(undefined)).toBe('en');
    });

    it('returns default "en" for unsupported URL lang', () => {
      globalThis.history.replaceState({}, '', '/?lang=de');

      expect(getInitialLanguage()).toBe('en');
    });

    it('returns stored language when URL has unsupported lang', () => {
      globalThis.history.replaceState({}, '', '/?lang=sv');

      expect(getInitialLanguage('fi')).toBe('fi');
    });

    it('returns default when URL has empty lang param', () => {
      globalThis.history.replaceState({}, '', '/?lang=');

      expect(getInitialLanguage()).toBe('en');
    });

    it('checks domain language when no URL parameter', () => {
      globalThis.history.replaceState({}, '', '/');
      const originalHostname = globalThis.location.hostname;

      // Add test mapping
      __DOMAIN_LANGUAGE_MAP__['test-domain.fi'] = 'fi';

      // Mock location.hostname
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: 'test-domain.fi',
        },
        writable: true,
        configurable: true,
      });

      // Domain language should be used when no URL parameter
      expect(getInitialLanguage('en')).toBe('fi');
      expect(getInitialLanguage()).toBe('fi');

      // Restore
      delete __DOMAIN_LANGUAGE_MAP__['test-domain.fi'];
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: originalHostname,
        },
        writable: true,
        configurable: true,
      });
    });

    it('prioritizes URL parameter over domain language', () => {
      const originalSearch = globalThis.location.search;
      const originalHostname = globalThis.location.hostname;

      globalThis.history.replaceState({}, '', '/?lang=en');

      // Mock location.hostname (even if domain would map to 'fi')
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: 'tama-sivu.fi',
          search: '?lang=en',
        },
        writable: true,
        configurable: true,
      });

      // URL parameter should take priority
      expect(getInitialLanguage('fi')).toBe('en');

      // Restore
      Object.defineProperty(globalThis, 'location', {
        value: {
          ...globalThis.location,
          hostname: originalHostname,
          search: originalSearch,
        },
        writable: true,
        configurable: true,
      });
      globalThis.history.replaceState(
        {},
        '',
        globalThis.location.pathname + originalSearch,
      );
    });
  });
});
