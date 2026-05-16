import type { CSSProperties } from 'react';
import {
  Button,
  Caption,
  NumberDisplay,
  Panel,
  StatusBar,
  StatusDot,
  Title,
} from '../primitives';
import { useDesignTheme } from '../useDesignTheme';
import { useDesignData } from '../useDesignData';
import { useInventory, ItemForm } from '@/features/inventory';
import { createQuantity, type InventoryItem } from '@/shared/types';
import { categoryCode } from '../voice';
import { statusOf } from '../status';

interface ItemDetailProps {
  itemId: string;
  onBack: () => void;
}

export function ItemDetail({ itemId, onBack }: ItemDetailProps) {
  const { themeKey, voice } = useDesignTheme();
  const { rows, categories } = useDesignData();
  const { updateItem, deleteItem } = useInventory();
  const row = rows.find((r) => String(r.item.id) === itemId);

  if (!row) {
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

  const item = row.item;
  const cat = row.category;
  const status = statusOf(item, row.recommended);
  const pct = row.recommended
    ? Math.round((item.quantity / row.recommended) * 100)
    : 100;

  const handleSubmit = (
    update: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    updateItem(item.id, update);
    onBack();
  };

  const handleDelete = () => {
    if (
      !confirm(
        themeKey === 'pantry' ? 'Remove this item?' : 'DELETE THIS ITEM?',
      )
    )
      return;
    deleteItem(item.id);
    onBack();
  };

  const adjust = (delta: number) => {
    const next = Math.max(0, item.quantity + delta);
    updateItem(item.id, { quantity: createQuantity(next) });
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
          {categoryCode(String(item.categoryId))}
        </span>
        <span style={{ color: 'var(--color-text-3)' }}>/</span>
        <span style={{ ...breadcrumbStyle, color: 'var(--color-text)' }}>
          {String(item.id).slice(0, 10)}
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
            {item.name}
          </Title>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-3)',
              marginTop: 6,
              letterSpacing: '0.06em',
            }}
          >
            {categoryCode(String(item.categoryId))} ·{' '}
            {cat?.name ?? String(item.categoryId)}
          </div>
        </div>
        <Button variant="secondary" onClick={handleDelete}>
          {voice.delete}
        </Button>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}
      >
        {/* Full v1 ItemForm — gives the v2 page every field the v1 form had:
            Item Type, Item Name, Category, Quantity, Unit, Weight, Calories,
            Water for prep, Never Expires, Expiration, Purchase, Location, Notes. */}
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
          <div className="design-v2-embed" style={{ padding: 20 }}>
            <ItemForm
              item={item}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={onBack}
            />
          </div>
        </Panel>

        {/* Side panels: live status + quick actions */}
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
                {item.quantity} / {row.recommended || '—'} {item.unit}
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
                marginTop: 12,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <Button
                variant="secondary"
                onClick={() => adjust(-1)}
                ariaLabel={`Decrease ${item.name} by 1`}
              >
                −1
              </Button>
              <Button
                variant="secondary"
                onClick={() => adjust(1)}
                ariaLabel={`Increase ${item.name} by 1`}
              >
                +1
              </Button>
              <div style={{ gridColumn: 'span 2' }}>
                <Button variant="secondary" full onClick={() => adjust(-1)}>
                  {themeKey === 'pantry' ? 'Mark consumed' : 'CONSUME'}
                </Button>
              </div>
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-3)',
                letterSpacing: '0.06em',
              }}
            >
              {themeKey === 'pantry'
                ? 'Quick actions write through immediately — no need to save the form.'
                : 'WRITES IMMEDIATELY · INDEPENDENT OF FORM SAVE'}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
