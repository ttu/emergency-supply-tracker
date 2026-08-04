import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  CAPS_STYLE,
  Panel,
  Title,
} from '@/shared/components/design-v2/primitives';
import { resolveCategoryLabel } from '@/shared/i18n/categoryLabel';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { useInventory, useLocationSuggestions } from '@/features/inventory';
import { compareItemsBy } from '@/features/inventory/utils/sortItems';
import { useMissingRecommendedItems } from '@/shared/hooks/useMissingRecommendedItems';
import { useInventoryFilters } from '../../hooks/useInventoryFilters';
import { getDaysUntilExpiration } from '@/shared/utils/calculations/itemStatus';
import { EXPIRING_SOON_DAYS_THRESHOLD } from '@/shared/utils/constants';
import type { DateOnly } from '@/shared/types';
import {
  InventoryFilterStrip,
  type InventoryFilterKey,
} from './InventoryFilterStrip';
import { InventoryTable } from './InventoryTable';
import { MissingItemsTable } from './MissingItemsTable';
import { CategorySummaryPanel } from './CategorySummaryPanel';
import { CategoryRail } from './CategoryRail';
import { CategoryStatusStrip } from './CategoryStatusStrip';
import { useCategoryCoverage } from './useCategoryCoverage';

interface InventoryProps {
  onItemSelect: (id: string) => void;
  /** `templateId` pre-fills the new item from that recommended product. */
  onAddItem: (templateId?: string) => void;
}

function isExpiringSoon(item: {
  expirationDate?: DateOnly;
  neverExpires?: boolean;
}): boolean {
  const days = getDaysUntilExpiration(item.expirationDate, item.neverExpires);
  return (
    days !== undefined && days >= 0 && days <= EXPIRING_SOON_DAYS_THRESHOLD
  );
}

function matchesStatusFilter(
  status: string,
  filter: InventoryFilterKey,
): boolean {
  if (filter === 'all' || filter === 'exp') return true;
  return status === filter;
}

function matchesSearch(
  row: { item: { name: string }; categoryCode: string },
  search: string,
): boolean {
  if (!search) return true;
  const q = search.toLowerCase();
  return (
    row.item.name.toLowerCase().includes(q) ||
    row.categoryCode.toLowerCase().includes(q)
  );
}

export function Inventory({
  onItemSelect,
  onAddItem,
}: Readonly<InventoryProps>) {
  const { t, i18n } = useTranslation(['common', 'categories']);
  const { themeKey } = useDesignTheme();
  const { rows, categories } = useDesignData();
  const allMissing = useMissingRecommendedItems();
  const [filters, setFilters] = useInventoryFilters();
  const {
    categoryId: selectedCategoryId,
    status: filter,
    search,
    location: locationFilter,
    sortBy,
  } = filters;
  const { items } = useInventory();
  const locations = useLocationSuggestions(items);

  const missing = useMemo(
    () =>
      selectedCategoryId
        ? allMissing.filter((m) => m.categoryId === selectedCategoryId)
        : allMissing,
    [allMissing, selectedCategoryId],
  );

  // Rows the category rail has left in play. The status tabs count within
  // this, so their numbers describe what picking one would actually show.
  const inCategory = useMemo(
    () =>
      selectedCategoryId
        ? rows.filter((r) => String(r.item.categoryId) === selectedCategoryId)
        : rows,
    [rows, selectedCategoryId],
  );

  const counts = useMemo(() => {
    let crit = 0;
    let warn = 0;
    let ok = 0;
    let exp = 0;
    for (const r of inCategory) {
      if (r.status === 'crit') crit++;
      else if (r.status === 'warn') warn++;
      else ok++;
      if (isExpiringSoon(r.item)) exp++;
    }
    return {
      crit,
      warn,
      ok,
      exp,
      all: inCategory.length,
      missing: missing.length,
    };
  }, [inCategory, missing.length]);

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => String(c.id) === selectedCategoryId)
    : undefined;

  const coverage = useCategoryCoverage(selectedCategoryId);

  const categoryLabel = selectedCategoryId
    ? resolveCategoryLabel(
        selectedCategory,
        selectedCategoryId,
        i18n.language || 'en',
        t,
      )
    : t(`v2.inventory.allCategories.${themeKey}`);

  // With a category picked, the header says which one instead of repeating
  // "all items" — the rail's selection is otherwise the only place it shows.
  const title = selectedCategoryId
    ? t(`v2.inventory.titleCategory.${themeKey}`, { category: categoryLabel })
    : t(`v2.inventory.title.${themeKey}`);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (
        selectedCategoryId &&
        String(r.item.categoryId) !== selectedCategoryId
      )
        return false;
      if (!matchesStatusFilter(r.status, filter)) return false;
      if (filter === 'exp' && !isExpiringSoon(r.item)) return false;
      if (locationFilter !== undefined && r.item.location !== locationFilter)
        return false;
      return matchesSearch(r, search);
    });
  }, [rows, filter, selectedCategoryId, search, locationFilter]);

  const visible = useMemo(
    () => [...filtered].sort((a, b) => compareItemsBy(a.item, b.item, sortBy)),
    [filtered, sortBy],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <Caption>{t(`v2.voice.inventory.${themeKey}`)}</Caption>
          {/* The caps token keeps a category name in the header matching the
              hardcoded caps of the cockpit/civil titles; pantry sets it to
              `none`, so its title stays sentence case. */}
          <Title
            size={32}
            style={{ marginTop: 4, textTransform: CAPS_STYLE.textTransform }}
          >
            {title}
          </Title>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="primary" onClick={() => onAddItem()}>
            {t(`v2.voice.addItem.${themeKey}`)}
          </Button>
        </div>
      </div>

      {/* This view only renders in the desktop shell — narrow screens get
          MobileInventory and its chip strip — so the rail keeps a fixed
          column and the table takes the rest. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '232px minmax(0, 1fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <CategoryRail
          categories={categories}
          rows={rows}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={(categoryId) => setFilters({ categoryId })}
        />

        {/* The summary sits in the table column, not above the whole grid, so
            it lines up with the rows it describes and the rail stays beside
            it. The strip is always mounted at a fixed height; the detailed
            panel only has something to say once a category is picked. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minWidth: 0,
          }}
        >
          <CategoryStatusStrip label={categoryLabel} {...coverage} />

          {selectedCategory && (
            <CategorySummaryPanel categoryId={selectedCategory.id as string} />
          )}

          <Panel padding={0} style={{ minWidth: 0 }}>
            <InventoryFilterStrip
              filter={filter}
              onFilterChange={(status) => setFilters({ status })}
              counts={counts}
              search={search}
              onSearchChange={(search) => setFilters({ search })}
              locationFilter={locationFilter}
              onLocationFilterChange={(location) => setFilters({ location })}
              locations={locations}
              sortBy={sortBy}
              onSortByChange={(sortBy) => setFilters({ sortBy })}
            />
            {filter === 'missing' ? (
              <MissingItemsTable items={missing} onAdd={onAddItem} />
            ) : (
              <InventoryTable
                rows={visible}
                totalRowCount={inCategory.length}
                onItemSelect={onItemSelect}
              />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
