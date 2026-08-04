import { memo, useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Panel,
  StatusDot,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import {
  useDesignData,
  type DesignItemRow,
} from '@/shared/hooks/useDesignData';
import { useMissingRecommendedItems } from '@/shared/hooks/useMissingRecommendedItems';
import { useInventory, useLocationSuggestions } from '@/features/inventory';
import { compareItemsBy } from '@/features/inventory/utils/sortItems';
import type { SortBy } from '@/features/inventory';
import { useInventoryFilters } from '../../hooks/useInventoryFilters';
import { MissingItemsTable } from './MissingItemsTable';
import { CategorySelect } from './CategorySelect';
import { resolveCategoryLabel } from '@/shared/i18n/categoryLabel';
import { CategorySummaryPanel } from './CategorySummaryPanel';
import { CategoryStatusStrip } from './CategoryStatusStrip';
import { useCategoryCoverage } from './useCategoryCoverage';
import { getDaysUntilExpiration } from '@/shared/utils/calculations/itemStatus';
import { EXPIRING_SOON_DAYS_THRESHOLD } from '@/shared/utils/constants';

interface MobileInventoryProps {
  onItemSelect: (id: string) => void;
  /** `templateId` pre-fills the new item from that recommended product. */
  onAddItem: (templateId?: string) => void;
}
type FilterKey = 'all' | 'crit' | 'warn' | 'ok' | 'exp' | 'missing';

export function MobileInventory({
  onItemSelect,
  onAddItem,
}: Readonly<MobileInventoryProps>) {
  const { t, i18n } = useTranslation(['common', 'categories']);
  const { themeKey } = useDesignTheme();
  const { rows, categories } = useDesignData();
  const allMissing = useMissingRecommendedItems();
  const { items } = useInventory();
  const locations = useLocationSuggestions(items);
  const [filters, setFilters] = useInventoryFilters();
  const {
    categoryId: selectedCategoryId,
    status: filter,
    search,
    location: locationFilter,
    sortBy,
  } = filters;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (
        selectedCategoryId &&
        String(r.item.categoryId) !== selectedCategoryId
      )
        return false;
      if (filter === 'crit' && r.status !== 'crit') return false;
      if (filter === 'warn' && r.status !== 'warn') return false;
      if (filter === 'ok' && r.status !== 'ok') return false;
      if (filter === 'exp') {
        const days = getDaysUntilExpiration(
          r.item.expirationDate,
          r.item.neverExpires,
        );
        if (
          days === undefined ||
          days < 0 ||
          days > EXPIRING_SOON_DAYS_THRESHOLD
        )
          return false;
      }
      if (search && !r.item.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (locationFilter !== undefined && r.item.location !== locationFilter)
        return false;
      return true;
    });
  }, [rows, filter, search, selectedCategoryId, locationFilter]);

  const visible = useMemo(
    () => [...filtered].sort((a, b) => compareItemsBy(a.item, b.item, sortBy)),
    [filtered, sortBy],
  );

  const missing = useMemo(
    () =>
      selectedCategoryId
        ? allMissing.filter((m) => m.categoryId === selectedCategoryId)
        : allMissing,
    [allMissing, selectedCategoryId],
  );

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => String(c.id) === selectedCategoryId)
    : undefined;

  const coverage = useCategoryCoverage(selectedCategoryId);

  // Resolved the same way the dropdown resolves its options, so the strip and
  // the control that set it agree in every language.
  const categoryLabel =
    selectedCategory && selectedCategoryId
      ? resolveCategoryLabel(
          selectedCategory,
          selectedCategoryId,
          i18n.language || 'en',
          t,
        )
      : '';

  const chips: Array<[FilterKey, string]> = useMemo(
    () => [
      ['all', t(`v2.inventory.filterAll.${themeKey}`)],
      ['crit', t(`v2.inventory.filterCrit.${themeKey}`)],
      ['warn', t(`v2.inventory.filterWarn.${themeKey}`)],
      ['ok', t(`v2.inventory.filterOk.${themeKey}`)],
      ['exp', t(`v2.inventory.filterExpShort.${themeKey}`)],
      ['missing', t(`v2.inventory.filterMissing.${themeKey}`)],
    ],
    [t, themeKey],
  );

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <Button variant="primary" full onClick={() => onAddItem()}>
        {t(`v2.voice.addItem.${themeKey}`)}
      </Button>
      <input
        value={search}
        onChange={(e) => setFilters({ search: e.target.value })}
        placeholder={t(`v2.inventory.searchPlaceholder.${themeKey}`)}
        aria-label={t('v2.inventory.searchAria')}
        style={{
          background: 'var(--color-panel)',
          border: '1px solid var(--color-rule)',
          color: 'var(--color-text)',
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          borderRadius: 'var(--radius-sm)',
          width: '100%',
        }}
      />
      <CategorySelect
        categories={categories}
        rows={rows}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={(categoryId) => setFilters({ categoryId })}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        {locations.length > 0 && (
          <select
            // Empty option, not a magic "all", so a location named "all"
            // remains selectable. See InventoryFilters.location.
            value={locationFilter ?? ''}
            onChange={(e) =>
              setFilters({ location: e.target.value || undefined })
            }
            aria-label={t(`v2.inventory.locationAria.${themeKey}`)}
            style={MOBILE_SELECT_STYLE}
          >
            <option value="">
              {t(`v2.inventory.allLocations.${themeKey}`)}
            </option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
        <select
          value={sortBy}
          onChange={(e) => setFilters({ sortBy: e.target.value as SortBy })}
          aria-label={t(`v2.inventory.sortAria.${themeKey}`)}
          style={MOBILE_SELECT_STYLE}
        >
          <option value="name">{t('inventory.sort.name')}</option>
          <option value="quantity">{t('inventory.sort.quantity')}</option>
          <option value="expiration">{t('inventory.sort.expiration')}</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
        {chips.map(([k, label]) => {
          const active = filter === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilters({ status: k })}
              style={{
                padding: '6px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                color: active ? 'var(--color-accent)' : 'var(--color-text-2)',
                background: 'transparent',
                borderRadius: 'var(--radius-pill)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {/* Sits directly above the list, after the filters that decide what the
          list holds: on a phone the summary reads as a header for the rows
          below it, not as a second thing to scroll past before filtering. */}
      {selectedCategory && (
        <>
          <CategoryStatusStrip label={categoryLabel} stacked {...coverage} />
          <CategorySummaryPanel categoryId={selectedCategory.id as string} />
        </>
      )}
      <Panel padding={0}>
        {filter === 'missing' && (
          <MissingItemsTable items={missing} onAdd={onAddItem} />
        )}
        {filter !== 'missing' && visible.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--color-text-2)',
            }}
          >
            {t(`v2.inventory.empty.${themeKey}`)}
          </div>
        )}
        {filter !== 'missing' &&
          visible.map((r, i) => (
            <MobileInventoryRow
              key={String(r.item.id)}
              row={r}
              isLast={i === visible.length - 1}
              onSelect={onItemSelect}
            />
          ))}
      </Panel>
    </div>
  );
}

