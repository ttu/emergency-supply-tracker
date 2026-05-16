import { useMemo, useState, type CSSProperties } from 'react';
import {
  Button,
  Caption,
  NumberDisplay,
  Panel,
  StatusBar,
  StatusDot,
  StatusPill,
  Title,
} from '../primitives';
import { useDesignTheme } from '../useDesignTheme';
import { useDesignData, type DesignItemRow } from '../useDesignData';
import { useInventory } from '@/features/inventory';
import { useDashboardAlerts } from '@/features/dashboard';
import type { AlertType } from '@/features/alerts';
import { categoryCode } from '../voice';
import { statusOf, type DesignStatus } from '../status';
import { createQuantity, type InventoryItem } from '@/shared/types';

const MS_PER_DAY = 86_400_000;

// ── Mobile Dashboard ───────────────────────────────────────────────────────
interface MobileDashboardProps {
  onCategorySelect: (id: string) => void;
}
export function MobileDashboard({ onCategorySelect }: MobileDashboardProps) {
  const { themeKey, voice } = useDesignTheme();
  const { totals, readiness, stats, expiringCount, criticalCount, rows } =
    useDesignData();
  const tone = readiness >= 80 ? 'ok' : readiness >= 60 ? 'warn' : 'crit';
  const priority = [...rows].filter((r) => r.status !== 'ok').slice(0, 4);
  const headline =
    themeKey === 'pantry'
      ? readiness >= 80
        ? 'Mostly ready'
        : 'Needs attention'
      : 'STATUS';

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div>
        <Caption>{voice.greeting}</Caption>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: themeKey === 'pantry' ? 400 : 600,
            letterSpacing: '-0.02em',
            marginTop: 6,
            color: 'var(--color-text)',
          }}
        >
          {headline}
        </div>
      </div>

      <Panel padding={16}>
        <Caption>{voice.readiness}</Caption>
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <NumberDisplay value={readiness} suffix="%" size={48} tone={tone} />
        </div>
        <div style={{ marginTop: 12 }}>
          <StatusBar
            ok={totals.ok}
            warn={totals.warn}
            crit={totals.crit}
            total={Math.max(totals.total, 1)}
            height={5}
          />
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
          }}
        >
          <span style={{ color: 'var(--color-ok)' }}>{totals.ok} OK</span>
          <span style={{ color: 'var(--color-warn)' }}>
            {totals.warn} {voice.statusWarn}
          </span>
          <span style={{ color: 'var(--color-crit)' }}>
            {totals.crit} {voice.statusCrit}
          </span>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Panel padding={14}>
          <Caption>{voice.expiringSoon}</Caption>
          <div style={{ marginTop: 6 }}>
            <NumberDisplay
              value={expiringCount}
              size={32}
              tone={expiringCount > 0 ? 'warn' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={14}>
          <Caption>{voice.critical}</Caption>
          <div style={{ marginTop: 6 }}>
            <NumberDisplay
              value={criticalCount}
              size={32}
              tone={criticalCount > 0 ? 'crit' : 'ok'}
            />
          </div>
        </Panel>
      </div>

      {priority.length > 0 && (
        <Panel padding={0}>
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--color-rule-soft)',
            }}
          >
            <Caption>
              {themeKey === 'pantry' ? 'Needs attention' : 'PRIORITY'}
            </Caption>
          </div>
          {priority.map((r, i) => (
            <div
              key={String(r.item.id)}
              style={{
                padding: '11px 14px',
                display: 'grid',
                gridTemplateColumns: '14px 1fr auto',
                gap: 10,
                alignItems: 'center',
                borderBottom:
                  i < priority.length - 1
                    ? '1px solid var(--color-rule-soft)'
                    : 'none',
              }}
            >
              <StatusDot status={r.status} size={7} />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-text)',
                  }}
                >
                  {r.item.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                    marginTop: 1,
                  }}
                >
                  {r.item.quantity}/{r.recommended || '—'} {r.item.unit}
                </div>
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </Panel>
      )}

      <Panel padding={0}>
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--color-rule-soft)',
          }}
        >
          <Caption>{themeKey === 'pantry' ? 'Categories' : 'COVERAGE'}</Caption>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {stats.slice(0, 6).map((s, i) => {
            const t = s.crit > 0 ? 'crit' : s.warn > 0 ? 'warn' : 'ok';
            return (
              <button
                key={String(s.category.id)}
                type="button"
                onClick={() => onCategorySelect(String(s.category.id))}
                style={{
                  padding: '12px 14px',
                  borderRight:
                    i % 2 === 0 ? '1px solid var(--color-rule-soft)' : 'none',
                  borderBottom:
                    i < 4 ? '1px solid var(--color-rule-soft)' : 'none',
                  background: 'transparent',
                  border: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'inherit',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-text-3)',
                    }}
                  >
                    {categoryCode(String(s.category.id))}
                  </span>
                  <StatusDot status={t} size={6} />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 4,
                    color: 'var(--color-text)',
                  }}
                >
                  {s.category.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    color: 'var(--color-text-2)',
                    marginTop: 4,
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {s.ok}/{s.total}
                </div>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ── Mobile Inventory ───────────────────────────────────────────────────────
interface MobileInventoryProps {
  onItemSelect: (id: string) => void;
  selectedCategoryId?: string;
  onCategoryChange: (id?: string) => void;
  onAddItem: () => void;
}
type FilterKey = 'all' | 'crit' | 'warn' | 'ok' | 'exp';

export function MobileInventory({
  onItemSelect,
  selectedCategoryId,
  onCategoryChange,
  onAddItem,
}: MobileInventoryProps) {
  const { themeKey } = useDesignTheme();
  const { rows, categories } = useDesignData();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return rows.filter((r) => {
      if (
        selectedCategoryId &&
        String(r.item.categoryId) !== selectedCategoryId
      )
        return false;
      if (filter === 'crit' && r.status !== 'crit') return false;
      if (filter === 'warn' && r.status !== 'warn') return false;
      if (filter === 'ok' && r.status !== 'ok') return false;
      if (filter === 'exp') {
        if (!r.item.expirationDate || r.item.neverExpires) return false;
        const days =
          (new Date(r.item.expirationDate).getTime() - now) / MS_PER_DAY;
        if (days < 0 || days >= 30) return false;
      }
      if (search && !r.item.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [rows, filter, search, selectedCategoryId]);

  const chips: Array<[FilterKey, string]> = [
    ['all', themeKey === 'pantry' ? 'All' : 'ALL'],
    ['crit', themeKey === 'pantry' ? 'Out' : 'CRIT'],
    ['warn', themeKey === 'pantry' ? 'Low' : 'WARN'],
    ['ok', 'OK'],
    ['exp', themeKey === 'pantry' ? 'Expiring' : 'EXP'],
  ];

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <Button variant="primary" full onClick={onAddItem}>
        {themeKey === 'pantry' ? '+ Add item' : '+ ADD ITEM'}
      </Button>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={themeKey === 'pantry' ? 'Search items…' : 'SEARCH'}
        aria-label="Search inventory"
        style={{
          background: 'var(--color-panel)',
          border: '1px solid var(--color-rule)',
          color: 'var(--color-text)',
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          width: '100%',
        }}
      />
      <select
        value={selectedCategoryId ?? ''}
        onChange={(e) => onCategoryChange(e.target.value || undefined)}
        aria-label={themeKey === 'pantry' ? 'Category' : 'CATEGORY'}
        style={{
          background: 'var(--color-panel)',
          border: '1px solid var(--color-rule)',
          color: 'var(--color-text)',
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          width: '100%',
        }}
      >
        <option value="">
          {themeKey === 'pantry' ? 'All categories' : 'ALL CATEGORIES'}
        </option>
        {categories.map((c) => (
          <option key={String(c.id)} value={String(c.id)}>
            {c.name}
          </option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
        {chips.map(([k, label]) => {
          const active = filter === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              style={{
                padding: '6px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                color: active ? 'var(--color-accent)' : 'var(--color-text-2)',
                background: 'transparent',
                borderRadius: 'var(--radius-pill)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <Panel padding={0}>
        {filtered.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--color-text-2)',
            }}
          >
            {themeKey === 'pantry' ? 'No items match.' : 'EMPTY · NO MATCH'}
          </div>
        )}
        {filtered.map((r: DesignItemRow, i) => (
          <button
            key={String(r.item.id)}
            type="button"
            onClick={() => onItemSelect(String(r.item.id))}
            style={{
              padding: '12px 14px',
              borderBottom:
                i < filtered.length - 1
                  ? '1px solid var(--color-rule-soft)'
                  : 'none',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 10,
              alignItems: 'center',
              background: 'transparent',
              border: 0,
              fontFamily: 'inherit',
              color: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusDot status={r.status} size={6} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-text)',
                  }}
                >
                  {r.item.name}
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-3)',
                  marginTop: 3,
                }}
              >
                {r.categoryCode} · {r.item.location ?? '—'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color:
                    r.item.quantity === 0
                      ? 'var(--color-crit)'
                      : 'var(--color-text)',
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {r.item.quantity}/{r.recommended || '—'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-3)',
                  marginTop: 1,
                }}
              >
                {r.item.expirationDate ?? '—'}
              </div>
            </div>
          </button>
        ))}
      </Panel>
    </div>
  );
}

// ── Mobile Item Detail ─────────────────────────────────────────────────────
interface MobileItemDetailProps {
  itemId: string;
  onBack: () => void;
}
export function MobileItemDetail({ itemId, onBack }: MobileItemDetailProps) {
  const { themeKey, voice } = useDesignTheme();
  const { rows } = useDesignData();
  const { updateItem, deleteItem } = useInventory();
  const row = rows.find((r) => String(r.item.id) === itemId);
  const [draft, setDraft] = useState<InventoryItem | null>(row?.item ?? null);

  if (!row || !draft) {
    return (
      <div style={{ padding: 24, color: 'var(--color-text-2)' }}>
        Item not found.{' '}
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none',
            border: 0,
            color: 'var(--color-accent)',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  const status = statusOf(draft, row.recommended);
  const pct = row.recommended
    ? Math.round((draft.quantity / row.recommended) * 100)
    : 100;

  const set = <K extends keyof InventoryItem>(
    key: K,
    value: InventoryItem[K],
  ) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = () => {
    updateItem(draft.id, {
      name: draft.name,
      quantity: draft.quantity,
      expirationDate: draft.expirationDate,
      location: draft.location,
      notes: draft.notes,
    });
    onBack();
  };
  const remove = () => {
    if (
      !confirm(
        themeKey === 'pantry' ? 'Remove this item?' : 'DELETE THIS ITEM?',
      )
    )
      return;
    deleteItem(draft.id);
    onBack();
  };
  const adjust = (delta: number) =>
    set('quantity', createQuantity(Math.max(0, draft.quantity + delta)));

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-2)',
          letterSpacing: '0.08em',
          cursor: 'pointer',
          textAlign: 'left',
          padding: 0,
        }}
      >
        ← {voice.inventory}
      </button>
      <div>
        <Title size={22}>{draft.name}</Title>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-3)',
            marginTop: 4,
          }}
        >
          {String(draft.id).slice(0, 12)} · {row.categoryCode}
        </div>
      </div>

      <Panel padding={14}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusDot status={status} size={10} />
          <NumberDisplay value={pct} suffix="%" size={32} tone={status} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-2)',
              marginLeft: 'auto',
            }}
          >
            {draft.quantity}/{row.recommended || '—'} {draft.unit}
          </span>
        </div>
      </Panel>

      <Panel padding={0}>
        <MobileEditField
          label={themeKey === 'pantry' ? 'Item name' : 'NAME'}
          value={draft.name}
          onChange={(v) => set('name', v)}
        />
        <MobileEditField
          label={voice.qty}
          type="number"
          value={String(draft.quantity)}
          onChange={(v) =>
            set('quantity', createQuantity(Math.max(0, Number(v) || 0)))
          }
        />
        <MobileEditField
          label={voice.expires}
          type="date"
          value={draft.expirationDate ?? ''}
          onChange={(v) =>
            set(
              'expirationDate',
              (v || undefined) as InventoryItem['expirationDate'],
            )
          }
        />
        <MobileEditField
          label={voice.location}
          value={draft.location ?? ''}
          onChange={(v) => set('location', v)}
        />
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Button variant="secondary" full onClick={() => adjust(-1)}>
          −1
        </Button>
        <Button variant="secondary" full onClick={() => adjust(1)}>
          +1
        </Button>
      </div>
      <Button variant="primary" full onClick={save}>
        {voice.save}
      </Button>
      <Button variant="ghost" full onClick={remove}>
        {voice.delete}
      </Button>
    </div>
  );
}

