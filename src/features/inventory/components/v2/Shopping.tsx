import { useMemo, useState, type CSSProperties } from 'react';
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

const PANTRY_LABELS: Record<DesignStatus, string> = {
  crit: 'Now',
  warn: 'Soon',
  ok: 'When',
};
const URGENT_LABELS: Record<DesignStatus, string> = {
  crit: 'URGENT',
  warn: 'SOON',
  ok: 'WHEN',
};

function shoppingLabel(themeKey: string, p: DesignStatus): string {
  return (themeKey === 'pantry' ? PANTRY_LABELS : URGENT_LABELS)[p];
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
  const { themeKey, voice } = useDesignTheme();
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

  /** Add the needed amount to the item's inventory quantity and check the row off. */
  const addToInventory = (id: ItemId, currentQty: number, need: number) => {
    updateItem(id, { quantity: createQuantity(currentQty + need) });
    const next = { ...checked, [String(id)]: true };
    setChecked(next);
    saveChecked(next);
  };

  const open = list.filter((it) => !checked[it.id]).length;
  const done = list.filter((it) => checked[it.id]).length;

  const labelFor = (p: DesignStatus) => shoppingLabel(themeKey, p);

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
          <Caption>{voice.shopping}</Caption>
          <Title size={32} style={{ marginTop: 4 }}>
            {themeKey === 'pantry' ? 'What to buy next' : 'PROCUREMENT QUEUE'}
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
              {themeKey === 'pantry'
                ? `${open} open · ${done} done`
                : `QUEUE · ${open} OPEN · ${done} DONE`}
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
              {themeKey === 'pantry'
                ? 'Nothing on the list. We’ll suggest items when stock runs low.'
                : 'NIL · NO PROCUREMENT REQUIRED'}
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
                  aria-label={`Mark ${it.name} done`}
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
                  ariaLabel={`Add ${it.need} ${it.unit} to ${it.name}`}
                >
                  {themeKey === 'pantry' ? '+ Add' : '+ ADD'}
                </Button>
              </div>
            );
          })}
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel padding={20}>
            <Caption>
              {themeKey === 'pantry' ? 'Items to buy' : 'OPEN ITEMS'}
            </Caption>
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
              {themeKey === 'pantry'
                ? `${done} already done`
                : `${done} CHECKED · ${list.length} TOTAL`}
            </div>
          </Panel>
          <Panel padding={20}>
            <Caption>{themeKey === 'pantry' ? 'Tips' : 'NOTES'}</Caption>
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: 'var(--color-text-2)',
                lineHeight: 1.5,
              }}
            >
              {themeKey === 'pantry'
                ? 'Check items off as you buy them — they stay checked until you reset the list.'
                : 'CHECK ITEMS WHEN PROCURED. STATE PERSISTS LOCALLY UNTIL CLEARED.'}
            </div>
            <div style={{ marginTop: 12 }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setChecked({});
                  saveChecked({});
                }}
              >
                {themeKey === 'pantry' ? 'Reset list' : 'RESET'}
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
