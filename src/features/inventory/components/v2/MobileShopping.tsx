import { useMemo, useState } from 'react';
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
import { createQuantity } from '@/shared/types';
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

export function MobileShopping() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { rows } = useDesignData();
  const { updateItem } = useInventory();
  const [checked, setChecked] =
    useState<Record<string, boolean>>(loadCheckedItems);
  const list = useMemo(
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
  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    saveCheckedItems(next);
  };
  const addToInventory = (
    rawId: (typeof list)[number]['rawId'],
    currentQty: number,
    need: number,
  ) => {
    updateItem(rawId, { quantity: createQuantity(currentQty + need) });
    const next = { ...checked, [String(rawId)]: true };
    setChecked(next);
    saveCheckedItems(next);
  };
  const open = list.filter((it) => !checked[it.id]).length;

  const labelFor = (p: DesignStatus) => mobileShoppingLabel(themeKey, p, t);

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <Panel padding={14}>
        <Caption>{t(`v2.shopping.mobileOpen.${themeKey}`)}</Caption>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 6,
          }}
        >
          <NumberDisplay
            value={open}
            size={32}
            tone={open > 0 ? 'warn' : 'ok'}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-3)',
            }}
          >
            · {list.length} {t(`v2.shopping.mobileTotal.${themeKey}`)}
          </span>
        </div>
      </Panel>
      <Panel padding={0}>
        {list.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--color-text-2)',
            }}
          >
            {t(`v2.shopping.emptyShort.${themeKey}`)}
          </div>
        )}
        {list.map((it, i) => {
          const isDone = !!checked[it.id];
          return (
            <div
              key={it.id}
              style={{
                padding: '11px 14px',
                display: 'grid',
                gridTemplateColumns: '20px 1fr auto',
                gap: 10,
                alignItems: 'center',
                borderBottom:
                  i < list.length - 1
                    ? '1px solid var(--color-rule-soft)'
                    : 'none',
                opacity: isDone ? 0.4 : 1,
              }}
            >
              <button
                type="button"
                onClick={() => toggle(it.id)}
                aria-pressed={isDone}
                aria-label={t('v2.shopping.markDoneAria', { name: it.name })}
                style={{
                  width: 16,
                  height: 16,
                  border: '1.5px solid var(--color-rule)',
                  borderRadius: themeKey === 'pantry' ? 4 : 0,
                  background: isDone ? 'var(--color-accent)' : 'transparent',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--color-accent-ink)',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
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
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                    marginTop: 1,
                  }}
                >
                  {it.q}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  alignItems: 'flex-end',
                }}
              >
                <StatusPill status={it.p}>{labelFor(it.p)}</StatusPill>
                <Button
                  variant="secondary"
                  onClick={() =>
                    addToInventory(it.rawId, it.currentQty, it.need)
                  }
                  ariaLabel={t('v2.shopping.addBtnAriaShort', {
                    q: it.q,
                    name: it.name,
                  })}
                >
                  {t(`v2.shopping.addBtn.${themeKey}`)}
                </Button>
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
