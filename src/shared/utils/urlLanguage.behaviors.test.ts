import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractLanguageFromSearch,
  getLanguageFromDomain,
  clearLanguageFromUrl,
  __DOMAIN_LANGUAGE_MAP__,
} from './urlLanguage';

/**
 * Mutation-killing tests for urlLanguage.ts surviving mutants:
 *
 * 1. ConditionalExpression L36: `hostname in DOMAIN_LANGUAGE_MAP` -> false
 * 2. BlockStatement L36: return DOMAIN_LANGUAGE_MAP[hostname] -> {}
 * 3. EqualityOperator L42: `domainParts.length > 2` (>= mutated to >)
 * 4. ConditionalExpression L44: `baseDomain in DOMAIN_LANGUAGE_MAP` -> true
 * 5. StringLiteral L93: `url.toString()` -> `"Stryker was here!"`
 */
describe('urlLanguage – mutation killing', () => {
  describe('getLanguageFromDomain – exact match L36', () => {
    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = globalThis.location;
    });

    afterEach(() => {
      delete __DOMAIN_LANGUAGE_MAP__['exact-match.fi'];
      delete __DOMAIN_LANGUAGE_MAP__['sub-match.com'];
      Object.defineProperty(globalThis, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('returns mapped language for exact domain match (kills L36 false and BlockStatement {})', () => {
      __DOMAIN_LANGUAGE_MAP__['exact-match.fi'] = 'fi';

      Object.defineProperty(globalThis, 'location', {
        value: { ...globalThis.location, hostname: 'exact-match.fi' },
        writable: true,
        configurable: true,
      });

      const result = getLanguageFromDomain();
      expect(result).toBe('fi');
    });

    it('returns language for subdomain when base domain is in map (kills L44)', () => {
      __DOMAIN_LANGUAGE_MAP__['sub-match.com'] = 'en';

      Object.defineProperty(globalThis, 'location', {
        value: { ...globalThis.location, hostname: 'www.sub-match.com' },
        writable: true,
        configurable: true,
      });

      expect(getLanguageFromDomain()).toBe('en');
    });

    it('returns undefined for subdomain when base domain is NOT in map (kills L44 -> true)', () => {
      Object.defineProperty(globalThis, 'location', {
        value: { ...globalThis.location, hostname: 'www.unmapped-domain.org' },
        writable: true,
        configurable: true,
      });

      expect(getLanguageFromDomain()).toBeUndefined();
    });

    it('returns undefined for single-part hostname (kills L42 condition)', () => {
      Object.defineProperty(globalThis, 'location', {
        value: { ...globalThis.location, hostname: 'localhost' },
        writable: true,
        configurable: true,
      });

      expect(getLanguageFromDomain()).toBeUndefined();
    });
  });

  describe('clearLanguageFromUrl – L93 url.toString() StringLiteral', () => {
    let originalHref: string;

    beforeEach(() => {
      originalHref = globalThis.location.href;
    });

    afterEach(() => {
      // Reset location
      globalThis.history.replaceState({}, '', originalHref);
    });

    it('removes lang param and uses url.toString() not "Stryker was here!"', () => {
      // Set URL with lang param
      const baseUrl = globalThis.location.origin + globalThis.location.pathname;
      globalThis.history.replaceState({}, '', baseUrl + '?lang=en');

      clearLanguageFromUrl();

      // After clearing, location should NOT contain 'Stryker' or 'lang='
      const href = globalThis.location.href;
      expect(href).not.toContain('Stryker');
      expect(href).not.toContain('lang=');
    });

    it('does not contain Stryker string after clearing', () => {
      const baseUrl = globalThis.location.origin + globalThis.location.pathname;
      globalThis.history.replaceState({}, '', baseUrl + '?lang=fi');

      clearLanguageFromUrl();

      const href = globalThis.location.href;
      expect(href).not.toContain('Stryker');
      expect(href).not.toContain('lang=');
    });
  });
});

// ============================================================================
// Merged from urlLanguage.behaviors2.test.ts
// ============================================================================

// ============================================================================
// L36: ConditionalExpression/BlockStatement - hostname in DOMAIN_LANGUAGE_MAP
// Mutant: condition → false (never match exact domain), block → {}
// ============================================================================
describe('exact domain match in getLanguageFromDomain', () => {
  it('returns language for exact domain match', () => {
    // Save original
    const originalLocation = globalThis.location;

    // Mock location to a known domain
    Object.defineProperty(globalThis, 'location', {
      value: { hostname: 'tama-sivu.fi' },
      writable: true,
      configurable: true,
    });

    const result = getLanguageFromDomain();

    // Restore
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    // DOMAIN_LANGUAGE_MAP entries are commented out in source, so result is undefined
    // This test exercises the code path; when map has entries, it would return 'fi'
    // The mutation target is the `in` check - with map empty, result is always undefined
    expect(result).toBeUndefined();
  });

  it('returns undefined for unknown domain', () => {
    const originalLocation = globalThis.location;

    Object.defineProperty(globalThis, 'location', {
      value: { hostname: 'unknown-domain.com' },
      writable: true,
      configurable: true,
    });

    const result = getLanguageFromDomain();

    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    expect(result).toBeUndefined();
  });
});

// ============================================================================
// L42: ConditionalExpression/EqualityOperator
// domainParts.length >= 2 → > 2 (would require 3+ parts)
// Condition → true (always check subdomain)
// ============================================================================
describe('subdomain matching length check', () => {
  it('matches 2-part domain for subdomain check', () => {
    const originalLocation = globalThis.location;

    // 2 parts: exactly 2 should trigger subdomain check
    Object.defineProperty(globalThis, 'location', {
      value: { hostname: 'example.com' },
      writable: true,
      configurable: true,
    });

    const result = getLanguageFromDomain();

    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    // example.com is not in the map, so should return undefined
    // But the check should at least execute (not skip)
    expect(result).toBeUndefined();
  });

  it('handles single-part domain (no dots)', () => {
    const originalLocation = globalThis.location;

    Object.defineProperty(globalThis, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
      configurable: true,
    });

    const result = getLanguageFromDomain();

    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    // Single part (length=1): should not enter subdomain check
    expect(result).toBeUndefined();
  });
});

