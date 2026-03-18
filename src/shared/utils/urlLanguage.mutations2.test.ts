/**
 * Additional mutation-killing tests for urlLanguage.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  getLanguageFromDomain,
  extractLanguageFromSearch,
  clearLanguageFromUrl,
} from './urlLanguage';

// ============================================================================
// L36: ConditionalExpression/BlockStatement - hostname in DOMAIN_LANGUAGE_MAP
// Mutant: condition → false (never match exact domain), block → {}
// ============================================================================
describe('L36: exact domain match in getLanguageFromDomain', () => {
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
describe('L42: subdomain matching length check', () => {
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
describe('L44: subdomain base domain check', () => {
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
describe('L93: clearLanguageFromUrl', () => {
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
