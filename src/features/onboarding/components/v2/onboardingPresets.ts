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

export function computeOnboardingTargets(h: {
  adults: number;
  children: number;
  supplyDurationDays: number;
}) {
  const ppl = h.adults + h.children * 0.75;
  const water = Math.ceil(3 * ppl * h.supplyDurationDays);
  const kcal = Math.ceil(2200 * ppl * h.supplyDurationDays);
  return { water, kcal };
}
