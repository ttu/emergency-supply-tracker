import type {
  HouseholdConfig,
  RecommendedItemDefinition,
} from '@/shared/types';
import {
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
  PET_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';

/**
 * Calculate household multiplier based on adults, children, and supply duration.
 * @param config - Household configuration
 * @param childrenMultiplier - Optional multiplier for children (default: 0.75)
 */
export function calculateHouseholdMultiplier(
  config: HouseholdConfig,
  childrenMultiplier: number = CHILDREN_REQUIREMENT_MULTIPLIER,
): number {
  const peopleMultiplier =
    config.adults * ADULT_REQUIREMENT_MULTIPLIER +
    config.children * childrenMultiplier;
  return peopleMultiplier * config.supplyDurationDays;
}

/**
 * Calculate recommended quantity for an item based on household configuration.
 * @param item - Recommended item definition
 * @param household - Household configuration
 * @param childrenMultiplier - Optional multiplier for children (default: 0.75)
 */
export function calculateRecommendedQuantity(
  item: RecommendedItemDefinition,
  household: HouseholdConfig,
  childrenMultiplier: number = CHILDREN_REQUIREMENT_MULTIPLIER,
): number {
  let qty = item.baseQuantity;

  if (item.scaleWithPeople) {
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * childrenMultiplier;
    qty *= peopleMultiplier;
  }

  if (item.scaleWithPets) {
    qty *= household.pets * PET_REQUIREMENT_MULTIPLIER;
  }

  if (item.scaleWithDays) {
    qty *= household.supplyDurationDays;
  }

  return Math.ceil(qty);
}
