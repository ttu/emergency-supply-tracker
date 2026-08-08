import { memo, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
  /** Adjusts quantity directly from the list — no detail-page round trip. */
  onQuantityChange: (id: string, quantity: number) => void;
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
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 2,
  fontFamily: 'var(--font-mono)',
  whiteSpace: 'nowrap',
};
const stepperStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
};
const recPartStyle: CSSProperties = { color: 'var(--color-text-3)' };

function stepperButtonStyle(disabled: boolean): CSSProperties {
  return {
    width: 16,
    height: 16,
    lineHeight: 1,
    padding: 0,
    fontSize: 10,
    fontFamily: 'inherit',
    border: '1px solid var(--color-rule)',
    borderRadius: 3,
    background: 'transparent',
    color: disabled ? 'var(--color-text-3)' : 'var(--color-text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

/** A single row in the inventory grid table. Memoized so the table can render
 *  hundreds of items without re-rendering every row on unrelated parent state
 *  changes. Shares `cellStyles` with the header.
 *
 * The row itself is a `div[role="button"]`, not a `<button>` — it hosts the
 * quantity stepper's own buttons, and nesting `<button>` inside `<button>` is
 * invalid HTML (v1's `ItemCard` documents the same fix for the same reason). */
function InventoryRowImpl({
  row: r,
  cellStyles,
  isLast,
  onSelect,
  onQuantityChange,
}: Readonly<InventoryRowProps>) {
  const { t } = useTranslation();
  const id = String(r.item.id);
  const select = () => onSelect(id);
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Ignore bubbled keyboard events from inner controls (the stepper
    // buttons) — only the row itself, when focused, opens the item.
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select();
    }
  };
  const atMin = r.item.quantity <= 0;
  const decreaseLabel = t('v2.itemDetail.opsDecreaseAria', {
    name: r.item.name,
  });
  const increaseLabel = t('v2.itemDetail.opsIncreaseAria', {
    name: r.item.name,
  });

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`v2-inventory-row-${id}`}
      onClick={select}
      onKeyDown={handleKeyDown}
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
        <span style={stepperStyle}>
          <button
            type="button"
            aria-label={decreaseLabel}
            disabled={atMin}
            onClick={(e) => {
              e.stopPropagation();
              onQuantityChange(id, r.item.quantity - 1);
            }}
            style={stepperButtonStyle(atMin)}
          >
            −
          </button>
          <span
            style={{
              minWidth: 16,
              textAlign: 'center',
              color:
                r.item.quantity === 0
                  ? 'var(--color-crit)'
                  : 'var(--color-text)',
            }}
          >
            {r.item.quantity}
          </span>
          <button
            type="button"
            aria-label={increaseLabel}
            onClick={(e) => {
              e.stopPropagation();
              onQuantityChange(id, r.item.quantity + 1);
            }}
            style={stepperButtonStyle(false)}
          >
            +
          </button>
        </span>
        <span style={recPartStyle}>
          {'/ '}
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
    </div>
  );
}

export const InventoryRow = memo(InventoryRowImpl);
