import { useMemo, useState, type CSSProperties } from 'react';
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
import { useDesignData } from '@/shared/hooks/useDesignData';
import { useInventory } from '@/features/inventory';
import { createQuantity, type ItemId } from '@/shared/types';
import type { DesignStatus } from '@/shared/utils/designStatus';
import type { TFunction } from 'i18next';

const STORAGE_KEY = 'est:design:shopping-checked';

function loadChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveChecked(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function shoppingLabel(
  themeKey: string,
  p: DesignStatus,
  t: TFunction,
): string {
  if (p === 'crit') return t(`v2.shopping.labelNow.${themeKey}`);
  if (p === 'warn') return t(`v2.shopping.labelSoon.${themeKey}`);
  return t(`v2.shopping.labelWhen.${themeKey}`);
}

function critFirstShopping(
  a: { priority: string },
  b: { priority: string },
): number {
  if (a.priority === 'crit') return -1;
  if (b.priority === 'crit') return 1;
  return 0;
}

export function Shopping() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { rows } = useDesignData();
  const { updateItem } = useInventory();
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);

  const list = useMemo(() => {
    return rows
      .filter((r) => r.status !== 'ok' && r.recommended > r.item.quantity)
      .map((r) => ({
        id: String(r.item.id),
        rawId: r.item.id,
        name: r.item.name,
        cat: r.categoryCode,
        need: r.recommended - r.item.quantity,
        currentQty: r.item.quantity,
        unit: r.item.unit,
        priority: r.status,
      }))
      .sort(critFirstShopping);
  }, [rows]);

  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    saveChecked(next);
  };

  const addToInventory = (id: ItemId, currentQty: number, need: number) => {
    updateItem(id, { quantity: createQuantity(currentQty + need) });
    const next = { ...checked, [String(id)]: true };
    setChecked(next);
    saveChecked(next);
  };

  const open = list.filter((it) => !checked[it.id]).length;
  const done = list.filter((it) => checked[it.id]).length;

  const labelFor = (p: DesignStatus) => shoppingLabel(themeKey, p, t);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <Caption>{t(`v2.voice.shopping.${themeKey}`)}</Caption>
          <Title size={32} style={{ marginTop: 4 }}>
            {t(`v2.shopping.title.${themeKey}`)}
          </Title>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Panel padding={0}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-rule-soft)',
            }}
          >
            <Caption>
              {t(`v2.shopping.queueCaption.${themeKey}`, { open, done })}
            </Caption>
          </div>
          {list.length === 0 && (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--color-text-2)',
              }}
            >
              {t(`v2.shopping.empty.${themeKey}`)}
            </div>
          )}
          {list.map((it, i) => {
            const isDone = !!checked[it.id];
            const rowStyle: CSSProperties = {
              padding: '12px 20px',
              display: 'grid',
              gridTemplateColumns: '24px 70px 1fr 80px 90px auto',
              gap: 14,
              alignItems: 'center',
              borderBottom:
                i < list.length - 1
                  ? '1px solid var(--color-rule-soft)'
                  : 'none',
              opacity: isDone ? 0.4 : 1,
            };
            return (
              <div key={it.id} style={rowStyle}>
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
                    color: 'var(--color-accent-ink)',
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {isDone ? '✓' : ''}
                </button>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                  }}
                >
                  {it.cat}
                </span>
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
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-text-2)',
                    textAlign: 'right',
                  }}
                >
                  {it.need} {it.unit}
                </span>
                <StatusPill status={it.priority}>
                  {labelFor(it.priority)}
                </StatusPill>
                <Button
                  variant="secondary"
                  onClick={() =>
                    addToInventory(it.rawId, it.currentQty, it.need)
                  }
                  ariaLabel={t('v2.shopping.addBtnAria', {
                    need: it.need,
                    unit: it.unit,
                    name: it.name,
                  })}
                >
                  {t(`v2.shopping.addBtn.${themeKey}`)}
                </Button>
              </div>
            );
          })}
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel padding={20}>
            <Caption>{t(`v2.shopping.itemsToBuy.${themeKey}`)}</Caption>
            <div style={{ marginTop: 10 }}>
              <NumberDisplay
                value={open}
                size={44}
                tone={open > 0 ? 'warn' : 'ok'}
              />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-3)',
                marginTop: 6,
              }}
            >
              {t(`v2.shopping.doneCount.${themeKey}`, {
                done,
                total: list.length,
              })}
            </div>
          </Panel>
          <Panel padding={20}>
            <Caption>{t(`v2.shopping.tipsCaption.${themeKey}`)}</Caption>
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: 'var(--color-text-2)',
                lineHeight: 1.5,
              }}
            >
              {t(`v2.shopping.tipsBody.${themeKey}`)}
            </div>
            <div style={{ marginTop: 12 }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setChecked({});
                  saveChecked({});
                }}
              >
                {t(`v2.shopping.reset.${themeKey}`)}
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