const MOBILE_SELECT_STYLE: CSSProperties = {
  background: 'var(--color-panel)',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-text)',
  padding: '10px 12px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  borderRadius: 'var(--radius-sm)',
  flex: 1,
  minWidth: 0,
};

const ROW_BASE_STYLE: CSSProperties = {
  padding: '12px 14px',
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 10,
  alignItems: 'center',
  background: 'transparent',
  // Longhands: the row adds its own `borderBottom`, and mixing the two makes
  // React warn about conflicting properties.
  borderTop: 0,
  borderRight: 0,
  borderLeft: 0,
  fontFamily: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
};
const ROW_LEFT_TITLE_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};
const ROW_NAME_STYLE: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text)',
};
const ROW_META_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-3)',
  marginTop: 3,
};
const ROW_RIGHT_WRAP_STYLE: CSSProperties = { textAlign: 'right' };
const ROW_QTY_BASE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  fontFeatureSettings: '"tnum"',
};
const ROW_EXP_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  color: 'var(--color-text-3)',
  marginTop: 1,
};

interface MobileInventoryRowProps {
  row: DesignItemRow;
  isLast: boolean;
  onSelect: (id: string) => void;
}

function MobileInventoryRowImpl({
  row: r,
  isLast,
  onSelect,
}: Readonly<MobileInventoryRowProps>) {
  const rowStyle: CSSProperties = {
    ...ROW_BASE_STYLE,
    borderBottom: isLast ? 'none' : '1px solid var(--color-rule-soft)',
  };
  const qtyStyle: CSSProperties = {
    ...ROW_QTY_BASE_STYLE,
    color: r.item.quantity === 0 ? 'var(--color-crit)' : 'var(--color-text)',
  };
  return (
    <button
      type="button"
      onClick={() => onSelect(String(r.item.id))}
      style={rowStyle}
    >
      <div>
        <div style={ROW_LEFT_TITLE_STYLE}>
          <StatusDot status={r.status} size={6} />
          <span style={ROW_NAME_STYLE}>{r.item.name}</span>
        </div>
        <div style={ROW_META_STYLE}>
          {r.categoryCode} · {r.item.location ?? '—'}
        </div>
      </div>
      <div style={ROW_RIGHT_WRAP_STYLE}>
        <div style={qtyStyle}>
          {r.item.quantity}/{r.recommended || '—'}
        </div>
        <div style={ROW_EXP_STYLE}>{r.item.expirationDate ?? '—'}</div>
      </div>
    </button>
  );
}

const MobileInventoryRow = memo(MobileInventoryRowImpl);
