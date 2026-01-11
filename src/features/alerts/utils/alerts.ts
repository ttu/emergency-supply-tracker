import type { InventoryItem, HouseholdConfig } from '@/shared/types';
import { createAlertId, isFoodCategory } from '@/shared/types';
import { STANDARD_CATEGORIES } from '@/features/categories';
import {
  EXPIRING_SOON_ALERT_DAYS,
  CRITICALLY_LOW_STOCK_PERCENTAGE,
  LOW_STOCK_PERCENTAGE,
  CUSTOM_ITEM_TYPE,
} from '@/shared/utils/constants';
import { calculateWaterRequirements } from '@/shared/utils/calculations/water';
import { getDaysUntilExpiration } from '@/features/inventory/utils/status';
import { calculateCategoryShortages } from '@/features/dashboard/utils/categoryStatus';
import type { Alert, AlertCounts, TranslationFunction } from '../types';
import { ALERT_PRIORITY } from '../types';

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
 *
 * Uses date-only comparison to avoid timezone issues.
 */
function generateExpirationAlerts(
  items: InventoryItem[],
  t: TranslationFunction,
): Alert[] {
  const alerts: Alert[] = [];

  items.forEach((item) => {
    if (item.neverExpires || !item.expirationDate) {
      return;
    }

    const daysUntilExpiration = getDaysUntilExpiration(
      item.expirationDate,
      item.neverExpires,
    );

    if (daysUntilExpiration === undefined) {
      return;
    }

    if (daysUntilExpiration < 0) {
      alerts.push({
        id: createAlertId(`expired-${item.id}`),
        type: 'critical',
        message: t('alerts.expiration.expired'),
        itemName: getTranslatedItemName(item, t),
      });
    } else if (daysUntilExpiration <= EXPIRING_SOON_ALERT_DAYS) {
      alerts.push({
        id: createAlertId(`expiring-soon-${item.id}`),
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
 * For food category, uses calorie-based calculations instead of quantity-based.
 */
function generateCategoryStockAlerts(
  items: InventoryItem[],
  t: TranslationFunction,
  household?: HouseholdConfig,
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

    const isFood = category.standardCategoryId
      ? isFoodCategory(category.standardCategoryId)
      : isFoodCategory(category.id as string);
    let percentOfRecommended: number;
    let hasEnough = false;

    // For food category, use calorie-based calculation if household is available
    if (isFood && household) {
      const shortageInfo = calculateCategoryShortages(
        category.id,
        items,
        household,
      );

      // Check if we have enough calories
      hasEnough =
        (shortageInfo.totalActualCalories ?? 0) >=
        (shortageInfo.totalNeededCalories ?? 0);

      if (
        shortageInfo.totalNeededCalories &&
        shortageInfo.totalNeededCalories > 0
      ) {
        percentOfRecommended =
          ((shortageInfo.totalActualCalories ?? 0) /
            shortageInfo.totalNeededCalories) *
          100;
      } else {
        percentOfRecommended = 100;
      }
    } else {
      // For non-food categories, use quantity-based calculation
      let totalQuantity = 0;
      let totalRecommended = 0;

      categoryItems.forEach((item) => {
        totalQuantity += item.quantity;
        totalRecommended += item.recommendedQuantity;
      });

      percentOfRecommended =
        totalRecommended > 0 ? (totalQuantity / totalRecommended) * 100 : 100;
      hasEnough = totalQuantity >= totalRecommended;
    }

    // Translate category name
    const categoryName = t(category.id, { ns: 'categories' });

    // Don't generate alerts if we have enough (for food: enough calories, for others: enough quantity)
    if (hasEnough) {
      return;
    }

    // Check for out of stock (quantity/calories = 0)
    const isOutOfStock = isFood
      ? false // For food, we check calories above, so if hasEnough is false but calories > 0, it's just low
      : categoryItems.every((item) => item.quantity === 0);

    if (isOutOfStock) {
      alerts.push({
        id: createAlertId(`category-out-of-stock-${category.id}`),
        type: 'critical',
        message: t('alerts.stock.outOfStock'),
        itemName: categoryName,
      });
    } else if (percentOfRecommended < CRITICALLY_LOW_STOCK_PERCENTAGE) {
      alerts.push({
        id: createAlertId(`category-critically-low-${category.id}`),
        type: 'critical',
        message: t('alerts.stock.criticallyLow', {
          percent: Math.round(percentOfRecommended),
        }),
        itemName: categoryName,
      });
    } else if (percentOfRecommended < LOW_STOCK_PERCENTAGE) {
      alerts.push({
        id: createAlertId(`category-low-stock-${category.id}`),
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
      id: createAlertId('water-shortage-preparation'),
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
  const categoryStockAlerts = generateCategoryStockAlerts(items, t, household);
  const waterShortageAlerts = generateWaterShortageAlerts(items, household, t);

  // Combine alerts (removed item-level critical alerts as they're now covered by category alerts)
  const allAlerts = [
    ...expirationAlerts,
    ...categoryStockAlerts,
    ...waterShortageAlerts,
  ];

  // Sort by priority: critical first, then warning, then info
  allAlerts.sort((a, b) => ALERT_PRIORITY[a.type] - ALERT_PRIORITY[b.type]);

  return allAlerts;
}

/**
 * Count alerts by type
 */
export function countAlerts(alerts: Alert[]): AlertCounts {
  const counts: AlertCounts = {
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