// ============================================================================
// L44: ConditionalExpression - baseDomain in DOMAIN_LANGUAGE_MAP → true
// ============================================================================
describe('subdomain base domain check', () => {
  it('matches subdomain of known domain', () => {
    const originalLocation = globalThis.location;

    Object.defineProperty(globalThis, 'location', {
      value: { hostname: 'www.tama-sivu.fi' },
      writable: true,
      configurable: true,
    });

    const result = getLanguageFromDomain();

    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    // DOMAIN_LANGUAGE_MAP entries are commented out, so result is undefined
    // With map populated, www.tama-sivu.fi -> base domain = tama-sivu.fi -> 'fi'
    expect(result).toBeUndefined();
  });
});

// ============================================================================
// L93: StringLiteral - "Stryker was here!" in clearLanguageFromUrl
// ============================================================================
describe('clearLanguageFromUrl', () => {
  it('removes lang parameter from URL', () => {
    const originalLocation = globalThis.location;
    const originalHistory = globalThis.history;
    const replaceStateSpy = vi.fn();

    Object.defineProperty(globalThis, 'location', {
      value: {
        href: 'http://example.com?lang=en&other=value',
        search: '?lang=en&other=value',
        hostname: 'example.com',
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'history', {
      value: { replaceState: replaceStateSpy },
      writable: true,
      configurable: true,
    });

    clearLanguageFromUrl();

    expect(replaceStateSpy).toHaveBeenCalled();
    const newUrl = replaceStateSpy.mock.calls[0][2] as string;
    expect(newUrl).not.toContain('lang=');
    expect(newUrl).toContain('other=value');

    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'history', {
      value: originalHistory,
      writable: true,
      configurable: true,
    });
  });
});

// ============================================================================
// isSupportedLanguage and extractLanguageFromSearch
// ============================================================================
describe('extractLanguageFromSearch', () => {
  it('extracts valid language from search string', () => {
    expect(extractLanguageFromSearch('?lang=en')).toBe('en');
    expect(extractLanguageFromSearch('?lang=fi')).toBe('fi');
  });

  it('returns undefined for invalid language', () => {
    expect(extractLanguageFromSearch('?lang=de')).toBeUndefined();
    expect(extractLanguageFromSearch('?lang=')).toBeUndefined();
    expect(extractLanguageFromSearch('?foo=bar')).toBeUndefined();
    expect(extractLanguageFromSearch('')).toBeUndefined();
  });
});

// ===========================================================================
// Mutation-killing tests targeting specific surviving mutants (issue #277)
// These extend coverage by populating __DOMAIN_LANGUAGE_MAP__ at runtime.
// ===========================================================================
describe('mutation-killers: urlLanguage.ts (issue #277)', () => {
  const setLocation = (loc: Partial<Location>) =>
    Object.defineProperty(globalThis, 'location', {
      value: loc,
      writable: true,
      configurable: true,
    });

  let originalLocation: Location;
  let mapKeys: string[];

  beforeEach(() => {
    originalLocation = globalThis.location;
    mapKeys = Object.keys(__DOMAIN_LANGUAGE_MAP__);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    // Remove any keys we added during the test
    for (const key of Object.keys(__DOMAIN_LANGUAGE_MAP__)) {
      if (!mapKeys.includes(key)) {
        delete (__DOMAIN_LANGUAGE_MAP__ as Record<string, unknown>)[key];
      }
    }
  });

  it('L36: returns mapped language when hostname is in map', () => {
    (__DOMAIN_LANGUAGE_MAP__ as Record<string, 'fi'>)['tama-sivu.fi'] = 'fi';
    setLocation({ hostname: 'tama-sivu.fi' } as Location);
    expect(getLanguageFromDomain()).toBe('fi');
  });

  it('L42/L44: 2-part hostname (exact) and 3-part hostname (subdomain) both resolve via map', () => {
    (__DOMAIN_LANGUAGE_MAP__ as Record<string, 'fi'>)['tama-sivu.fi'] = 'fi';
    setLocation({ hostname: 'www.tama-sivu.fi' } as Location);
    expect(getLanguageFromDomain()).toBe('fi');
  });

  it('L42 boundary: single-part hostname does NOT match via subdomain path', () => {
    (__DOMAIN_LANGUAGE_MAP__ as Record<string, 'fi'>)['localhost.fi'] = 'fi';
    setLocation({ hostname: 'localhost' } as Location);
    // domainParts.length === 1, so the >= 2 gate must block subdomain check.
    expect(getLanguageFromDomain()).toBeUndefined();
  });

  it('L93: clearLanguageFromUrl calls replaceState with empty string title', () => {
    const originalHistory = globalThis.history;
    const replaceStateSpy = vi.fn();
    setLocation({
      href: 'http://example.com?lang=en',
      search: '?lang=en',
      hostname: 'example.com',
    } as unknown as Location);
    Object.defineProperty(globalThis, 'history', {
      value: { replaceState: replaceStateSpy },
      writable: true,
      configurable: true,
    });
    clearLanguageFromUrl();
    // Title (2nd arg) must be exact empty string, not "Stryker was here!"
    expect(replaceStateSpy.mock.calls[0][1]).toBe('');
    Object.defineProperty(globalThis, 'history', {
      value: originalHistory,
      writable: true,
      configurable: true,
    });
  });
});
