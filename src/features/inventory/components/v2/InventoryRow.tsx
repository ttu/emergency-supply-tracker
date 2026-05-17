import type { CSSProperties } from 'react';
import {
  StatusDot,
  StatusPill,
} from '@/shared/components/design-v2/primitives';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';

interface InventoryRowProps {
  row: DesignItemRow;
  cellStyles: CSSProperties;
  isLast: boolean;
  onSelect: (id: string) => void;
}

/** A single row in the inventory grid table. Shares cellStyles with the header. */
export function InventoryRow({
  row: r,
  cellStyles,
  isLast,
  onSelect,
}: Readonly<InventoryRowProps>) {
  return (
    <button
      type="button"
      onClick={() => onSelect(String(r.item.id))}
      style={{
        ...cellStyles,
        cursor: 'pointer',
        borderBottom: isLast ? 'none' : '1px solid var(--color-rule-soft)',
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
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            color:
              r.item.quantity === 0 ? 'var(--color-crit)' : 'var(--color-text)',
          }}
        >
          {r.item.quantity}
        </span>
        <span style={{ color: 'var(--color-text-3)' }}>
          {' / '}
          {r.recommended || '—'}
        </span>
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
  );
}
