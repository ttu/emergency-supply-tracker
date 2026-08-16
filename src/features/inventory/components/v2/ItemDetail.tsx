import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Caption, Panel } from '@/shared/components/design-v2/primitives';
import { ConfirmDialog } from '@/shared/components/design-v2/ConfirmDialog';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { ItemForm } from '@/features/inventory';
import { InventoryItemFactory } from '@/features/inventory/factories/InventoryItemFactory';
import type { ProductTemplate } from '@/shared/types';
import { useItemDetailState } from '@/features/inventory/hooks/useItemDetailState';
import { resolveCategoryLabel } from '@/shared/i18n/categoryLabel';
import { ItemDetailBreadcrumb } from './ItemDetailBreadcrumb';
import { ItemDetailHeader } from './ItemDetailHeader';
import { ItemNotFound } from './ItemNotFound';
import { NewItemTemplateStep } from './NewItemTemplateStep';
import { ItemStatusPanel } from './ItemStatusPanel';
import { ItemTotalsPanel } from './ItemTotalsPanel';
import { ItemOpsPanel } from './ItemOpsPanel';

// Re-exported so existing callers can keep `import { NEW_ITEM_ID } from
// './ItemDetail'`; the canonical export lives on the shared hook.
export { NEW_ITEM_ID } from '@/features/inventory/hooks/useItemDetailState';

interface ItemDetailProps {
  itemId: string;
  onBack: () => void;
  /** When opening as a new-item view, an optional category to preselect. */
  defaultCategoryId?: string;
  /** Recommended product to pre-fill a new item from. */
  templateId?: string;
  /** Existing item to duplicate into a new one. */
  copySourceId?: string;
  /** Start a duplicate of the item currently open. */
  onCopy?: (itemId: string) => void;
}

export function ItemDetail({
  itemId,
  onBack,
  defaultCategoryId,
  templateId,
  copySourceId,
  onCopy,
}: Readonly<ItemDetailProps>) {
  const { t, i18n } = useTranslation();
  const { themeKey } = useDesignTheme();
  // The picker's outcome lives here rather than in the parent: it only
  // matters while this add-view is mounted.
  const [chosenTemplateId, setChosenTemplateId] = useState<string | undefined>(
    undefined,
  );
  const [customTemplate, setCustomTemplate] = useState<
    ProductTemplate | undefined
  >(undefined);
  const [skipTemplate, setSkipTemplate] = useState(false);
  const effectiveTemplateId = templateId ?? chosenTemplateId;
  const onTemplateChosen = (id: string) => setChosenTemplateId(id);
  const onCustomTemplateChosen = (template: ProductTemplate) => {
    setCustomTemplate(template);
    setSkipTemplate(true);
  };
  const customDraft = useMemo(
    () =>
      customTemplate
        ? InventoryItemFactory.createDraftFromCustomTemplate(customTemplate, {
            quantity: 0,
          })
        : undefined,
    [customTemplate],
  );
  const {
    isNew,
    draft,
    template,
    row,
    item,
    category,
    status,
    pct,
    categories,
    locationSuggestions,
    handleSubmit,
    handleDelete,
    deleteConfirmOpen,
    deleteConfirmTitle,
    deleteConfirmMessage,
    deleteConfirmAction,
    confirmDelete,
    cancelDelete,
    adjust,
  } = useItemDetailState(itemId, onBack, effectiveTemplateId, copySourceId);

  if (!isNew && !row) {
    return <ItemNotFound onBack={onBack} />;
  }

  // Adding without a product chosen yet: offer the recommended list first, the
  // way v1 does, instead of dropping the user straight into a blank form.
  if (isNew && !effectiveTemplateId && !copySourceId && !skipTemplate) {
    return (
      <NewItemTemplateStep
        defaultCategoryId={defaultCategoryId}
        onSelectTemplate={onTemplateChosen}
        onSelectCustomTemplate={onCustomTemplateChosen}
        onSelectCustom={() => setSkipTemplate(true)}
      />
    );
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
        categoryName={
          item
            ? resolveCategoryLabel(
                category,
                String(item.categoryId),
                i18n.language || 'en',
                t,
              )
            : undefined
        }
        onDelete={handleDelete}
        onCopy={onCopy && item ? () => onCopy(String(item.id)) : undefined}
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
              item={item ?? draft ?? customDraft}
              templateWeightGramsPerUnit={template?.weightGramsPerUnit}
              templateCaloriesPer100g={template?.caloriesPer100g}
              templateRequiresWaterLiters={template?.requiresWaterLiters}
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

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={deleteConfirmTitle}
        message={deleteConfirmMessage}
        confirmLabel={deleteConfirmAction}
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
