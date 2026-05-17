import { useMemo, useState } from 'react';
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
import { createQuantity } from '@/shared/types';
import type { DesignStatus } from '@/shared/utils/designStatus';

const SHOPPING_KEY = 'est:design:shopping-checked';

function loadChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(SHOPPING_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}
function saveChecked(state: Record<string, boolean>) {
  try {
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const PANTRY_SHOPPING_LABELS: Record<DesignStatus, string> = {
  crit: 'Now',
  warn: 'Soon',
  ok: 'When',
};
const CAPS_SHOPPING_LABELS: Record<DesignStatus, string> = {
  crit: 'NOW',
  warn: 'SOON',
  ok: 'WHEN',
};

function mobileShoppingLabel(themeKey: string, p: DesignStatus): string {
  const labels =
    themeKey === 'pantry' ? PANTRY_SHOPPING_LABELS : CAPS_SHOPPING_LABELS;
  return labels[p];
}

export function MobileShopping() {
  const { themeKey } = useDesignTheme();
  const { rows } = useDesignData();
  const { updateItem } = useInventory();
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);
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
    saveChecked(next);
  };
  const addToInventory = (
    rawId: (typeof list)[number]['rawId'],
    currentQty: number,
    need: number,
  ) => {
    updateItem(rawId, { quantity: createQuantity(currentQty + need) });
    const next = { ...checked, [String(rawId)]: true };
    setChecked(next);
    saveChecked(next);
  };
  const open = list.filter((it) => !checked[it.id]).length;

  const labelFor = (p: DesignStatus) => mobileShoppingLabel(themeKey, p);

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <Panel padding={14}>
        <Caption>{themeKey === 'pantry' ? 'To buy' : 'OPEN'}</Caption>
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
            · {list.length} {themeKey === 'pantry' ? 'items' : 'TOTAL'}
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
            {themeKey === 'pantry' ? 'Nothing on the list.' : 'NIL'}
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
                aria-label={`Mark ${it.name} done`}
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
                  ariaLabel={`Add ${it.q} to ${it.name}`}
                >
                  {themeKey === 'pantry' ? '+ Add' : '+ ADD'}
                </Button>
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
