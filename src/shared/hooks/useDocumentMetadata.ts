import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to update HTML document metadata (title, meta tags, Open Graph, Twitter) based on current language
 */
export function useDocumentMetadata(): void {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Update document title
    document.title = t('metadata.title');

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('metadata.description'));
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', t('metadata.keywords'));
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', t('metadata.ogTitle'));
    }

    const ogDescription = document.querySelector(
      'meta[property="og:description"]',
    );
    if (ogDescription) {
      ogDescription.setAttribute('content', t('metadata.ogDescription'));
    }

    // Update Twitter Card tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', t('metadata.twitterTitle'));
    }

    const twitterDescription = document.querySelector(
      'meta[name="twitter:description"]',
    );
    if (twitterDescription) {
      twitterDescription.setAttribute(
        'content',
        t('metadata.twitterDescription'),
      );
    }

    // Update HTML lang attribute
    document.documentElement.lang = i18n.language;

    // Update JSON-LD structured data description if it exists
    const jsonLdScript = document.querySelector(
      'script[type="application/ld+json"]',
    );
    if (jsonLdScript) {
      try {
        const jsonLd = JSON.parse(jsonLdScript.textContent || '{}');
        if (jsonLd.description) {
          jsonLd.description = t('metadata.description');
          jsonLdScript.textContent = JSON.stringify(jsonLd);
        }
      } catch (error) {
        // Silently fail if JSON-LD parsing fails
        console.warn('Failed to update JSON-LD description:', error);
      }
    }
  }, [t, i18n.language]);
}
