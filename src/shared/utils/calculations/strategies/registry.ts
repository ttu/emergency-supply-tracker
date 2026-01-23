/**
 * Strategy registry for category calculations.
 *
 * Provides factory function to get the appropriate strategy for a category.
 * Strategies are checked in order; the first one that canHandle returns true.
 */

import type { CategoryCalculationStrategy } from './types';
import { FoodCategoryStrategy } from './food';
import { WaterCategoryStrategy } from './water';
import { CommunicationCategoryStrategy } from './communication';
import { DefaultCategoryStrategy } from './default';

/**
 * Ordered list of strategies.
 * Order matters: specific strategies come first, default (fallback) last.
 */
const strategies: CategoryCalculationStrategy[] = [
  new FoodCategoryStrategy(),
  new WaterCategoryStrategy(),
  new CommunicationCategoryStrategy(),
  new DefaultCategoryStrategy(), // Must be last (catches all)
];

/**
 * Get the appropriate calculation strategy for a category.
 *
 * @param categoryId - The category ID
 * @returns The strategy that handles this category
 * @throws Error if no strategy found (should never happen with DefaultCategoryStrategy)
 */
export function getCategoryStrategy(
  categoryId: string,
): CategoryCalculationStrategy {
  const strategy = strategies.find((s) => s.canHandle(categoryId));
  if (!strategy) {
    // This should never happen if DefaultCategoryStrategy is registered
    throw new Error(`No strategy found for category: ${categoryId}`);
  }
  return strategy;
}

/**
 * Register a custom strategy.
 *
 * The strategy is inserted before the DefaultCategoryStrategy to allow
 * custom strategies to handle categories without being shadowed by the default.
 *
 * @param strategy - The strategy to register
 */
export function registerCategoryStrategy(
  strategy: CategoryCalculationStrategy,
): void {
  // Find the index of the default strategy
  const defaultIndex = strategies.findIndex((s) => s.strategyId === 'default');
  if (defaultIndex >= 0) {
    // Insert before default
    strategies.splice(defaultIndex, 0, strategy);
  } else {
    // No default found, just push
    strategies.push(strategy);
  }
}

/**
 * Get all registered strategy IDs.
 *
 * Useful for debugging or listing available strategies.
 *
 * @returns Array of strategy IDs
 */
export function getRegisteredStrategyIds(): string[] {
  return strategies.map((s) => s.strategyId);
}
