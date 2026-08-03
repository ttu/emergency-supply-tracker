import type { TFunction } from 'i18next';
import type { Category } from '@/shared/types';

/**
 * The name to show for a category in the active language.
 *
 * Two kinds of category coexist. Standard ones are translated from the
 * `categories` namespace by id; custom ones carry their own `names` map, and
 * fall back to the single `name` they were created with. Getting this wrong is
 * how a category ends up rendering as its raw id, so it lives in one place
 * rather than being restated at each call site.
 */
export function resolveCategoryLabel(
  category: Category | undefined,
  categoryId: string,
  lang: string,
  t: TFunction,
): string {
  const own = category?.names?.[lang] ?? category?.names?.en;
  if (own) return own;
  if (category?.isCustom) return category.name;
  return t(categoryId, { ns: 'categories' });
}
