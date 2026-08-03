import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { Category } from '@/shared/types';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';
import { useCategoryFilterRows } from './useCategoryFilterRows';

interface CategoryChipsProps {
  categories: Category[];
  rows: DesignItemRow[];
  selectedCategoryId?: string;
  onCategoryChange: (id?: string) => void;
}

/**
 * The phone's answer to the desktop category rail: the same rows, laid out as
 * a scrollable strip. A 232px column would take most of the screen, and a
 * dropdown hides the counts, which are half the reason the list is useful.
 */
export function CategoryChips({
  categories,
  rows,
  selectedCategoryId,
  onCategoryChange,
}: Readonly<CategoryChipsProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const filterRows = useCategoryFilterRows(categories, rows);

  return (
    <div
      role="group"
      aria-label={t(`v2.inventory.categoryAria.${themeKey}`)}
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        // Chips must not be squashed to fit; the strip scrolls instead.
        flexWrap: 'nowrap',
        paddingBottom: 2,
      }}
    >
      {filterRows.map((row) => {
        const selected = (row.id ?? undefined) === selectedCategoryId;
        return (
          <button
            key={row.id ?? 'all'}
            type="button"
            aria-pressed={selected}
            data-testid={`v2-category-chip-${row.id ?? 'all'}`}
            onClick={() => onCategoryChange(row.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flex: 'none',
              padding: '6px 12px',
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              fontWeight: selected ? 700 : 500,
              letterSpacing: '0.04em',
              border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
              background: selected ? 'var(--color-panel-2)' : 'transparent',
              color: selected ? 'var(--color-text)' : 'var(--color-text-2)',
              borderRadius: 'var(--radius-pill)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {row.label}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: selected ? 'var(--color-accent)' : 'var(--color-text-3)',
              }}
            >
              {row.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
