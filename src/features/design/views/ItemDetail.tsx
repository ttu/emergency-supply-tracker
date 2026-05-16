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
import {
  useInventory,
  useLocationSuggestions,
  ItemForm,
} from '@/features/inventory';
import { createQuantity, type InventoryItem } from '@/shared/types';

/** Sentinel id used when navigating to ItemDetail to add a new item. */
export const NEW_ITEM_ID = '__new__';
import { categoryCode } from '../voice';
import { statusOf } from '../status';

interface ItemDetailProps {
  itemId: string;
  onBack: () => void;
  /** When opening as a new-item view, an optional category to preselect. */
  defaultCategoryId?: string;
}

export function ItemDetail({
  itemId,
  onBack,
  defaultCategoryId,
}: ItemDetailProps) {
  const { themeKey, voice } = useDesignTheme();
  const { rows, categories } = useDesignData();
  const { items, addItem, updateItem, deleteItem } = useInventory();
  const locationSuggestions = useLocationSuggestions(items);
  const isNew = itemId === NEW_ITEM_ID;
  const row = isNew
    ? undefined
    : rows.find((r) => String(r.item.id) === itemId);

  if (!isNew && !row) {
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

  const item = row?.item;
  const cat = row?.category;
  const status = item ? statusOf(item, row?.recommended ?? 0) : 'ok';
  const pct =
    item && row?.recommended
      ? Math.round((item.quantity / row.recommended) * 100)
      : 0;

  const handleSubmit = (
    update: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (isNew) {
      addItem(update);
    } else if (item) {
      updateItem(item.id, update);
    }
    onBack();
  };

  const handleDelete = () => {
    if (!item) return;
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
    if (!item) return;
    const next = Math.max(0, item.quantity + delta);
    updateItem(item.id, { quantity: createQuantity(next) });
  };

  // Per-unit attribute totals — derived facts that help the user judge
  // how much actual nutrition / weight / water this stack represents.
  const totalCalories =
    item?.caloriesPerUnit !== undefined
      ? item.caloriesPerUnit * item.quantity
      : undefined;
  const totalWeightG =
    item?.weightGrams !== undefined
      ? item.weightGrams * item.quantity
      : undefined;
  const totalWaterL =
    item?.requiresWaterLiters !== undefined
      ? item.requiresWaterLiters * item.quantity
      : undefined;
  const totalCapacityWh =
    item?.capacityWh !== undefined
      ? item.capacityWh * item.quantity
      : undefined;
  const hasTotals =
    totalCalories !== undefined ||
    totalWeightG !== undefined ||
    totalWaterL !== undefined ||
    totalCapacityWh !== undefined;

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
          {item
            ? categoryCode(String(item.categoryId))
            : defaultCategoryId
              ? categoryCode(defaultCategoryId)
              : themeKey === 'pantry'
                ? 'New'
                : 'NEW'}
        </span>
        {item && (
          <>
            <span style={{ color: 'var(--color-text-3)' }}>/</span>
            <span style={{ ...breadcrumbStyle, color: 'var(--color-text)' }}>
              {String(item.id).slice(0, 10)}
            </span>
          </>
        )}
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
            {isNew
              ? themeKey === 'pantry'
                ? 'New item'
                : 'NEW ITEM'
              : themeKey === 'pantry'
                ? 'Item details'
                : 'ITEM RECORD'}
          </Caption>
          <Title size={32} style={{ marginTop: 4 }}>
            {isNew
              ? themeKey === 'pantry'
                ? 'Add an item'
                : 'ADD ITEM'
              : item?.name}
          </Title>
          {item && (
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
          )}
        </div>
        {!isNew && (
          <Button variant="secondary" onClick={handleDelete}>
            {voice.delete}
          </Button>
        )}
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
              defaultCategoryId={defaultCategoryId}
              locationSuggestions={locationSuggestions}
              onSubmit={handleSubmit}
              onCancel={onBack}
            />
          </div>
        </Panel>

        {/* Side panels: live status + quick actions (existing items only). */}
        {!isNew && item && (
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

            {hasTotals && (
              <Panel padding={20}>
                <Caption>
                  {themeKey === 'pantry'
                    ? 'Stack totals'
                    : 'TOTALS · CURRENT QTY'}
                </Caption>
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {totalCalories !== undefined && (
                    <TotalsRow
                      label={
                        themeKey === 'pantry' ? 'Total calories' : 'KCAL TOTAL'
                      }
                      value={totalCalories.toLocaleString()}
                      suffix="kcal"
                      detail={`${item.caloriesPerUnit} kcal × ${item.quantity} ${item.unit}`}
                    />
                  )}
                  {totalWeightG !== undefined && (
                    <TotalsRow
                      label={
                        themeKey === 'pantry' ? 'Total weight' : 'WEIGHT TOTAL'
                      }
                      value={
                        totalWeightG >= 1000
                          ? (totalWeightG / 1000).toFixed(1)
                          : String(totalWeightG)
                      }
                      suffix={totalWeightG >= 1000 ? 'kg' : 'g'}
                      detail={`${item.weightGrams} g × ${item.quantity} ${item.unit}`}
                    />
                  )}
                  {totalWaterL !== undefined && (
                    <TotalsRow
                      label={
                        themeKey === 'pantry'
                          ? 'Water needed to prepare'
                          : 'WATER · PREP'
                      }
                      value={totalWaterL.toFixed(1)}
                      suffix="L"
                      detail={`${item.requiresWaterLiters} L × ${item.quantity} ${item.unit}`}
                    />
                  )}
                  {totalCapacityWh !== undefined && (
                    <TotalsRow
                      label={
                        themeKey === 'pantry'
                          ? 'Total capacity'
                          : 'CAPACITY TOTAL'
                      }
                      value={totalCapacityWh.toLocaleString()}
                      suffix="Wh"
                      detail={`${item.capacityWh} Wh × ${item.quantity} ${item.unit}`}
                    />
                  )}
                </div>
              </Panel>
            )}

            <Panel padding={20}>
              <Caption>
                {themeKey === 'pantry' ? 'Quick actions' : 'OPS'}
              </Caption>
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
        )}
      </div>
    </div>
  );
}

function TotalsRow({
  label,
  value,
  suffix,
  detail,
}: {
  label: string;
  value: string;
  suffix: string;
  detail: string;
}) {
  return (
    <div>
      <Caption>{label}</Caption>
      <div
        style={{
          marginTop: 4,
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        <NumberDisplay value={value} size={28} />
        <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>
          {suffix}
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-text-3)',
          marginTop: 2,
          letterSpacing: '0.04em',
        }}
      >
        {detail}
      </div>
    </div>
  );
}