function MobileEditField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number' | 'date';
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 'var(--caps-tracking)',
          textTransform:
            'var(--caps-transform)' as CSSProperties['textTransform'],
          color: 'var(--color-text-3)',
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{
          marginTop: 4,
          width: '100%',
          background: 'transparent',
          border: 0,
          outline: 'none',
          fontSize: 16,
          color: 'var(--color-text)',
          fontWeight: 500,
          fontFamily: 'inherit',
          minHeight: 24,
        }}
      />
    </div>
  );
}

// ── Mobile Alerts ──────────────────────────────────────────────────────────
interface MobileAlertsProps {
  onItemSelect: (id: string) => void;
  onCategorySelect: (id: string) => void;
}
export function MobileAlerts({
  onItemSelect,
  onCategorySelect,
}: MobileAlertsProps) {
  const { themeKey, voice } = useDesignTheme();
  const { activeAlerts, handleDismissAlert } = useDashboardAlerts();
  const counts = {
    crit: activeAlerts.filter((a) => a.type === 'critical').length,
    warn: activeAlerts.filter((a) => a.type === 'warning').length,
    info: activeAlerts.filter((a) => a.type === 'info').length,
  };
  const dotFor = (t: AlertType): DesignStatus =>
    t === 'critical' ? 'crit' : t === 'warning' ? 'warn' : 'ok';

  return (
    <div
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        <Panel padding={12}>
          <Caption>{voice.critical}</Caption>
          <div style={{ marginTop: 4 }}>
            <NumberDisplay
              value={counts.crit}
              size={24}
              tone={counts.crit > 0 ? 'crit' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={12}>
          <Caption>{voice.warning}</Caption>
          <div style={{ marginTop: 4 }}>
            <NumberDisplay
              value={counts.warn}
              size={24}
              tone={counts.warn > 0 ? 'warn' : undefined}
            />
          </div>
        </Panel>
        <Panel padding={12}>
          <Caption>{themeKey === 'pantry' ? 'Info' : 'INFO'}</Caption>
          <div style={{ marginTop: 4 }}>
            <NumberDisplay value={counts.info} size={24} />
          </div>
        </Panel>
      </div>
      <Panel padding={0}>
        {activeAlerts.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--color-text-2)',
            }}
          >
            {themeKey === 'pantry' ? 'All clear.' : 'NOMINAL'}
          </div>
        )}
        {activeAlerts.map((a, i) => (
          <div
            key={String(a.id)}
            style={{
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: '12px 1fr auto',
              gap: 10,
              alignItems: 'center',
              borderBottom:
                i < activeAlerts.length - 1
                  ? '1px solid var(--color-rule-soft)'
                  : 'none',
            }}
          >
            <div style={{ marginTop: 5 }}>
              <StatusDot status={dotFor(a.type)} size={7} />
            </div>
            <button
              type="button"
              onClick={
                a.categoryId
                  ? () => onCategorySelect(String(a.categoryId))
                  : a.itemId
                    ? () => onItemSelect(a.itemId!)
                    : undefined
              }
              disabled={!a.categoryId && !a.itemId}
              style={{
                background: 'transparent',
                border: 0,
                textAlign: 'left',
                fontFamily: 'inherit',
                color: 'inherit',
                cursor: a.categoryId || a.itemId ? 'pointer' : 'default',
                padding: 0,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                {a.itemName ?? a.message}
              </div>
              {a.itemName && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-2)',
                    marginTop: 3,
                  }}
                >
                  {a.message}
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDismissAlert(a.id)}
              aria-label="Dismiss alert"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-rule)',
                color: 'var(--color-text-3)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                padding: '3px 8px',
                cursor: 'pointer',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </Panel>
    </div>
  );
}

// ── Mobile Shopping ────────────────────────────────────────────────────────
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
          p: r.status as DesignStatus,
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

  const labelFor = (p: DesignStatus) =>
    themeKey === 'pantry'
      ? p === 'crit'
        ? 'Now'
        : p === 'warn'
          ? 'Soon'
          : 'When'
      : p === 'crit'
        ? 'NOW'
        : p === 'warn'
          ? 'SOON'
          : 'WHEN';

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
