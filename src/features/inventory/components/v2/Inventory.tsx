import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  Panel,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { getDaysUntilExpiration } from '@/shared/utils/calculations/itemStatus';
import { EXPIRING_SOON_DAYS_THRESHOLD } from '@/shared/utils/constants';
import type { DateOnly } from '@/shared/types';
import {
  InventoryFilterStrip,
  type InventoryFilterKey,
} from './InventoryFilterStrip';
import { InventoryTable } from './InventoryTable';

interface InventoryProps {
  selectedCategoryId?: string;
  onCategoryChange: (id?: string) => void;
  onItemSelect: (id: string) => void;
  onAddItem: () => void;
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
  selectedCategoryId,
  onCategoryChange,
  onItemSelect,
  onAddItem,
}: Readonly<InventoryProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { rows, categories } = useDesignData();
  const [filter, setFilter] = useState<InventoryFilterKey>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    let crit = 0;
    let warn = 0;
    let ok = 0;
    let exp = 0;
    for (const r of rows) {
      if (r.status === 'crit') crit++;
      else if (r.status === 'warn') warn++;
      else ok++;
      if (isExpiringSoon(r.item)) exp++;
    }
    return { crit, warn, ok, exp, all: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (
        selectedCategoryId &&
        String(r.item.categoryId) !== selectedCategoryId
      )
        return false;
      if (!matchesStatusFilter(r.status, filter)) return false;
      if (filter === 'exp' && !isExpiringSoon(r.item)) return false;
      return matchesSearch(r, search);
    });
  }, [rows, filter, selectedCategoryId, search]);

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
          <Title size={32} style={{ marginTop: 4 }}>
            {t(`v2.inventory.title.${themeKey}`)}
          </Title>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="primary" onClick={onAddItem}>
            {t(`v2.voice.addItem.${themeKey}`)}
          </Button>
        </div>
      </div>

      <Panel padding={0}>
        <InventoryFilterStrip
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={onCategoryChange}
          categories={categories}
          search={search}
          onSearchChange={setSearch}
        />
        <InventoryTable
          rows={filtered}
          totalRowCount={rows.length}
          onItemSelect={onItemSelect}
        />
      </Panel>
    </div>
  );
}
