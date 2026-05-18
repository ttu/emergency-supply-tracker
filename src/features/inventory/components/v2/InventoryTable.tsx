import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';
import { InventoryRow } from './InventoryRow';

interface InventoryTableProps {
  rows: DesignItemRow[];
  totalRowCount: number;
  onItemSelect: (id: string) => void;
}

export function InventoryTable({
  rows,
  totalRowCount,
  onItemSelect,
}: Readonly<InventoryTableProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
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
        <span>{t('v2.inventory.tableId')}</span>
        <span>{t('v2.inventory.tableItem')}</span>
        <span>{t('v2.inventory.tableCategory')}</span>
        <span style={{ textAlign: 'right' }}>
          {t(`v2.voice.qty.${themeKey}`)} / {t(`v2.voice.rec.${themeKey}`)}
        </span>
        <span>{t(`v2.voice.expires.${themeKey}`)}</span>
        <span>{t(`v2.voice.location.${themeKey}`)}</span>
        <span>{t('v2.inventory.tableStatus')}</span>
      </div>

      {rows.length === 0 && (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--color-text-2)',
          }}
        >
          {t(`v2.inventory.empty.${themeKey}`)}
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
          {t('v2.inventory.footerShowing', {
            shown: rows.length,
            total: totalRowCount,
          })}
        </span>
      </div>
    </>
  );
}
