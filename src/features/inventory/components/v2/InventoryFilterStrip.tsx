import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { LOCATION_FILTER_NONE, type SortBy } from '@/features/inventory';
import styles from './InventoryFilterStrip.module.css';

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
        className={`${styles.chip} ${active ? styles.chipActive : ''}`}
      >
        {label} <span className={styles.chipCount}>{n}</span>
      </button>
    );
  };

  return (
    <div className={styles.strip}>
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
      <div className={styles.controls}>
        {(locations.length > 0 || locationFilter !== undefined) && (
          <select
            // The every-location choice is the empty option rather than a
            // magic string, so a location actually named "all" stays
            // selectable.
            value={locationFilter ?? ''}
            onChange={(e) =>
              onLocationFilterChange(e.target.value || undefined)
            }
            aria-label={t(`v2.inventory.locationAria.${themeKey}`)}
            className={styles.select}
          >
            <option value="">
              {t(`v2.inventory.allLocations.${themeKey}`)}
            </option>
            <option value={LOCATION_FILTER_NONE}>
              {t(`v2.inventory.noLocation.${themeKey}`)}
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
          className={styles.select}
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
          className={styles.search}
        />
      </div>
    </div>
  );
}
