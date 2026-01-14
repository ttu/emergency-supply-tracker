import { useMemo } from 'react';
import { useSettings } from '@/features/settings';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import type { CategoryCalculationOptions } from '../utils';

/**
 * Hook to build calculation options from user settings.
 * Centralizes the logic for deriving calculation parameters from settings,
 * with fallbacks to default constants when settings are not configured.
 */
export function useCalculationOptions(): CategoryCalculationOptions {
  const { settings } = useSettings();

  return useMemo(
    () => ({
      childrenMultiplier:
        (settings.childrenRequirementPercentage ??
          CHILDREN_REQUIREMENT_MULTIPLIER * 100) / 100,
      dailyCaloriesPerPerson:
        settings.dailyCaloriesPerPerson ?? DAILY_CALORIES_PER_PERSON,
      dailyWaterPerPerson:
        settings.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON,
    }),
    [
      settings.childrenRequirementPercentage,
      settings.dailyCaloriesPerPerson,
      settings.dailyWaterPerPerson,
    ],
  );
}
