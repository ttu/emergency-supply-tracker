import { useMemo, useState } from 'react';
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

export function Inventory({
  selectedCategoryId,
  onCategoryChange,
  onItemSelect,
  onAddItem,
}: InventoryProps) {
  const { themeKey, voice } = useDesignTheme();
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
      if (filter === 'crit' && r.status !== 'crit') return false;
      if (filter === 'warn' && r.status !== 'warn') return false;
      if (filter === 'ok' && r.status !== 'ok') return false;
      if (filter === 'exp') {
        if (!r.item.expirationDate || r.item.neverExpires) return false;
        const days =
          (new Date(r.item.expirationDate).getTime() - now) / MS_PER_DAY;
        if (days < 0 || days >= 30) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.item.name.toLowerCase().includes(q) &&
          !r.categoryCode.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
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
          <Caption>{voice.inventory}</Caption>
          <Title size={32} style={{ marginTop: 4 }}>
            {themeKey === 'pantry'
              ? 'Everything you have'
              : 'INVENTORY · ALL ITEMS'}
          </Title>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="primary" onClick={onAddItem}>
            {voice.addItem}
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
