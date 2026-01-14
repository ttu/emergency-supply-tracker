import type {
  InventoryItem,
  HouseholdConfig,
  RecommendedItemDefinition,
} from '@/shared/types';
import { createAlertId, isFoodCategory } from '@/shared/types';
import { STANDARD_CATEGORIES } from '@/features/categories';
import {
  EXPIRING_SOON_ALERT_DAYS,
  CRITICALLY_LOW_STOCK_PERCENTAGE,
  LOW_STOCK_PERCENTAGE,
  CUSTOM_ITEM_TYPE,
} from '@/shared/utils/constants';
import { calculateWaterRequirements } from '@/shared/utils/calculations/water';
import { getDaysUntilExpiration } from '@/shared/utils/calculations/itemStatus';
import { calculateCategoryPercentage } from '@/shared/utils/calculations/categoryPercentage';
import type { Alert, AlertCounts, TranslationFunction } from '../types';
import { ALERT_PRIORITY } from '../types';

/**
 * Get the translated item name for an inventory item.
 * For built-in products, translates using itemType.
 * For custom items, returns the stored name as-is.
 */
function getTranslatedItemName(
  item: InventoryItem,
  t: TranslationFunction,
): string {
  // Use itemType for template ID
  const templateId = item.itemType;

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
 * Get category percentage using the unified calculator.
 * Uses household config for accurate calculations.
 */
function getCategoryStockStatus(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
): { percentOfRecommended: number; hasEnough: boolean } {
  const result = calculateCategoryPercentage(categoryId, items, household);
  return {
    percentOfRecommended: result.percentage,
    hasEnough: result.hasEnough,
  };
}

/**
 * Generate alerts for a single category based on stock status.
 */
function generateCategoryAlerts(
  category: { id: string },
  categoryItems: InventoryItem[],
  percentOfRecommended: number,
  isFood: boolean,
  t: TranslationFunction,
): Alert[] {
  const alerts: Alert[] = [];
  const categoryName = t(category.id, { ns: 'categories' });

  const categoryIdForAlert = String(category.id);

  // Check for out of stock (quantity/calories = 0)
  const isOutOfStock = isFood
    ? false // For food, we check calories above, so if hasEnough is false but calories > 0, it's just low
    : categoryItems.every((item) => item.quantity === 0);

  if (isOutOfStock) {
    alerts.push({
      id: createAlertId(`category-out-of-stock-${categoryIdForAlert}`),
      type: 'critical',
      message: t('alerts.stock.outOfStock'),
      itemName: categoryName,
    });
  } else if (percentOfRecommended < CRITICALLY_LOW_STOCK_PERCENTAGE) {
    alerts.push({
      id: createAlertId(`category-critically-low-${categoryIdForAlert}`),
      type: 'critical',
      message: t('alerts.stock.criticallyLow', {
        percent: Math.round(percentOfRecommended),
      }),
      itemName: categoryName,
    });
  } else if (percentOfRecommended < LOW_STOCK_PERCENTAGE) {
    alerts.push({
      id: createAlertId(`category-low-stock-${categoryIdForAlert}`),
      type: 'warning',
      message: t('alerts.stock.runningLow', {
        percent: Math.round(percentOfRecommended),
      }),
      itemName: categoryName,
    });
  }

  return alerts;
}

/**
 * Generate alerts for categories with low stock (aggregated by category).
 * Uses the unified category percentage calculator for consistent calculations
 * across alerts and category cards.
 */
function generateCategoryStockAlerts(
  items: InventoryItem[],
  t: TranslationFunction,
  household: HouseholdConfig,
  _recommendedItems: RecommendedItemDefinition[],
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

    const isFood = isFoodCategory(String(category.id));

    // Calculate status using unified calculator
    const { percentOfRecommended, hasEnough } = getCategoryStockStatus(
      category.id,
      items,
      household,
    );

    // Don't generate alerts if we have enough (for food: enough calories, for others: enough quantity)
    if (hasEnough) {
      return;
    }

    // Generate alerts for this category
    alerts.push(
      ...generateCategoryAlerts(
        category,
        categoryItems,
        percentOfRecommended,
        isFood,
        t,
      ),
    );
  });

  return alerts;
}

/**
 * Generate alerts for water shortage when food requires more water than available
 * @param _household - Required for API consistency (not currently used in calculation)
 */
function generateWaterShortageAlerts(
  items: InventoryItem[],
  _household: HouseholdConfig,
  t: TranslationFunction,
): Alert[] {
  const alerts: Alert[] = [];

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
  household: HouseholdConfig,
  recommendedItems: RecommendedItemDefinition[],
): Alert[] {
  const expirationAlerts = generateExpirationAlerts(items, t);
  const categoryStockAlerts = generateCategoryStockAlerts(
    items,
    t,
    household,
    recommendedItems,
  );
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
