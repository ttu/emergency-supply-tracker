import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Button,
  NumberDisplay,
  Panel,
  StatusDot,
  Title,
} from '@/shared/components/design-v2/primitives';
import { ConfirmDialog } from '@/shared/components/design-v2/ConfirmDialog';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { ItemForm } from '@/features/inventory';
import { InventoryItemFactory } from '@/features/inventory/factories/InventoryItemFactory';
import type { ProductTemplate } from '@/shared/types';
import { useItemDetailState } from '@/features/inventory/hooks/useItemDetailState';
import { ItemNotFound } from './ItemNotFound';
import { NewItemTemplateStep } from './NewItemTemplateStep';

interface MobileItemDetailProps {
  itemId: string;
  onBack: () => void;
  defaultCategoryId?: string;
  /** Recommended product to pre-fill a new item from. */
  templateId?: string;
}

function mobileDetailTitle(
  isNew: boolean,
  themeKey: string,
  itemName: string | undefined,
  t: TFunction,
): string | undefined {
  if (!isNew) return itemName;
  return t(`v2.itemDetail.titleNew.${themeKey}`);
}

export function MobileItemDetail({
  itemId,
  onBack,
  defaultCategoryId,
  templateId,
}: Readonly<MobileItemDetailProps>) {
  const { t } = useTranslation();
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
  } = useItemDetailState(itemId, onBack, effectiveTemplateId);

  if (!isNew && !row) {
    return <ItemNotFound onBack={onBack} padding={24} />;
  }

  // Adding without a product chosen yet: offer the recommended list first, the
  // way v1 does, instead of dropping the user straight into a blank form.
  if (isNew && !effectiveTemplateId && !skipTemplate) {
    return (
      <div style={{ padding: 16 }}>
        <NewItemTemplateStep
          defaultCategoryId={defaultCategoryId}
          onSelectTemplate={onTemplateChosen}
          onSelectCustomTemplate={onCustomTemplateChosen}
          onSelectCustom={() => setSkipTemplate(true)}
        />
      </div>
    );
  }

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
        ← {t(`v2.voice.inventory.${themeKey}`)}
      </button>
      <div>
        <Title size={22}>
          {mobileDetailTitle(isNew, themeKey, item?.name, t)}
        </Title>
        {item && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-3)',
              marginTop: 4,
            }}
          >
            {String(item.id).slice(0, 12)} · {row?.categoryCode}
          </div>
        )}
      </div>

      {!isNew && item && (
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
              {item.quantity}/{row?.recommended || '—'} {item.unit}
            </span>
          </div>
        </Panel>
      )}

      <Panel padding={0}>
        <div className="design-v2-embed" style={{ padding: 14 }}>
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

      {!isNew && (
        <Button variant="ghost" full onClick={handleDelete}>
          {t(`v2.voice.delete.${themeKey}`)}
        </Button>
      )}

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
