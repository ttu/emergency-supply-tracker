import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { resolveCategoryLabel } from '@/shared/i18n/categoryLabel';
import type { Category } from '@/shared/types';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';

export interface CategoryFilterRow {
  /** `undefined` is the "All" row — no category filter. */
  id?: string;
  label: string;
  count: number;
}

/**
 * "All" plus one row per category, each with the number of items in it.
 *
 * Counts are taken from the whole inventory, not the currently filtered view:
 * the point of the list is to show what is available to switch to, so it must
 * not shrink as the status filter narrows what is on screen.
 */
export function useCategoryFilterRows(
  categories: Category[],
  rows: DesignItemRow[],
): CategoryFilterRow[] {
  const { t, i18n } = useTranslation(['common', 'categories']);
  const { themeKey } = useDesignTheme();
  const lang = i18n.language || 'en';

  return useMemo(() => {
    const perCategory = new Map<string, number>();
    for (const r of rows) {
      const id = String(r.item.categoryId);
      perCategory.set(id, (perCategory.get(id) ?? 0) + 1);
    }
    return [
      {
        id: undefined,
        label: t(`v2.inventory.categoryAll.${themeKey}`),
        count: rows.length,
      },
      ...categories.map((c) => {
        const id = String(c.id);
        return {
          id,
          label: resolveCategoryLabel(c, id, lang, t),
          count: perCategory.get(id) ?? 0,
        };
      }),
    ];
  }, [categories, rows, t, themeKey, lang]);
}
