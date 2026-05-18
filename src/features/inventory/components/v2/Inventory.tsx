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

const MS_PER_DAY = 86_400_000;

function isExpiringWithin30Days(
  item: { expirationDate?: string; neverExpires?: boolean },
  now: number,
): boolean {
  if (!item.expirationDate || item.neverExpires) return false;
  const days = (new Date(item.expirationDate).getTime() - now) / MS_PER_DAY;
  return days >= 0 && days < 30;
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
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    let crit = 0;
    let warn = 0;
    let ok = 0;
    let exp = 0;
    for (const r of rows) {
      if (r.status === 'crit') crit++;
      else if (r.status === 'warn') warn++;
      else ok++;
      if (r.item.expirationDate && !r.item.neverExpires) {
        const days =
          (new Date(r.item.expirationDate).getTime() - now) / MS_PER_DAY;
        if (days >= 0 && days < 30) exp++;
      }
    }
    return { crit, warn, ok, exp, all: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return rows.filter((r) => {
      if (
        selectedCategoryId &&
        String(r.item.categoryId) !== selectedCategoryId
      )
        return false;
      if (!matchesStatusFilter(r.status, filter)) return false;
      if (filter === 'exp' && !isExpiringWithin30Days(r.item, now))
        return false;
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
