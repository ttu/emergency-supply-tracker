import { describe, it, expect } from 'vitest';
import { DEFAULT_HOUSEHOLD } from './constants';

describe('DEFAULT_HOUSEHOLD', () => {
  it('starts a new inventory set from the same profile the forms default to', () => {
    // A new set opened on "2 adults, 3 children" — five people nobody asked
    // for — which then drove every recommended quantity in that set. The
    // onboarding forms have always defaulted to a single adult; there is no
    // reason for a second inventory set to assume a different household.
    // Concrete values, not HOUSEHOLD_DEFAULTS itself — otherwise the
    // assertion just restates DEFAULT_HOUSEHOLD's own implementation and
    // can't catch either constant drifting.
    expect(DEFAULT_HOUSEHOLD).toEqual({
      adults: 1,
      children: 0,
      pets: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });
  });
});
