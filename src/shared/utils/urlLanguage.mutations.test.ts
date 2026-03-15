import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
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
    afterEach(() => {
      delete __DOMAIN_LANGUAGE_MAP__['exact-match.fi'];
      delete __DOMAIN_LANGUAGE_MAP__['sub-match.com'];
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
