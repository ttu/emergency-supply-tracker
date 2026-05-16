import { Caption, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import {
  useInventory,
  useLocationSuggestions,
  ItemForm,
} from '@/features/inventory';
import { createQuantity, type InventoryItem } from '@/shared/types';
import { statusOf } from '@/shared/utils/designStatus';
import { ItemDetailBreadcrumb } from './ItemDetailBreadcrumb';
import { ItemDetailHeader } from './ItemDetailHeader';
import { ItemStatusPanel } from './ItemStatusPanel';
import { ItemTotalsPanel } from './ItemTotalsPanel';
import { ItemOpsPanel } from './ItemOpsPanel';

/** Sentinel id used when navigating to ItemDetail to add a new item. */
export const NEW_ITEM_ID = '__new__';

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
  const { themeKey } = useDesignTheme();
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 1100,
      }}
    >
      <ItemDetailBreadcrumb
        itemId={item ? String(item.id) : undefined}
        itemCategoryId={item ? String(item.categoryId) : undefined}
        defaultCategoryId={defaultCategoryId}
        onBack={onBack}
      />
      <ItemDetailHeader
        isNew={isNew}
        itemName={item?.name}
        itemCategoryId={item ? String(item.categoryId) : undefined}
        categoryName={cat?.name}
        onDelete={handleDelete}
      />

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

        {!isNew && item && row && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ItemStatusPanel
              status={status}
              pct={pct}
              quantity={item.quantity}
              recommended={row.recommended}
              unit={item.unit}
            />
            <ItemTotalsPanel item={item} />
            <ItemOpsPanel itemName={item.name} onAdjust={adjust} />
          </div>
        )}
      </div>
    </div>
  );
}
