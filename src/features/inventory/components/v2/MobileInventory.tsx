import { useMemo, useState } from 'react';
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

const MS_PER_DAY = 86_400_000;

interface MobileInventoryProps {
  onItemSelect: (id: string) => void;
  selectedCategoryId?: string;
  onCategoryChange: (id?: string) => void;
  onAddItem: () => void;
}
type FilterKey = 'all' | 'crit' | 'warn' | 'ok' | 'exp';

export function MobileInventory({
  onItemSelect,
  selectedCategoryId,
  onCategoryChange,
  onAddItem,
}: MobileInventoryProps) {
  const { themeKey } = useDesignTheme();
  const { rows, categories } = useDesignData();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

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
      if (search && !r.item.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [rows, filter, search, selectedCategoryId]);

  const chips: Array<[FilterKey, string]> = [
    ['all', themeKey === 'pantry' ? 'All' : 'ALL'],
    ['crit', themeKey === 'pantry' ? 'Out' : 'CRIT'],
    ['warn', themeKey === 'pantry' ? 'Low' : 'WARN'],
    ['ok', 'OK'],
    ['exp', themeKey === 'pantry' ? 'Expiring' : 'EXP'],
  ];

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <Button variant="primary" full onClick={onAddItem}>
        {themeKey === 'pantry' ? '+ Add item' : '+ ADD ITEM'}
      </Button>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={themeKey === 'pantry' ? 'Search items…' : 'SEARCH'}
        aria-label="Search inventory"
        style={{
          background: 'var(--color-panel)',
          border: '1px solid var(--color-rule)',
          color: 'var(--color-text)',
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          width: '100%',
        }}
      />
      <select
        value={selectedCategoryId ?? ''}
        onChange={(e) => onCategoryChange(e.target.value || undefined)}
        aria-label={themeKey === 'pantry' ? 'Category' : 'CATEGORY'}
        style={{
          background: 'var(--color-panel)',
          border: '1px solid var(--color-rule)',
          color: 'var(--color-text)',
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          width: '100%',
        }}
      >
        <option value="">
          {themeKey === 'pantry' ? 'All categories' : 'ALL CATEGORIES'}
        </option>
        {categories.map((c) => (
          <option key={String(c.id)} value={String(c.id)}>
            {c.name}
          </option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
        {chips.map(([k, label]) => {
          const active = filter === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
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
      <Panel padding={0}>
        {filtered.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--color-text-2)',
            }}
          >
            {themeKey === 'pantry' ? 'No items match.' : 'EMPTY · NO MATCH'}
          </div>
        )}
        {filtered.map((r: DesignItemRow, i) => (
          <button
            key={String(r.item.id)}
            type="button"
            onClick={() => onItemSelect(String(r.item.id))}
            style={{
              padding: '12px 14px',
              borderBottom:
                i < filtered.length - 1
                  ? '1px solid var(--color-rule-soft)'
                  : 'none',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 10,
              alignItems: 'center',
              background: 'transparent',
              border: 0,
              fontFamily: 'inherit',
              color: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusDot status={r.status} size={6} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-text)',
                  }}
                >
                  {r.item.name}
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-3)',
                  marginTop: 3,
                }}
              >
                {r.categoryCode} · {r.item.location ?? '—'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color:
                    r.item.quantity === 0
                      ? 'var(--color-crit)'
                      : 'var(--color-text)',
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {r.item.quantity}/{r.recommended || '—'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-3)',
                  marginTop: 1,
                }}
              >
                {r.item.expirationDate ?? '—'}
              </div>
            </div>
          </button>
        ))}
      </Panel>
    </div>
  );
}
