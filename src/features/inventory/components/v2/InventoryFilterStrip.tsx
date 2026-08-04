import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { CAPS_STYLE } from '@/shared/components/design-v2/primitives';
import type { SortBy } from '@/features/inventory';

const SELECT_STYLE: CSSProperties = {
  background: 'var(--color-panel-2)',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-text)',
  padding: '6px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
};

export type InventoryFilterKey =
  | 'all'
  | 'crit'
  | 'warn'
  | 'ok'
  | 'exp'
  | 'missing';

export interface InventoryFilterCounts {
  all: number;
  crit: number;
  warn: number;
  ok: number;
  exp: number;
  /** Recommended products the household owns nothing of. */
  missing: number;
}

interface InventoryFilterStripProps {
  filter: InventoryFilterKey;
  onFilterChange: (k: InventoryFilterKey) => void;
  counts: InventoryFilterCounts;
  search: string;
  onSearchChange: (q: string) => void;
  /** `undefined` means every location. */
  locationFilter?: string;
  onLocationFilterChange: (location: string | undefined) => void;
  /** Distinct locations across the inventory, for the location select. */
  locations: string[];
  sortBy: SortBy;
  onSortByChange: (sortBy: SortBy) => void;
}

/**
 * Top of the inventory panel: status chips, sort/location selects and search.
 *
 * Category is not here — it is the rail beside the table (`CategoryRail`), so
 * the available categories and their counts stay visible.
 */
export function InventoryFilterStrip({
  filter,
  onFilterChange,
  counts,
  search,
  onSearchChange,
  locationFilter,
  onLocationFilterChange,
  locations,
  sortBy,
  onSortByChange,
}: Readonly<InventoryFilterStripProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const chip = (k: InventoryFilterKey, label: string, n: number) => {
    const active = filter === k;
    return (
      <button
        key={k}
        type="button"
        aria-pressed={active}
        data-testid={`v2-status-${k}`}
        onClick={() => onFilterChange(k)}
        style={{
          padding: '12px 14px',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          background: 'transparent',
          borderTop: 0,
          borderRight: 0,
          borderLeft: 0,
          borderBottom: active
            ? '2px solid var(--color-accent)'
            : '2px solid transparent',
          marginBottom: -1,
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          fontWeight: 600,
          ...CAPS_STYLE,
          color: active ? 'var(--color-text)' : 'var(--color-text-3)',
        }}
      >
        {label}{' '}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-3)',
            marginLeft: 4,
          }}
        >
          {n}
        </span>
      </button>
    );
  };

  return (
    // Six chips plus three controls do not fit beside the category rail at
    // 1280px. Wrapping puts the controls on their own line there rather than
    // pushing the search box off the panel's right edge.
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      {chip('all', t(`v2.inventory.filterAll.${themeKey}`), counts.all)}
      {chip('crit', t(`v2.voice.statusCrit.${themeKey}`), counts.crit)}
      {chip('warn', t(`v2.voice.statusWarn.${themeKey}`), counts.warn)}
      {chip('ok', t(`v2.voice.statusOk.${themeKey}`), counts.ok)}
      {chip('exp', t(`v2.inventory.filterExp.${themeKey}`), counts.exp)}
      {chip(
        'missing',
        t(`v2.inventory.filterMissing.${themeKey}`),
        counts.missing,
      )}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          // Right-aligned when it shares the row with the chips, full width
          // when it has wrapped onto its own.
          marginLeft: 'auto',
          flex: '1 1 auto',
          justifyContent: 'flex-end',
          minWidth: 0,
        }}
      >
        {locations.length > 0 && (
          <select
            // The every-location choice is the empty option rather than a
            // magic string, so a location actually named "all" stays
            // selectable.
            value={locationFilter ?? ''}
            onChange={(e) =>
              onLocationFilterChange(e.target.value || undefined)
            }
            aria-label={t(`v2.inventory.locationAria.${themeKey}`)}
            style={SELECT_STYLE}
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
          onChange={(e) => onSortByChange(e.target.value as SortBy)}
          aria-label={t(`v2.inventory.sortAria.${themeKey}`)}
          style={SELECT_STYLE}
        >
          <option value="name">{t('inventory.sort.name')}</option>
          <option value="quantity">{t('inventory.sort.quantity')}</option>
          <option value="expiration">{t('inventory.sort.expiration')}</option>
        </select>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t(`v2.inventory.searchPlaceholder.${themeKey}`)}
          aria-label={t('v2.inventory.searchAria')}
          style={{
            background: 'var(--color-panel-2)',
            border: '1px solid var(--color-rule)',
            color: 'var(--color-text)',
            padding: '6px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            borderRadius: 'var(--radius-sm)',
            // Shrinks before it clips: the panel is not always wide enough
            // for a fixed 200px box after the selects.
            flex: '1 1 200px',
            minWidth: 90,
            maxWidth: 200,
          }}
        />
      </div>
    </div>
  );
}
