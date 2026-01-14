import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentMetadata } from './useDocumentMetadata';

// Mock react-i18next at module level
const mockT = vi.fn((key: string) => key);
const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18n,
  }),
}));

describe('useDocumentMetadata', () => {
  let mockMetaDescription: HTMLMetaElement;
  let mockMetaKeywords: HTMLMetaElement;
  let mockOgTitle: HTMLMetaElement;
  let mockOgDescription: HTMLMetaElement;
  let mockTwitterTitle: HTMLMetaElement;
  let mockTwitterDescription: HTMLMetaElement;
  let mockJsonLdScript: HTMLScriptElement;
  let originalTitle: string;
  let originalLang: string;

  beforeEach(() => {
    // Save original values
    originalTitle = document.title;
    originalLang = document.documentElement.lang;

    // Reset mocks
    mockT.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'metadata.title': 'Test Title',
        'metadata.description': 'Test Description',
        'metadata.keywords': 'test, keywords',
        'metadata.ogTitle': 'OG Test Title',
        'metadata.ogDescription': 'OG Test Description',
        'metadata.twitterTitle': 'Twitter Test Title',
        'metadata.twitterDescription': 'Twitter Test Description',
      };
      return translations[key] || key;
    });
    mockI18n.language = 'en';

    // Create mock meta elements
    mockMetaDescription = document.createElement('meta');
    mockMetaDescription.name = 'description';
    document.head.appendChild(mockMetaDescription);

    mockMetaKeywords = document.createElement('meta');
    mockMetaKeywords.name = 'keywords';
    document.head.appendChild(mockMetaKeywords);

    mockOgTitle = document.createElement('meta');
    mockOgTitle.setAttribute('property', 'og:title');
    document.head.appendChild(mockOgTitle);

    mockOgDescription = document.createElement('meta');
    mockOgDescription.setAttribute('property', 'og:description');
    document.head.appendChild(mockOgDescription);

    mockTwitterTitle = document.createElement('meta');
    mockTwitterTitle.name = 'twitter:title';
    document.head.appendChild(mockTwitterTitle);

    mockTwitterDescription = document.createElement('meta');
    mockTwitterDescription.name = 'twitter:description';
    document.head.appendChild(mockTwitterDescription);

    mockJsonLdScript = document.createElement('script');
    mockJsonLdScript.type = 'application/ld+json';
    mockJsonLdScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Emergency Supply Tracker',
      description: 'Original description',
    });
    document.head.appendChild(mockJsonLdScript);
  });

  afterEach(() => {
    // Restore original values
    document.title = originalTitle;
    document.documentElement.lang = originalLang;

    // Remove mock elements
    mockMetaDescription.remove();
    mockMetaKeywords.remove();
    mockOgTitle.remove();
    mockOgDescription.remove();
    mockTwitterTitle.remove();
    mockTwitterDescription.remove();
    if (mockJsonLdScript.parentNode) {
      mockJsonLdScript.remove();
    }

    vi.clearAllMocks();
  });

  it('updates document title', () => {
    renderHook(() => useDocumentMetadata());

    expect(document.title).toBe('Test Title');
  });

  it('updates meta description', () => {
    renderHook(() => useDocumentMetadata());

    expect(mockMetaDescription.getAttribute('content')).toBe(
      'Test Description',
    );
  });

  it('updates meta keywords', () => {
    renderHook(() => useDocumentMetadata());

    expect(mockMetaKeywords.getAttribute('content')).toBe('test, keywords');
  });

  it('updates Open Graph title', () => {
    renderHook(() => useDocumentMetadata());

    expect(mockOgTitle.getAttribute('content')).toBe('OG Test Title');
  });

  it('updates Open Graph description', () => {
    renderHook(() => useDocumentMetadata());

    expect(mockOgDescription.getAttribute('content')).toBe(
      'OG Test Description',
    );
  });

  it('updates Twitter Card title', () => {
    renderHook(() => useDocumentMetadata());

    expect(mockTwitterTitle.getAttribute('content')).toBe('Twitter Test Title');
  });

  it('updates Twitter Card description', () => {
    renderHook(() => useDocumentMetadata());

    expect(mockTwitterDescription.getAttribute('content')).toBe(
      'Twitter Test Description',
    );
  });

  it('updates HTML lang attribute', () => {
    mockI18n.language = 'fi';

    renderHook(() => useDocumentMetadata());

    expect(document.documentElement.lang).toBe('fi');
  });

  it('updates JSON-LD structured data description', () => {
    renderHook(() => useDocumentMetadata());

    const updatedJsonLd = JSON.parse(mockJsonLdScript.textContent || '{}');
    expect(updatedJsonLd.description).toBe('Test Description');
  });

  it('handles JSON-LD without description field', () => {
    mockJsonLdScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Emergency Supply Tracker',
      // No description field
    });

    renderHook(() => useDocumentMetadata());

    const updatedJsonLd = JSON.parse(mockJsonLdScript.textContent || '{}');
    expect(updatedJsonLd.description).toBeUndefined();
  });

  it('handles JSON-LD parsing errors gracefully', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    mockJsonLdScript.textContent = 'invalid json';

    renderHook(() => useDocumentMetadata());

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to update JSON-LD description:',
      expect.any(Error),
    );

    consoleWarnSpy.mockRestore();
  });

  it('handles missing JSON-LD script element', () => {
    mockJsonLdScript.remove();

    // Should not throw
    renderHook(() => useDocumentMetadata());

    expect(document.title).toBe('Test Title');
  });

  it('handles missing meta elements gracefully', () => {
    // Remove all meta elements
    mockMetaDescription.remove();
    mockMetaKeywords.remove();
    mockOgTitle.remove();
    mockOgDescription.remove();
    mockTwitterTitle.remove();
    mockTwitterDescription.remove();

    // Should not throw
    renderHook(() => useDocumentMetadata());

    expect(document.title).toBe('Test Title');
  });
});
