import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { CAPS_STYLE } from '@/shared/components/design-v2/primitives';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';
import { InventoryRow } from './InventoryRow';

interface InventoryTableProps {
  rows: DesignItemRow[];
  totalRowCount: number;
  onItemSelect: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}

/**
 * Sized to fit the panel beside the 232px category rail at 1280px — the
 * narrowest viewport that gets this desktop layout. The previous minimums
 * added up to more than the panel is wide, so the status pills and the
 * location column were clipped off the right edge with no way to reach them.
 * Everything except the item name is monospace of known length, so these are
 * the measured worst cases plus a little air.
 */
const CELL_STYLES: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    '70px minmax(140px, 1fr) 56px 96px 88px minmax(72px, 110px) 72px',
  columnGap: 10,
  padding: '12px 16px',
  alignItems: 'center',
  fontSize: 13,
};

const HEADER_STYLE: CSSProperties = {
  ...CELL_STYLES,
  padding: '10px 16px',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  ...CAPS_STYLE,
  color: 'var(--color-text-3)',
  fontWeight: 600,
  borderBottom: '1px solid var(--color-rule-soft)',
  background: 'var(--color-panel-2)',
};

const HEADER_RIGHT_CELL: CSSProperties = { textAlign: 'right' };

const EMPTY_STATE_STYLE: CSSProperties = {
  padding: 32,
  textAlign: 'center',
  color: 'var(--color-text-2)',
};

const FOOTER_STYLE: CSSProperties = {
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text-3)',
  borderTop: '1px solid var(--color-rule-soft)',
};

export function InventoryTable({
  rows,
  totalRowCount,
  onItemSelect,
  onQuantityChange,
}: Readonly<InventoryTableProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();

  return (
    <div data-testid="v2-inventory-table">
      <div style={HEADER_STYLE}>
        <span>{t('v2.inventory.tableId')}</span>
        <span>{t('v2.inventory.tableItem')}</span>
        <span>{t('v2.inventory.tableCategory')}</span>
        <span style={HEADER_RIGHT_CELL}>
          {t(`v2.voice.qty.${themeKey}`)} / {t(`v2.voice.rec.${themeKey}`)}
        </span>
        <span>{t(`v2.voice.expires.${themeKey}`)}</span>
        <span>{t(`v2.voice.location.${themeKey}`)}</span>
        <span>{t('v2.inventory.tableStatus')}</span>
      </div>

      {rows.length === 0 && (
        <div style={EMPTY_STATE_STYLE}>
          {t(`v2.inventory.empty.${themeKey}`)}
        </div>
      )}

      {rows.map((r, i) => (
        <InventoryRow
          key={String(r.item.id)}
          row={r}
          cellStyles={CELL_STYLES}
          isLast={i === rows.length - 1}
          onSelect={onItemSelect}
          onQuantityChange={onQuantityChange}
        />
      ))}

      <div style={FOOTER_STYLE}>
        <span>
          {t('v2.inventory.footerShowing', {
            shown: rows.length,
            total: totalRowCount,
          })}
        </span>
      </div>
    </div>
  );
}
