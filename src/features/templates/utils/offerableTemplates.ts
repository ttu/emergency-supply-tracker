import type { ProductTemplateId } from '@/shared/types';

/** The parts of a recommended item this filter needs to judge it. */
interface OfferableCandidate {
  id: ProductTemplateId;
  category: string;
}

/**
 * The products worth offering when adding an item.
 *
 * The household can switch off individual recommendations and whole
 * categories, and both settings already remove them from the dashboard, the
 * coverage maths and the shopping list. Offering them in the add-item picker
 * anyway leads the user straight back to something they chose to ignore, so
 * the same two settings decide what the picker shows.
 *
 * Categories the household added itself cannot be disabled, so they pass
 * through as long as they are in `enabledCategoryIds`.
 *
 * @param templates - Products already narrowed to those this household needs
 * @param disabledRecommendedItems - Product ids the household switched off
 * @param enabledCategoryIds - Categories still in play, standard and custom
 */
export function offerableTemplates<T extends OfferableCandidate>(
  templates: T[],
  disabledRecommendedItems: ProductTemplateId[],
  enabledCategoryIds: string[],
): T[] {
  const disabled = new Set(disabledRecommendedItems.map(String));
  const enabled = new Set(enabledCategoryIds.map(String));
  return templates.filter(
    (template) =>
      !disabled.has(String(template.id)) &&
      enabled.has(String(template.category)),
  );
}
