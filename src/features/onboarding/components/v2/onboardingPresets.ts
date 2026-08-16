export interface PresetDef {
  code: string;
  /** Key into `v2.onboarding.preset.presetNames.<nameKey>.<themeKey>`. */
  nameKey: 'single' | 'couple' | 'family' | 'custom';
  adults: number;
  children: number;
  days: number;
  pets: number;
  /** Whether continuing with this preset applies its household figures. */
  appliesHousehold: boolean;
}

export const ONBOARDING_PRESETS: PresetDef[] = [
  {
    code: 'P-01',
    nameKey: 'single',
    adults: 1,
    children: 0,
    days: 7,
    pets: 0,
    appliesHousehold: true,
  },
  {
    code: 'P-02',
    nameKey: 'couple',
    adults: 2,
    children: 0,
    days: 7,
    pets: 0,
    appliesHousehold: true,
  },
  {
    code: 'P-03',
    nameKey: 'family',
    adults: 2,
    children: 2,
    days: 7,
    pets: 0,
    appliesHousehold: true,
  },
  {
    code: 'P-04',
    nameKey: 'custom',
    adults: 2,
    children: 0,
    days: 7,
    pets: 0,
    // "Start from scratch" — the household figures shown are just the form's
    // starting point, not something to apply on continue.
    appliesHousehold: false,
  },
];

/** Litres of water a single adult needs per day. */
export const ONBOARDING_WATER_LITERS_PER_ADULT_PER_DAY = 3;
/** A child counts as this fraction of an adult in the supply math. */
export const ONBOARDING_CHILD_WEIGHT = 0.75;
/** Calories a single adult needs per day. */
export const ONBOARDING_KCAL_PER_ADULT_PER_DAY = 2200;

export function computeOnboardingTargets(h: {
  adults: number;
  children: number;
  supplyDurationDays: number;
}) {
  const ppl = h.adults + h.children * ONBOARDING_CHILD_WEIGHT;
  const water = Math.ceil(
    ONBOARDING_WATER_LITERS_PER_ADULT_PER_DAY * ppl * h.supplyDurationDays,
  );
  const kcal = Math.ceil(
    ONBOARDING_KCAL_PER_ADULT_PER_DAY * ppl * h.supplyDurationDays,
  );
  return { water, kcal };
}
