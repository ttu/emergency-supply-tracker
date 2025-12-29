import type { HouseholdConfig, RecommendedItemDefinition } from '../../types';
import {
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
  BASE_SUPPLY_DURATION_DAYS,
} from '../constants';

export function calculateHouseholdMultiplier(config: HouseholdConfig): number {
  const peopleMultiplier =
    config.adults * ADULT_REQUIREMENT_MULTIPLIER +
    config.children * CHILDREN_REQUIREMENT_MULTIPLIER;
  const daysMultiplier = config.supplyDurationDays / BASE_SUPPLY_DURATION_DAYS;
  return peopleMultiplier * daysMultiplier;
}

export function calculateRecommendedQuantity(
  item: RecommendedItemDefinition,
  household: HouseholdConfig,
): number {
  let qty = item.baseQuantity;

  if (item.scaleWithPeople) {
    const peopleMultiplier =
      household.adults * ADULT_REQUIREMENT_MULTIPLIER +
      household.children * CHILDREN_REQUIREMENT_MULTIPLIER;
    qty *= peopleMultiplier;
  }

  if (item.scaleWithDays) {
    const daysMultiplier =
      household.supplyDurationDays / BASE_SUPPLY_DURATION_DAYS;
    qty *= daysMultiplier;
  }

  return Math.ceil(qty);
}
