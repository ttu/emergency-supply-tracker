import { useDocumentMetadata } from '@/shared/hooks/useDocumentMetadata';

/**
 * Component that updates HTML document metadata based on current language
 * This should be rendered once at the app root level
 */
export function DocumentMetadata() {
  useDocumentMetadata();
  return null; // This component doesn't render anything
}
