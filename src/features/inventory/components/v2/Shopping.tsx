import { memo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  NumberDisplay,
  Panel,
  StatusPill,
  Title,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import {
  useShoppingList,
  type ShoppingListItem,
} from '@/features/inventory/hooks/useShoppingList';
import type { ItemId } from '@/shared/types';
import type { DesignStatus } from '@/shared/utils/designStatus';
import type { TFunction } from 'i18next';

function shoppingLabel(
  themeKey: string,
  p: DesignStatus,
  t: TFunction,
): string {
  if (p === 'crit') return t(`v2.shopping.labelNow.${themeKey}`);
  if (p === 'warn') return t(`v2.shopping.labelSoon.${themeKey}`);
  return t(`v2.shopping.labelWhen.${themeKey}`);
}

const CONTAINER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};
const HEADER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
};
const COLUMNS_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: 16,
};
const QUEUE_HEADER_STYLE: CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid var(--color-rule-soft)',
};
const EMPTY_STATE_STYLE: CSSProperties = {
  padding: 32,
  textAlign: 'center',
  color: 'var(--color-text-2)',
};
const SIDE_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};
const SIDE_TILE_VALUE_STYLE: CSSProperties = { marginTop: 10 };
const SIDE_TILE_FOOTNOTE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-3)',
  marginTop: 6,
};
const TIPS_BODY_STYLE: CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  color: 'var(--color-text-2)',
  lineHeight: 1.5,
};
const TIPS_BUTTON_WRAP_STYLE: CSSProperties = { marginTop: 12 };

const ROW_BASE_STYLE: CSSProperties = {
  padding: '12px 20px',
  display: 'grid',
  gridTemplateColumns: '24px 70px 1fr 80px 90px auto',
  gap: 14,
  alignItems: 'center',
};
const CHECK_BUTTON_BASE_STYLE: CSSProperties = {
  width: 16,
  height: 16,
  border: '1.5px solid var(--color-rule)',
  color: 'var(--color-accent-ink)',
  fontSize: 11,
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
};
const ROW_CAT_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-3)',
};
const ROW_NEED_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--color-text-2)',
  textAlign: 'right',
};

export function Shopping() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { list, checked, open, done, toggle, addToInventory, reset } =
    useShoppingList();
  const addBtnLabel = t(`v2.shopping.addBtn.${themeKey}`);

  return (
    <div style={CONTAINER_STYLE}>
      <div style={HEADER_STYLE}>
        <div>
          <Caption>{t(`v2.voice.shopping.${themeKey}`)}</Caption>
          <Title size={32} style={{ marginTop: 4 }}>
            {t(`v2.shopping.title.${themeKey}`)}
          </Title>
        </div>
      </div>
      <div style={COLUMNS_STYLE}>
        <Panel padding={0}>
          <div style={QUEUE_HEADER_STYLE}>
            <Caption>
              {t(`v2.shopping.queueCaption.${themeKey}`, { open, done })}
            </Caption>
          </div>
          {list.length === 0 && (
            <div style={EMPTY_STATE_STYLE}>
              {t(`v2.shopping.empty.${themeKey}`)}
            </div>
          )}
          {list.map((it, i) => (
            <ShoppingListRow
              key={it.id}
              item={it}
              isDone={!!checked[it.id]}
              isLast={i === list.length - 1}
              themeKey={themeKey}
              statusLabel={shoppingLabel(themeKey, it.priority, t)}
              addBtnLabel={addBtnLabel}
              addAriaLabel={t('v2.shopping.addBtnAria', {
                need: it.need,
                unit: it.unit,
                name: it.name,
              })}
              checkAriaLabel={t('v2.shopping.markDoneAria', { name: it.name })}
              onToggle={toggle}
              onAdd={addToInventory}
            />
          ))}
        </Panel>
        <div style={SIDE_COLUMN_STYLE}>
          <Panel padding={20}>
            <Caption>{t(`v2.shopping.itemsToBuy.${themeKey}`)}</Caption>
            <div style={SIDE_TILE_VALUE_STYLE}>
              <NumberDisplay
                value={open}
                size={44}
                tone={open > 0 ? 'warn' : 'ok'}
              />
            </div>
            <div style={SIDE_TILE_FOOTNOTE_STYLE}>
              {t(`v2.shopping.doneCount.${themeKey}`, {
                done,
                total: list.length,
              })}
            </div>
          </Panel>
          <Panel padding={20}>
            <Caption>{t(`v2.shopping.tipsCaption.${themeKey}`)}</Caption>
            <div style={TIPS_BODY_STYLE}>
              {t(`v2.shopping.tipsBody.${themeKey}`)}
            </div>
            <div style={TIPS_BUTTON_WRAP_STYLE}>
              <Button variant="secondary" onClick={reset}>
                {t(`v2.shopping.reset.${themeKey}`)}
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

interface ShoppingListRowProps {
  item: ShoppingListItem;
  isDone: boolean;
  isLast: boolean;
  themeKey: string;
  statusLabel: string;
  addBtnLabel: string;
  addAriaLabel: string;
  checkAriaLabel: string;
  onToggle: (id: string) => void;
  onAdd: (id: ItemId, currentQty: number, need: number) => void;
}

function ShoppingListRowImpl({
  item: it,
  isDone,
  isLast,
  themeKey,
  statusLabel,
  addBtnLabel,
  addAriaLabel,
  checkAriaLabel,
  onToggle,
  onAdd,
}: Readonly<ShoppingListRowProps>) {
  const rowStyle: CSSProperties = {
    ...ROW_BASE_STYLE,
    borderBottom: isLast ? 'none' : '1px solid var(--color-rule-soft)',
    opacity: isDone ? 0.4 : 1,
  };
  const checkStyle: CSSProperties = {
    ...CHECK_BUTTON_BASE_STYLE,
    borderRadius: themeKey === 'pantry' ? 4 : 0,
    background: isDone ? 'var(--color-accent)' : 'transparent',
  };
  return (
    <div style={rowStyle}>
      <button
        type="button"
        onClick={() => onToggle(it.id)}
        aria-pressed={isDone}
        aria-label={checkAriaLabel}
        style={checkStyle}
      >
        {isDone ? '✓' : ''}
      </button>
      <span style={ROW_CAT_STYLE}>{it.cat}</span>
      <span
        style={{
          fontSize: 13,
          color: 'var(--color-text)',
          textDecoration: isDone ? 'line-through' : 'none',
          fontWeight: 500,
        }}
      >
        {it.name}
      </span>
      <span style={ROW_NEED_STYLE}>
        {it.need} {it.unit}
      </span>
      <StatusPill status={it.priority}>{statusLabel}</StatusPill>
      <Button
        variant="secondary"
        onClick={() => onAdd(it.rawId, it.currentQty, it.need)}
        ariaLabel={addAriaLabel}
      >
        {addBtnLabel}
      </Button>
    </div>
  );
}

const ShoppingListRow = memo(ShoppingListRowImpl);
