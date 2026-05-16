import type { CSSProperties } from 'react';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { Category } from '@/shared/types';

export type InventoryFilterKey = 'all' | 'crit' | 'warn' | 'ok' | 'exp';

export interface InventoryFilterCounts {
  all: number;
  crit: number;
  warn: number;
  ok: number;
  exp: number;
}

interface InventoryFilterStripProps {
  filter: InventoryFilterKey;
  onFilterChange: (k: InventoryFilterKey) => void;
  counts: InventoryFilterCounts;
  selectedCategoryId?: string;
  onCategoryChange: (id?: string) => void;
  categories: Category[];
  search: string;
  onSearchChange: (q: string) => void;
}

/** Top of the inventory panel: status chips + category select + search. */
export function InventoryFilterStrip({
  filter,
  onFilterChange,
  counts,
  selectedCategoryId,
  onCategoryChange,
  categories,
  search,
  onSearchChange,
}: InventoryFilterStripProps) {
  const { themeKey, voice } = useDesignTheme();
  const chip = (k: InventoryFilterKey, label: string, n: number) => {
    const active = filter === k;
    return (
      <button
        key={k}
        type="button"
        onClick={() => onFilterChange(k)}
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

  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      {chip('all', themeKey === 'pantry' ? 'All' : 'ALL', counts.all)}
      {chip('crit', voice.statusCrit, counts.crit)}
      {chip('warn', voice.statusWarn, counts.warn)}
      {chip('ok', voice.statusOk, counts.ok)}
      {chip('exp', themeKey === 'pantry' ? 'Expiring' : 'EXP ≤30D', counts.exp)}
      <div style={{ flex: 1 }} />
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <select
          value={selectedCategoryId ?? ''}
          onChange={(e) => onCategoryChange(e.target.value || undefined)}
          aria-label={themeKey === 'pantry' ? 'Category' : 'CATEGORY'}
          style={{
            background: 'var(--color-panel-2)',
            border: '1px solid var(--color-rule)',
            color: 'var(--color-text)',
            padding: '6px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            cursor: 'pointer',
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
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
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
  );
}
