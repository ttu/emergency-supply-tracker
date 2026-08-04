import { memo, type CSSProperties } from 'react';
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

const codeStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-3)',
};
// `minWidth: 0` on both this and the label: a grid item defaults to
// `min-width: auto`, so without it a long product name widens the whole
// column past the panel instead of ellipsing.
const nameStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  color: 'var(--color-text)',
  fontWeight: 500,
};
const nameLabelStyle: CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
const locationStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text-2)',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
const categoryStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-2)',
};
const qtyCellStyle: CSSProperties = {
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
  whiteSpace: 'nowrap',
};
const recPartStyle: CSSProperties = { color: 'var(--color-text-3)' };

/** A single row in the inventory grid table. Memoized so the table can render
 *  hundreds of items without re-rendering every row on unrelated parent state
 *  changes. Shares `cellStyles` with the header. */
function InventoryRowImpl({
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
        background: 'transparent',
        // Longhands only: a `border: 0` shorthand after this line silently
        // won, so the row separators never drew.
        borderTop: 0,
        borderRight: 0,
        borderLeft: 0,
        borderBottom: isLast ? 'none' : '1px solid var(--color-rule-soft)',
        borderRadius: 0,
        fontFamily: 'inherit',
        color: 'inherit',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span style={codeStyle}>{String(r.item.id).slice(0, 10)}</span>
      <span style={nameStyle} title={r.item.name}>
        <StatusDot status={r.status} size={6} />
        <span style={nameLabelStyle}>{r.item.name}</span>
      </span>
      <span style={categoryStyle}>{r.categoryCode}</span>
      <span style={qtyCellStyle}>
        <span
          style={{
            color:
              r.item.quantity === 0 ? 'var(--color-crit)' : 'var(--color-text)',
          }}
        >
          {r.item.quantity}
        </span>
        <span style={recPartStyle}>
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
      <span style={locationStyle} title={r.item.location ?? undefined}>
        {r.item.location ?? '—'}
      </span>
      <StatusPill status={r.status} />
    </button>
  );
}

export const InventoryRow = memo(InventoryRowImpl);
