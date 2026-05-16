export interface PresetDef {
  code: string;
  name: { cockpit: string; civil: string; pantry: string };
  adults: number;
  children: number;
  days: number;
  pets: number;
}

export const ONBOARDING_PRESETS: PresetDef[] = [
  {
    code: 'P-01',
    name: { cockpit: 'SINGLE', civil: 'SINGLE', pantry: 'Single person' },
    adults: 1,
    children: 0,
    days: 7,
    pets: 0,
  },
  {
    code: 'P-02',
    name: { cockpit: 'COUPLE', civil: 'COUPLE', pantry: 'Couple' },
    adults: 2,
    children: 0,
    days: 7,
    pets: 0,
  },
  {
    code: 'P-03',
    name: {
      cockpit: 'FAMILY · WITH MINORS',
      civil: 'FAMILY · WITH MINORS',
      pantry: 'Family with children',
    },
    adults: 2,
    children: 2,
    days: 7,
    pets: 0,
  },
  {
    code: 'P-04',
    name: {
      cockpit: 'CUSTOM CONFIG',
      civil: 'CUSTOM CONFIG',
      pantry: 'Custom',
    },
    adults: 2,
    children: 0,
    days: 7,
    pets: 0,
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
