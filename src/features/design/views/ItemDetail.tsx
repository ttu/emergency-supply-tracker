import { useState, type CSSProperties } from 'react';
import {
  Button,
  Caption,
  Field,
  NumberDisplay,
  Panel,
  StatusBar,
  StatusDot,
  Title,
} from '../primitives';
import { useDesignTheme } from '../useDesignTheme';
import { useDesignData } from '../useDesignData';
import { useInventory } from '@/features/inventory';
import {
  createItemId,
  createQuantity,
  type ItemId,
  type InventoryItem,
} from '@/shared/types';
import { categoryCode } from '../voice';
import { statusOf } from '../status';

interface ItemDetailProps {
  itemId: string;
  onBack: () => void;
}

export function ItemDetail({ itemId, onBack }: ItemDetailProps) {
  const { themeKey, voice } = useDesignTheme();
  const { rows } = useDesignData();
  const { updateItem, deleteItem } = useInventory();
  const row = rows.find((r) => String(r.item.id) === itemId);
  const [draft, setDraft] = useState<InventoryItem | null>(row?.item ?? null);

  if (!row || !draft) {
    return (
      <div style={{ padding: 32, color: 'var(--color-text-2)' }}>
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

  const cat = row.category;
  const status = statusOf(draft, row.recommended);
  const pct = row.recommended
    ? Math.round((draft.quantity / row.recommended) * 100)
    : 100;

  const set = <K extends keyof InventoryItem>(
    key: K,
    value: InventoryItem[K],
  ) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = () => {
    const id = createItemId(String(draft.id) as unknown as ItemId);
    updateItem(id, {
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
    const id = createItemId(String(draft.id) as unknown as ItemId);
    deleteItem(id);
    onBack();
  };

  const adjust = (delta: number) => {
    const next = Math.max(0, draft.quantity + delta);
    set('quantity', createQuantity(next));
  };

  const breadcrumbStyle: CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.08em',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 1100,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            ...breadcrumbStyle,
            color: 'var(--color-text-2)',
          }}
        >
          ← {voice.inventory}
        </button>
        <span style={{ color: 'var(--color-text-3)' }}>/</span>
        <span style={{ ...breadcrumbStyle, color: 'var(--color-text-3)' }}>
          {categoryCode(String(draft.categoryId))}
        </span>
        <span style={{ color: 'var(--color-text-3)' }}>/</span>
        <span style={{ ...breadcrumbStyle, color: 'var(--color-text)' }}>
          {String(draft.id).slice(0, 10)}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <Caption>
            {themeKey === 'pantry' ? 'Item details' : 'ITEM RECORD'}
          </Caption>
          <Title size={32} style={{ marginTop: 4 }}>
            {draft.name}
          </Title>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={remove}>
            {voice.delete}
          </Button>
          <Button variant="secondary" onClick={onBack}>
            {voice.cancel}
          </Button>
          <Button variant="primary" onClick={save}>
            {voice.save}
          </Button>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}
      >
        <Panel padding={0}>
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-rule-soft)',
            }}
          >
            <Caption>
              {themeKey === 'pantry'
                ? 'Item details'
                : 'FIELDS · §1 IDENTIFICATION'}
            </Caption>
          </div>
          <EditableField
            label={themeKey === 'pantry' ? 'Item name' : 'NAME'}
            value={draft.name}
            onChange={(v) => set('name', v)}
            focus
          />
          <Field
            label={themeKey === 'pantry' ? 'Category' : 'CATEGORY'}
            value={`${categoryCode(String(draft.categoryId))} · ${cat?.name ?? ''}`}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              borderBottom: '1px solid var(--color-rule-soft)',
            }}
          >
            <EditableField
              label={voice.qty}
              type="number"
              value={String(draft.quantity)}
              onChange={(v) =>
                set('quantity', createQuantity(Math.max(0, Number(v) || 0)))
              }
            />
            <Field
              label={voice.rec}
              value={`${row.recommended || '—'} ${draft.unit}`}
            />
            <Field
              label={themeKey === 'pantry' ? 'Unit' : 'UNIT'}
              value={draft.unit}
            />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderBottom: '1px solid var(--color-rule-soft)',
            }}
          >
            <EditableField
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
            <EditableField
              label={voice.location}
              value={draft.location ?? ''}
              onChange={(v) => set('location', v)}
            />
          </div>
          <div style={{ padding: '14px 20px' }}>
            <Caption>
              {themeKey === 'pantry' ? 'Notes' : 'NOTES · OPTIONAL'}
            </Caption>
            <textarea
              value={draft.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              style={{
                marginTop: 8,
                width: '100%',
                background: 'var(--color-panel-2)',
                border: '1px solid var(--color-rule)',
                borderRadius: 'var(--radius-sm)',
                padding: 10,
                color: 'var(--color-text)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                resize: 'vertical',
              }}
            />
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel padding={20}>
            <Caption>
              {themeKey === 'pantry' ? 'Status' : 'CURRENT STATUS'}
            </Caption>
            <div
              style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <StatusDot status={status} size={14} />
              <NumberDisplay value={pct} suffix="%" size={42} tone={status} />
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-2)',
                }}
              >
                {themeKey === 'pantry' ? 'of recommended' : 'OF RECOMMENDED'}
                <br />
                {draft.quantity} / {row.recommended || '—'} {draft.unit}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <StatusBar
                ok={status === 'ok' ? 1 : 0}
                warn={status === 'warn' ? 1 : 0}
                crit={status === 'crit' ? 1 : 0}
                total={1}
                height={4}
              />
            </div>
          </Panel>

          <Panel padding={20}>
            <Caption>{themeKey === 'pantry' ? 'Quick actions' : 'OPS'}</Caption>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginTop: 12,
              }}
            >
              <Button variant="secondary" onClick={() => adjust(-1)}>
                −1
              </Button>
              <Button variant="secondary" onClick={() => adjust(1)}>
                +1
              </Button>
              <Button variant="secondary" full onClick={() => adjust(-1)}>
                {themeKey === 'pantry' ? 'Mark consumed' : 'CONSUME'}
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  focus,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  focus?: boolean;
  type?: 'text' | 'number' | 'date';
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        background: focus ? 'var(--color-panel-2)' : 'transparent',
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
        }}
      />
    </div>
  );
}
