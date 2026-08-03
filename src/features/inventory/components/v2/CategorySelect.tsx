import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { Category } from '@/shared/types';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';
import { useCategoryFilterRows } from './useCategoryFilterRows';

interface CategorySelectProps {
  categories: Category[];
  rows: DesignItemRow[];
  selectedCategoryId?: string;
  onCategoryChange: (id?: string) => void;
}

/** The "All" row has no category id; a select needs a string value for it. */
const ALL_VALUE = '';

const SELECT_STYLE: CSSProperties = {
  background: 'var(--color-panel)',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-text)',
  padding: '10px 12px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
  width: '100%',
};

/**
 * The phone's answer to the desktop category rail. A 232px column would take
 * most of the screen, so the ten categories collapse into one control; the
 * counts stay visible in the option labels, since they are half the reason the
 * list is useful.
 */
export function CategorySelect({
  categories,
  rows,
  selectedCategoryId,
  onCategoryChange,
}: Readonly<CategorySelectProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const filterRows = useCategoryFilterRows(categories, rows);

  return (
    <select
      data-testid="v2-category-select"
      aria-label={t(`v2.inventory.categoryAria.${themeKey}`)}
      value={selectedCategoryId ?? ALL_VALUE}
      onChange={(e) => onCategoryChange(e.target.value || undefined)}
      style={SELECT_STYLE}
    >
      {filterRows.map((row) => (
        <option key={row.id ?? 'all'} value={row.id ?? ALL_VALUE}>
          {row.label} ({row.count})
        </option>
      ))}
    </select>
  );
}
