import {
  memo,
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Caption,
  NumberDisplay,
  Panel,
  StatusPill,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { useInventory } from '@/features/inventory';
import {
  loadCheckedItems,
  saveCheckedItems,
} from '@/features/inventory/utils/shoppingChecked';
import { createQuantity, type ItemId } from '@/shared/types';
import type { DesignStatus } from '@/shared/utils/designStatus';
import type { TFunction } from 'i18next';

function mobileShoppingLabel(
  themeKey: string,
  p: DesignStatus,
  t: TFunction,
): string {
  if (p === 'crit') return t(`v2.shopping.labelNowShort.${themeKey}`);
  if (p === 'warn') return t(`v2.shopping.labelSoon.${themeKey}`);
  return t(`v2.shopping.labelWhen.${themeKey}`);
}

const CONTAINER_STYLE: CSSProperties = {
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};
const SUMMARY_VALUE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  marginTop: 6,
};
const SUMMARY_FOOTNOTE_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-3)',
};
const EMPTY_STATE_STYLE: CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: 'var(--color-text-2)',
};
const ROW_BASE_STYLE: CSSProperties = {
  padding: '11px 14px',
  display: 'grid',
  gridTemplateColumns: '20px 1fr auto',
  gap: 10,
  alignItems: 'center',
};
const CHECK_BUTTON_BASE_STYLE: CSSProperties = {
  width: 16,
  height: 16,
  border: '1.5px solid var(--color-rule)',
  display: 'grid',
  placeItems: 'center',
  color: 'var(--color-accent-ink)',
  fontSize: 10,
  cursor: 'pointer',
};
const ROW_LABEL_STYLE: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--color-text-3)',
  marginTop: 1,
};
const ROW_ACTIONS_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  alignItems: 'flex-end',
};

interface MobileShoppingItem {
  id: string;
  rawId: ItemId;
  name: string;
  q: string;
  need: number;
  currentQty: number;
  p: DesignStatus;
}

export function MobileShopping() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { rows } = useDesignData();
  const { updateItem } = useInventory();
  const [checked, setChecked] =
    useState<Record<string, boolean>>(loadCheckedItems);
  const list: MobileShoppingItem[] = useMemo(
    () =>
      rows
        .filter((r) => r.status !== 'ok' && r.recommended > r.item.quantity)
        .map((r) => ({
          id: String(r.item.id),
          rawId: r.item.id,
          name: r.item.name,
          q: `${r.recommended - r.item.quantity} ${r.item.unit}`,
          need: r.recommended - r.item.quantity,
          currentQty: r.item.quantity,
          p: r.status,
        })),
    [rows],
  );
  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveCheckedItems(next);
      return next;
    });
  }, []);
  const addToInventory = useCallback(
    (rawId: ItemId, currentQty: number, need: number) => {
      updateItem(rawId, { quantity: createQuantity(currentQty + need) });
      setChecked((prev) => {
        const next = { ...prev, [String(rawId)]: true };
        saveCheckedItems(next);
        return next;
      });
    },
    [updateItem],
  );
  const open = list.filter((it) => !checked[it.id]).length;
  const addBtnLabel = t(`v2.shopping.addBtn.${themeKey}`);

  return (
    <div style={CONTAINER_STYLE}>
      <Panel padding={14}>
        <Caption>{t(`v2.shopping.mobileOpen.${themeKey}`)}</Caption>
        <div style={SUMMARY_VALUE_ROW_STYLE}>
          <NumberDisplay
            value={open}
            size={32}
            tone={open > 0 ? 'warn' : 'ok'}
          />
          <span style={SUMMARY_FOOTNOTE_STYLE}>
            · {list.length} {t(`v2.shopping.mobileTotal.${themeKey}`)}
          </span>
        </div>
      </Panel>
      <Panel padding={0}>
        {list.length === 0 && (
          <div style={EMPTY_STATE_STYLE}>
            {t(`v2.shopping.emptyShort.${themeKey}`)}
          </div>
        )}
        {list.map((it, i) => (
          <MobileShoppingRow
            key={it.id}
            item={it}
            isDone={!!checked[it.id]}
            isLast={i === list.length - 1}
            themeKey={themeKey}
            statusLabel={mobileShoppingLabel(themeKey, it.p, t)}
            addBtnLabel={addBtnLabel}
            addAriaLabel={t('v2.shopping.addBtnAriaShort', {
              q: it.q,
              name: it.name,
            })}
            checkAriaLabel={t('v2.shopping.markDoneAria', { name: it.name })}
            onToggle={toggle}
            onAdd={addToInventory}
          />
        ))}
      </Panel>
    </div>
  );
}

interface MobileShoppingRowProps {
  item: MobileShoppingItem;
  isDone: boolean;
  isLast: boolean;
  themeKey: string;
  statusLabel: string;
  addBtnLabel: string;
  addAriaLabel: string;
  checkAriaLabel: string;
  onToggle: (id: string) => void;
  onAdd: (rawId: ItemId, currentQty: number, need: number) => void;
}

function MobileShoppingRowImpl({
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
}: Readonly<MobileShoppingRowProps>) {
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
      <div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text)',
            fontWeight: 500,
            textDecoration: isDone ? 'line-through' : 'none',
          }}
        >
          {it.name}
        </div>
        <div style={ROW_LABEL_STYLE}>{it.q}</div>
      </div>
      <div style={ROW_ACTIONS_STYLE}>
        <StatusPill status={it.p}>{statusLabel}</StatusPill>
        <Button
          variant="secondary"
          onClick={() => onAdd(it.rawId, it.currentQty, it.need)}
          ariaLabel={addAriaLabel}
        >
          {addBtnLabel}
        </Button>
      </div>
    </div>
  );
}

const MobileShoppingRow = memo(MobileShoppingRowImpl);
