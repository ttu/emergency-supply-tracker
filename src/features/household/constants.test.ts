import { describe, it, expect } from 'vitest';
import { DEFAULT_HOUSEHOLD, HOUSEHOLD_DEFAULTS } from './constants';

describe('DEFAULT_HOUSEHOLD', () => {
  it('starts a new inventory set from the same profile the forms default to', () => {
    // A new set opened on "2 adults, 3 children" — five people nobody asked
    // for — which then drove every recommended quantity in that set. The
    // onboarding forms have always defaulted to a single adult; there is no
    // reason for a second inventory set to assume a different household.
    expect(DEFAULT_HOUSEHOLD).toEqual({
      adults: HOUSEHOLD_DEFAULTS.adults,
      children: HOUSEHOLD_DEFAULTS.children,
      pets: HOUSEHOLD_DEFAULTS.pets,
      supplyDurationDays: HOUSEHOLD_DEFAULTS.supplyDays,
      useFreezer: HOUSEHOLD_DEFAULTS.useFreezer,
    });
  });
});
