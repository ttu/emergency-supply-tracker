/**
 * "Days covered" — how long the household can actually drink and eat from what
 * is stocked.
 *
 * Only two resources have a defensible per-day burn rate: water and calories.
 * Torches, bandages and duct tape are not consumed on a daily schedule, so they
 * stay out of this number entirely; the Readiness KPI already reports on them.
 */

import type { Unit } from '@/shared/types';
import { isFoodCategory } from '@/shared/types';
import { WATER_CATEGORY_ID } from '@/shared/utils/constants';

/** Which of the two survival resources runs out first. */
export type LimitingResource = 'food' | 'water';

/**
 * The slice of a category status summary this calculation needs.
 *
 * Declared structurally rather than importing `CategoryStatusSummary` so the
 * module stays a leaf: it does arithmetic on numbers the dashboard already
 * computed, and depends on no feature.
 */
export interface ResourceCoverageInput {
  categoryId: string;
  /** Category total in `primaryUnit` — litres, for water. */
  totalActual: number;
  /** Undefined or non-litre means the total is a mixed-unit sum. */
  primaryUnit?: Unit;
  totalActualCalories?: number;
  /** Calories required for the *whole* supply duration. */
  totalNeededCalories?: number;
  /** Drinking water required for the whole supply duration, in litres. */
  drinkingWaterNeeded?: number;
  /** Litres needed to prepare the stored food. Does not scale with days. */
  preparationWaterNeeded?: number;
}

export interface DaysCoveredResult {
  /** `min(foodDays, waterDays)`, to one decimal; 0 when nothing is measurable. */
  days: number;
  /** Days of calories on hand. Undefined when food cannot be measured. */
  foodDays?: number;
  /** Days of water on hand. Undefined when water cannot be measured. */
  waterDays?: number;
  /** The resource that determined `days`. */
  limitedBy?: LimitingResource;
}

/**
 * Days beyond this are not worth rendering, and keep a corrupt inventory from
 * blowing out the KPI tile's layout.
 */
const MAX_DAYS = 999;

const NOTHING_COVERED: DaysCoveredResult = { days: 0 };

/** Guards against NaN/Infinity reaching the UI from corrupted stored data. */
function finiteOrUndefined(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

function roundToOneDecimal(days: number): number {
  return Math.round(days * 10) / 10;
}

/**
 * Days of calories on hand.
 *
 * `totalNeededCalories` is the requirement for the whole supply duration, so
 * dividing it back out recovers the daily rate — including the household's
 * adult/child multipliers and any Nutrition Settings override.
 */
function calculateFoodDays(
  food: ResourceCoverageInput | undefined,
  supplyDurationDays: number,
): number | undefined {
  const needed = finiteOrUndefined(food?.totalNeededCalories);
  const actual = finiteOrUndefined(food?.totalActualCalories);
  if (!needed || actual === undefined) return undefined;

  return finiteOrUndefined(actual / (needed / supplyDurationDays));
}

/**
 * Days of water on hand, counting both what is drunk and what stored food needs
 * for preparation.
 *
 * Preparation water scales with the amount of food on the shelf rather than with
 * days, so it is amortised over the food it prepares: each day you drink your
 * ration and cook one day's worth. Reserving the whole amount up front would
 * mean buying more food *lowered* your water days.
 */
function calculateWaterDays(
  water: ResourceCoverageInput | undefined,
  foodDays: number | undefined,
  supplyDurationDays: number,
): number | undefined {
  if (water === undefined) return undefined;

  // A total summed across mixed units is not a litre count, so it cannot be
  // divided by a litres-per-day rate.
  if (water.primaryUnit !== 'liters') return undefined;

  const available = finiteOrUndefined(water.totalActual);
  if (available === undefined) return undefined;

  const drinkingNeeded = finiteOrUndefined(water.drinkingWaterNeeded) ?? 0;
  const preparationNeeded =
    finiteOrUndefined(water.preparationWaterNeeded) ?? 0;

  const drinkingRatePerDay = drinkingNeeded / supplyDurationDays;
  // With no food to cook, no water is spent cooking it.
  const preparationRatePerDay =
    foodDays !== undefined && foodDays > 0 ? preparationNeeded / foodDays : 0;

  const ratePerDay = drinkingRatePerDay + preparationRatePerDay;
  if (ratePerDay <= 0) return undefined;

  return finiteOrUndefined(available / ratePerDay);
}

/**
 * Calculate how many days the stocked water and food actually cover.
 *
 * @param categoryStatuses - Status summaries for the enabled categories
 * @param supplyDurationDays - The household's target duration
 * @returns The days covered, both legs, and which one is the constraint
 */
export function calculateDaysCovered(
  categoryStatuses: readonly ResourceCoverageInput[],
  supplyDurationDays: number,
): DaysCoveredResult {
  if (!supplyDurationDays || !Number.isFinite(supplyDurationDays)) {
    return NOTHING_COVERED;
  }

  const food = categoryStatuses.find((c) => isFoodCategory(c.categoryId));
  const water = categoryStatuses.find(
    (c) => c.categoryId === WATER_CATEGORY_ID,
  );

  const foodDays = calculateFoodDays(food, supplyDurationDays);
  const waterDays = calculateWaterDays(water, foodDays, supplyDurationDays);

  if (foodDays === undefined && waterDays === undefined) {
    return NOTHING_COVERED;
  }

  const limitedBy: LimitingResource =
    waterDays === undefined || (foodDays !== undefined && foodDays <= waterDays)
      ? 'food'
      : 'water';
  const days = limitedBy === 'food' ? foodDays! : waterDays!;

  return {
    days: roundToOneDecimal(Math.min(days, MAX_DAYS)),
    foodDays,
    waterDays,
    limitedBy,
  };
}
