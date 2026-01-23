/**
 * Category calculation strategies module.
 *
 * This module provides a Strategy pattern implementation for category-specific
 * calculations in the emergency supply tracker.
 *
 * @example
 * ```typescript
 * import { getCategoryStrategy } from '@/shared/utils/calculations/strategies';
 *
 * const strategy = getCategoryStrategy(categoryId);
 * const result = strategy.aggregateTotals(itemResults, context);
 * ```
 */

// Types
export type {
  CategoryCalculationOptions,
  CategoryCalculationContext,
  CategoryShortage,
  ShortageCalculationResult,
  ItemCalculationResult,
  CategoryCalculationStrategy,
} from './types';

// Common utilities
export {
  calculateBaseRecommendedQuantity,
  aggregateStandardTotals,
  aggregateMixedUnitsTotals,
  hasMixedUnits,
  defaultHasEnoughInventory,
} from './common';

// Strategies
export { FoodCategoryStrategy } from './food';
export { WaterCategoryStrategy } from './water';
export { CommunicationCategoryStrategy } from './communication';
export { DefaultCategoryStrategy } from './default';

// Registry
export {
  getCategoryStrategy,
  registerCategoryStrategy,
  getRegisteredStrategyIds,
} from './registry';
