import { useTranslation } from 'react-i18next';
import { Caption, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { ItemForm } from '@/features/inventory';
import {
  NEW_ITEM_ID,
  useItemDetailState,
} from '@/features/inventory/hooks/useItemDetailState';
import { ItemDetailBreadcrumb } from './ItemDetailBreadcrumb';
import { ItemDetailHeader } from './ItemDetailHeader';
import { ItemNotFound } from './ItemNotFound';
import { ItemStatusPanel } from './ItemStatusPanel';
import { ItemTotalsPanel } from './ItemTotalsPanel';
import { ItemOpsPanel } from './ItemOpsPanel';

// Re-exported so existing callers can keep `import { NEW_ITEM_ID } from
// './ItemDetail'`; the canonical export lives on the shared hook.
export { NEW_ITEM_ID };

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
}: Readonly<ItemDetailProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const {
    isNew,
    row,
    item,
    category,
    status,
    pct,
    categories,
    locationSuggestions,
    handleSubmit,
    handleDelete,
    adjust,
  } = useItemDetailState(itemId, onBack);

  if (!isNew && !row) {
    return <ItemNotFound onBack={onBack} />;
  }

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
        categoryName={category?.name}
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
            <Caption>{t(`v2.itemDetail.fieldsCaption.${themeKey}`)}</Caption>
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
