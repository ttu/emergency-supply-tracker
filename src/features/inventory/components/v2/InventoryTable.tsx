import type { CSSProperties } from 'react';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';
import { InventoryRow } from './InventoryRow';

interface InventoryTableProps {
  rows: DesignItemRow[];
  totalRowCount: number;
  onItemSelect: (id: string) => void;
}

/** 7-column inventory grid table with header + rows + footer count. */
export function InventoryTable({
  rows,
  totalRowCount,
  onItemSelect,
}: InventoryTableProps) {
  const { themeKey, voice } = useDesignTheme();
  // 7 cols with column-gap so REC/EXPIRES don't visually merge under
  // narrower viewports. QTY and REC are combined into one "qty / rec" cell.
  const cellStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns:
      '80px minmax(160px, 1fr) 70px 110px 100px minmax(80px, 110px) 80px',
    columnGap: 12,
    padding: '12px 20px',
    alignItems: 'center',
    fontSize: 13,
  };

  return (
    <>
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
        <span style={{ textAlign: 'right' }}>
          {voice.qty} / {voice.rec}
        </span>
        <span>{voice.expires}</span>
        <span>{voice.location}</span>
        <span>Status</span>
      </div>

      {rows.length === 0 && (
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

      {rows.map((r, i) => (
        <InventoryRow
          key={String(r.item.id)}
          row={r}
          cellStyles={cellStyles}
          isLast={i === rows.length - 1}
          onSelect={onItemSelect}
        />
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
          Showing {rows.length} of {totalRowCount}
        </span>
      </div>
    </>
  );
}
