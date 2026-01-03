import type { InventoryItem, HouseholdConfig } from '@/shared/types';
import { STANDARD_CATEGORIES } from '@/data/standardCategories';
import {
  MS_PER_DAY,
  EXPIRING_SOON_ALERT_DAYS,
  CRITICALLY_LOW_STOCK_PERCENTAGE,
  LOW_STOCK_PERCENTAGE,
  CUSTOM_ITEM_TYPE,
} from '@/shared/utils/constants';
import { calculateWaterRequirements } from '@/shared/utils/calculations/water';

// Alert type definition (moved from component to avoid circular dependency)
export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  itemName?: string;
}

type TranslationFunction = (
  key: string,
  options?: Record<string, string | number>,
) => string;

/**
 * Get the translated item name for an inventory item.
 * For built-in products, translates using itemType/productTemplateId.
 * For custom items, returns the stored name as-is.
 */
function getTranslatedItemName(
  item: InventoryItem,
  t: TranslationFunction,
): string {
  // Try productTemplateId first (most reliable)
  const templateId = item.productTemplateId || item.itemType;

  // If we have a valid template ID (not custom), translate it
  if (templateId && templateId !== CUSTOM_ITEM_TYPE) {
    try {
      const translated = t(templateId, { ns: 'products' });
      // If translation returns the key itself, it means translation is missing, use original name
      if (translated !== templateId) {
        return translated;
      }
    } catch {
      // Translation failed, fall through to use item.name
    }
  }

  // For custom items or when translation fails, use the stored name
  return item.name;
}

/**
 * Generate alerts for expired items
 */
function generateExpirationAlerts(
  items: InventoryItem[],
  t: TranslationFunction,
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  items.forEach((item) => {
    if (item.neverExpires || !item.expirationDate) {
      return;
    }

    const expirationDate = new Date(item.expirationDate);
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / MS_PER_DAY,
    );

    if (daysUntilExpiration < 0) {
      alerts.push({
        id: `expired-${item.id}`,
        type: 'critical',
        message: t('alerts.expiration.expired'),
        itemName: getTranslatedItemName(item, t),
      });
    } else if (daysUntilExpiration <= EXPIRING_SOON_ALERT_DAYS) {
      alerts.push({
        id: `expiring-soon-${item.id}`,
        type: 'warning',
        message: t('alerts.expiration.expiringSoon', {
          days: daysUntilExpiration,
        }),
        itemName: getTranslatedItemName(item, t),
      });
    }
  });

  return alerts;
}

/**
 * Generate alerts for categories with low stock (aggregated by category)
 */
function generateCategoryStockAlerts(
  items: InventoryItem[],
  t: TranslationFunction,
): Alert[] {
  const alerts: Alert[] = [];

  STANDARD_CATEGORIES.forEach((category) => {
    const categoryItems = items.filter(
      (item) => item.categoryId === category.id,
    );

    if (categoryItems.length === 0) {
      // No items in this category yet
      return;
    }

    // Calculate total quantity vs total recommended for the category
    let totalQuantity = 0;
    let totalRecommended = 0;

    categoryItems.forEach((item) => {
      totalQuantity += item.quantity;
      totalRecommended += item.recommendedQuantity;
    });

    const percentOfRecommended =
      totalRecommended > 0 ? (totalQuantity / totalRecommended) * 100 : 100;

    // Translate category name
    const categoryName = t(category.id, { ns: 'categories' });

    if (totalQuantity === 0) {
      alerts.push({
        id: `category-out-of-stock-${category.id}`,
        type: 'critical',
        message: t('alerts.stock.outOfStock'),
        itemName: categoryName,
      });
    } else if (percentOfRecommended < CRITICALLY_LOW_STOCK_PERCENTAGE) {
      alerts.push({
        id: `category-critically-low-${category.id}`,
        type: 'critical',
        message: t('alerts.stock.criticallyLow', {
          percent: Math.round(percentOfRecommended),
        }),
        itemName: categoryName,
      });
    } else if (percentOfRecommended < LOW_STOCK_PERCENTAGE) {
      alerts.push({
        id: `category-low-stock-${category.id}`,
        type: 'warning',
        message: t('alerts.stock.runningLow', {
          percent: Math.round(percentOfRecommended),
        }),
        itemName: categoryName,
      });
    }
  });

  return alerts;
}

/**
 * Generate alerts for water shortage when food requires more water than available
 */
function generateWaterShortageAlerts(
  items: InventoryItem[],
  household: HouseholdConfig | undefined,
  t: TranslationFunction,
): Alert[] {
  const alerts: Alert[] = [];

  if (!household) {
    return alerts;
  }

  const waterRequirements = calculateWaterRequirements(items);

  if (
    !waterRequirements.hasEnoughWater &&
    waterRequirements.waterShortfall > 0
  ) {
    const shortfall = Math.ceil(waterRequirements.waterShortfall * 10) / 10; // Round to 1 decimal
    alerts.push({
      id: 'water-shortage-preparation',
      type: 'warning',
      message: t('alerts.water.preparationShortage', {
        liters: shortfall,
      }),
    });
  }

  return alerts;
}

/**
 * Generate all alerts for dashboard
 */
export function generateDashboardAlerts(
  items: InventoryItem[],
  t: TranslationFunction,
  household?: HouseholdConfig,
): Alert[] {
  const expirationAlerts = generateExpirationAlerts(items, t);
  const categoryStockAlerts = generateCategoryStockAlerts(items, t);
  const waterShortageAlerts = generateWaterShortageAlerts(items, household, t);

  // Combine alerts (removed item-level critical alerts as they're now covered by category alerts)
  const allAlerts = [
    ...expirationAlerts,
    ...categoryStockAlerts,
    ...waterShortageAlerts,
  ];

  // Sort by priority: critical first, then warning, then info
  const priorityOrder = { critical: 0, warning: 1, info: 2 };
  allAlerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

  return allAlerts;
}

/**
 * Count alerts by type
 */
export function countAlerts(alerts: Alert[]): {
  critical: number;
  warning: number;
  info: number;
  total: number;
} {
  const counts = {
    critical: 0,
    warning: 0,
    info: 0,
    total: alerts.length,
  };

  alerts.forEach((alert) => {
    counts[alert.type]++;
  });

  return counts;
}
