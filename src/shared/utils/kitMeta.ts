import type { LocalizedMetaString } from '@/shared/types';

/**
 * Resolves a kit meta name or description to a string for the given language.
 * Uses selected language if present, otherwise English (en), then first available value.
 *
 * @param value - Meta string or localized object (e.g. { en: "...", fi: "..." })
 * @param lang - Current language code (e.g. from i18n.language)
 * @returns Display string for the kit name or description
 */
export function getLocalizedKitMetaString(
  value: LocalizedMetaString | undefined,
  lang: string,
): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  const normalized = value as Record<string, string>;
  return (
    normalized[lang] ?? normalized['en'] ?? Object.values(normalized)[0] ?? ''
  );
}
