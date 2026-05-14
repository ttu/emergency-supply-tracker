import { useMemo, useState, type CSSProperties } from 'react';
import {
  Button,
  Caption,
  Panel,
  StatusDot,
  StatusPill,
  Title,
} from '../primitives';
import { useDesignTheme } from '../useDesignTheme';
import { useDesignData, type DesignItemRow } from '../useDesignData';
import type { CategoryId } from '@/shared/types';

interface InventoryProps {
  selectedCategoryId?: string;
  onCategoryChange: (id?: string) => void;
  onItemSelect: (id: string) => void;
  onAddItem: () => void;
}

type FilterKey = 'all' | 'crit' | 'warn' | 'ok' | 'exp';

const MS_PER_DAY = 86_400_000;

export function Inventory({
  selectedCategoryId,
  onCategoryChange,
  onItemSelect,
  onAddItem,
}: InventoryProps) {
  const { themeKey, voice } = useDesignTheme();
  const { rows, categories } = useDesignData();
  const [filter, setFilter] = useState<FilterKey>('all');
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

  const filterChip = (k: FilterKey, label: string, n: number) => {
    const active = filter === k;
    return (
      <button
        key={k}
        type="button"
        onClick={() => setFilter(k)}
        style={{
          padding: '12px 20px',
          cursor: 'pointer',
          background: 'transparent',
          border: 0,
          borderBottom: active
            ? '2px solid var(--color-accent)'
            : '2px solid transparent',
          marginBottom: -1,
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 'var(--caps-tracking)',
          textTransform:
            'var(--caps-transform)' as CSSProperties['textTransform'],
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

  const cellStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '90px 1fr 110px 70px 110px 100px 110px 90px',
    padding: '12px 20px',
    alignItems: 'center',
    fontSize: 13,
  };

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

      {selectedCategoryId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-2)',
            }}
          >
            Filter:{' '}
            {categories.find((c) => String(c.id) === selectedCategoryId)?.name}
          </span>
          <button
            type="button"
            onClick={() => onCategoryChange(undefined)}
            style={{
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-accent)',
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            CLEAR ×
          </button>
        </div>
      )}

      <Panel padding={0}>
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-rule-soft)',
          }}
        >
          {filterChip('all', themeKey === 'pantry' ? 'All' : 'ALL', counts.all)}
          {filterChip('crit', voice.statusCrit, counts.crit)}
          {filterChip('warn', voice.statusWarn, counts.warn)}
          {filterChip('ok', voice.statusOk, counts.ok)}
          {filterChip(
            'exp',
            themeKey === 'pantry' ? 'Expiring' : 'EXP ≤30D',
            counts.exp,
          )}
          <div style={{ flex: 1 }} />
          <div
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={themeKey === 'pantry' ? 'Search items…' : 'SEARCH'}
              aria-label="Search inventory"
              style={{
                background: 'var(--color-panel-2)',
                border: '1px solid var(--color-rule)',
                color: 'var(--color-text)',
                padding: '6px 10px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                borderRadius: 'var(--radius-sm)',
                width: 200,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div
          style={{
            ...cellStyles,
            padding: '10px 20px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: 'var(--caps-tracking)',
            textTransform:
              'var(--caps-transform)' as CSSProperties['textTransform'],
            color: 'var(--color-text-3)',
            fontWeight: 600,
            borderBottom: '1px solid var(--color-rule-soft)',
            background: 'var(--color-panel-2)',
          }}
        >
          <span>ID</span>
          <span>Item</span>
          <span>Category</span>
          <span style={{ textAlign: 'right' }}>{voice.qty}</span>
          <span style={{ textAlign: 'right' }}>{voice.rec}</span>
          <span>{voice.expires}</span>
          <span>{voice.location}</span>
          <span>Status</span>
        </div>

        {filtered.length === 0 && (
          <div
            style={{
              padding: 32,
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
              ...cellStyles,
              cursor: 'pointer',
              borderBottom:
                i < filtered.length - 1
                  ? '1px solid var(--color-rule-soft)'
                  : 'none',
              background: 'transparent',
              border: 0,
              borderRadius: 0,
              fontFamily: 'inherit',
              color: 'inherit',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-3)',
              }}
            >
              {String(r.item.id).slice(0, 10)}
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--color-text)',
                fontWeight: 500,
              }}
            >
              <StatusDot status={r.status} size={6} />
              {r.item.name}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-2)',
              }}
            >
              {r.categoryCode}
            </span>
            <span
              style={{
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                color:
                  r.item.quantity === 0
                    ? 'var(--color-crit)'
                    : 'var(--color-text)',
              }}
            >
              {r.item.quantity}
            </span>
            <span
              style={{
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-3)',
              }}
            >
              {r.recommended || '—'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: r.item.expirationDate
                  ? 'var(--color-text-2)'
                  : 'var(--color-text-3)',
              }}
            >
              {r.item.expirationDate ?? '—'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-2)',
              }}
            >
              {r.item.location ?? '—'}
            </span>
            <StatusPill status={r.status} />
          </button>
        ))}

        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-3)',
            borderTop: '1px solid var(--color-rule-soft)',
          }}
        >
          <span>
            Showing {filtered.length} of {rows.length}
          </span>
        </div>
      </Panel>
    </div>
  );
}

export type _CategoryIdUnused = CategoryId;
