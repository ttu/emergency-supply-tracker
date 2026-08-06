import { memo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { CAPS_STYLE } from '@/shared/components/design-v2/primitives';
import type { MissingRecommendedItem } from '@/shared/hooks/useMissingRecommendedItems';

interface MissingItemsTableProps {
  items: MissingRecommendedItem[];
  onAdd: (templateId: string) => void;
}

const CELL_STYLES: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '80px minmax(160px, 1fr) 140px 90px',
  columnGap: 12,
  padding: '12px 20px',
  alignItems: 'center',
  fontSize: 13,
};

const HEADER_STYLE: CSSProperties = {
  ...CELL_STYLES,
  padding: '10px 20px',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  ...CAPS_STYLE,
  color: 'var(--color-text-3)',
  fontWeight: 600,
  borderBottom: '1px solid var(--color-rule-soft)',
  background: 'var(--color-panel-2)',
};

const EMPTY_STATE_STYLE: CSSProperties = {
  padding: 32,
  textAlign: 'center',
  color: 'var(--color-text-2)',
};

const CODE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-3)',
};

const NAME_STYLE: CSSProperties = {
  color: 'var(--color-text)',
  fontWeight: 500,
};

const TARGET_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--color-text-2)',
  textAlign: 'right',
};

const ADD_BUTTON_STYLE: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-text-2)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  padding: '4px 10px',
  cursor: 'pointer',
  borderRadius: 'var(--radius-pill)',
  letterSpacing: '0.08em',
  fontWeight: 700,
  lineHeight: 1,
};

/**
 * The recommended products the household has none of, with the target quantity
 * and a shortcut to add one pre-filled from the product template.
 */
export function MissingItemsTable({
  items,
  onAdd,
}: Readonly<MissingItemsTableProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();

  return (
    <>
      <div style={HEADER_STYLE}>
        <span>{t('v2.inventory.tableCategory')}</span>
        <span>{t('v2.inventory.tableItem')}</span>
        <span style={TARGET_STYLE}>{t(`v2.voice.rec.${themeKey}`)}</span>
        <span />
      </div>

      {items.length === 0 && (
        <div style={EMPTY_STATE_STYLE}>
          {t(`v2.inventory.missingEmpty.${themeKey}`)}
        </div>
      )}

      {items.map((m, i) => (
        <MissingItemRow
          key={String(m.definition.id)}
          missing={m}
          isLast={i === items.length - 1}
          onAdd={onAdd}
          addLabel={t(`v2.inventory.missingAdd.${themeKey}`)}
        />
      ))}
    </>
  );
}

interface MissingItemRowProps {
  missing: MissingRecommendedItem;
  isLast: boolean;
  onAdd: (templateId: string) => void;
  addLabel: string;
}

function MissingItemRowImpl({
  missing,
  isLast,
  onAdd,
  addLabel,
}: Readonly<MissingItemRowProps>) {
  const { t } = useTranslation(['common', 'products']);
  const id = String(missing.definition.id);
  // i18nKey already carries the "products." prefix; the products namespace
  // is keyed without it.
  const name = t(missing.definition.i18nKey.replace('products.', ''), {
    ns: 'products',
  });

  return (
    <div
      style={{
        ...CELL_STYLES,
        borderBottom: isLast ? 'none' : '1px solid var(--color-rule-soft)',
      }}
      data-testid="v2-missing-row"
    >
      <span style={CODE_STYLE}>{missing.categoryCode}</span>
      <span style={NAME_STYLE}>{name}</span>
      <span style={TARGET_STYLE}>
        {missing.recommended} {t(missing.definition.unit, { ns: 'units' })}
      </span>
      <button type="button" onClick={() => onAdd(id)} style={ADD_BUTTON_STYLE}>
        {addLabel}
      </button>
    </div>
  );
}

const MissingItemRow = memo(MissingItemRowImpl);
