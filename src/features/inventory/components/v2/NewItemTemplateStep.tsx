import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Caption, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useHousehold } from '@/features/household';
import { useInventory } from '@/features/inventory';
import { useRecommendedItems } from '@/features/templates';
import { ProductPicker } from './ProductPicker';
import { calculateRecommendedQuantity } from '@/shared/utils/calculations/recommendedQuantity';
import { offerableTemplates } from '@/features/templates/utils/offerableTemplates';
import type {
  ProductTemplate,
  RecommendedItemDefinition,
} from '@/shared/types';

interface NewItemTemplateStepProps {
  /** Category to focus the picker on, when the user arrived from one. */
  defaultCategoryId?: string;
  onSelectTemplate: (templateId: string) => void;
  onSelectCustomTemplate: (template: ProductTemplate) => void;
  onSelectCustom: () => void;
}

/**
 * The step v2 was missing before the blank item form: pick a recommended
 * product (which pre-fills unit, weight, calories and default expiry) or opt
 * out to a custom item.
 *
 * The picker itself is `ProductPicker`, drawn natively in the v2 language —
 * category rail, product rows, recommended amounts. This component's job is
 * only to decide which products this household should be offered.
 */
export function NewItemTemplateStep({
  defaultCategoryId,
  onSelectTemplate,
  onSelectCustomTemplate,
  onSelectCustom,
}: Readonly<NewItemTemplateStepProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { household } = useHousehold();
  // `categories` is the provider's enabled set — standard categories the
  // household has not switched off, plus its own.
  const { customTemplates, categories, disabledRecommendedItems } =
    useInventory();
  const { recommendedItems } = useRecommendedItems();

  // Products that scale to nothing for this household (pet supplies with no
  // pets, freezer items with no freezer) are not offered, nor are the ones
  // the household has switched off.
  const applicable = useMemo(() => {
    const needed = recommendedItems.filter(
      (item: RecommendedItemDefinition) =>
        calculateRecommendedQuantity(item, household) > 0,
    );
    return offerableTemplates(
      needed,
      disabledRecommendedItems,
      categories.map((c) => String(c.id)),
    );
  }, [recommendedItems, household, disabledRecommendedItems, categories]);

  return (
    <Panel padding={0}>
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-rule-soft)',
        }}
      >
        <Caption>{t(`v2.itemDetail.pickTemplate.${themeKey}`)}</Caption>
      </div>
      <div style={{ padding: 20 }}>
        <ProductPicker
          templates={applicable}
          categories={categories}
          initialCategoryId={defaultCategoryId ?? ''}
          customTemplates={customTemplates}
          onSelectTemplate={(template) => onSelectTemplate(String(template.id))}
          onSelectCustomTemplate={onSelectCustomTemplate}
          onSelectCustom={onSelectCustom}
        />
      </div>
    </Panel>
  );
}
