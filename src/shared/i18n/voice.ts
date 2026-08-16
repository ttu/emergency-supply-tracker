/**
 * Category code mapping for the design v2 UI (e.g. `H2O`, `FUD`, `PET`).
 *
 * The per-theme voice strings (appName / tagline / readiness / …) that used
 * to live here as a static `VOICE` record now live in
 * `public/locales/{en,fi}/common.json` under the `v2.voice.*` namespace and
 * are read by components via `useTranslation()`.
 */
export const CATEGORY_CODES: Record<string, string> = {
  'water-beverages': 'H2O',
  food: 'FUD',
  'cooking-heat': 'CKH',
  'light-power': 'PWR',
  'communication-info': 'CMM',
  'medical-health': 'MED',
  'hygiene-sanitation': 'HYG',
  'tools-supplies': 'TLS',
  'cash-documents': 'DOC',
  pets: 'PET',
};

export function categoryCode(categoryId: string): string {
  return CATEGORY_CODES[categoryId] ?? categoryId.slice(0, 3).toUpperCase();
}
