import type { HouseholdConfig, RecommendedItemDefinition } from '../../types';

export function calculateHouseholdMultiplier(config: HouseholdConfig): number {
  const peopleMultiplier = config.adults * 1.0 + config.children * 0.75;
  const daysMultiplier = config.supplyDurationDays / 3;
  return peopleMultiplier * daysMultiplier;
}

export function calculateRecommendedQuantity(
  item: RecommendedItemDefinition,
  household: HouseholdConfig,
): number {
  let qty = item.baseQuantity;

  if (item.scaleWithPeople) {
    const peopleMultiplier = household.adults * 1.0 + household.children * 0.75;
    qty *= peopleMultiplier;
  }

  if (item.scaleWithDays) {
    const daysMultiplier = household.supplyDurationDays / 3;
    qty *= daysMultiplier;
  }

  return Math.ceil(qty);
}
