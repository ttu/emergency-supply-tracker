import { useTranslation } from 'react-i18next';
import { Panel, CAPS_STYLE } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { Category } from '@/shared/types';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';
import { useCategoryFilterRows } from './useCategoryFilterRows';

interface CategoryRailProps {
  categories: Category[];
  rows: DesignItemRow[];
  selectedCategoryId?: string;
  onCategoryChange: (id?: string) => void;
}

/**
 * The desktop inventory's category list: a persistent column beside the table
 * rather than a dropdown, so the shape of the inventory — which categories
 * exist and how much is in each — is readable without opening anything.
 */
export function CategoryRail({
  categories,
  rows,
  selectedCategoryId,
  onCategoryChange,
}: Readonly<CategoryRailProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const filterRows = useCategoryFilterRows(categories, rows);

  return (
    <Panel padding={8}>
      <nav aria-label={t(`v2.inventory.categoryAria.${themeKey}`)}>
        <ul
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {filterRows.map((row) => {
            const selected = (row.id ?? undefined) === selectedCategoryId;
            return (
              <li key={row.id ?? 'all'}>
                <button
                  type="button"
                  aria-current={selected ? 'true' : undefined}
                  data-testid={`v2-category-row-${row.id ?? 'all'}`}
                  onClick={() => onCategoryChange(row.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    background: selected
                      ? 'var(--color-panel-2)'
                      : 'transparent',
                    // All four sides written out: mixing the `border`
                    // shorthand with `borderLeft` makes React warn, and the
                    // two can disagree on re-render.
                    borderTop: 0,
                    borderRight: 0,
                    borderBottom: 0,
                    borderLeft: `2px solid ${selected ? 'var(--color-accent)' : 'transparent'}`,
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    fontWeight: selected ? 700 : 500,
                    ...CAPS_STYLE,
                    color: selected
                      ? 'var(--color-text)'
                      : 'var(--color-text-2)',
                    textAlign: 'left',
                  }}
                >
                  <span>{row.label}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: selected
                        ? 'var(--color-accent)'
                        : 'var(--color-text-3)',
                    }}
                  >
                    {row.count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </Panel>
  );
}
