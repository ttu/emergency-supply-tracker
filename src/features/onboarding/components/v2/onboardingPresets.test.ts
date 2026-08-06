import { describe, it, expect } from 'vitest';
import {
  ONBOARDING_PRESETS,
  computeOnboardingTargets,
} from './onboardingPresets';

describe('ONBOARDING_PRESETS', () => {
  it('exposes the four canonical presets in order', () => {
    expect(ONBOARDING_PRESETS.map((p) => p.code)).toEqual([
      'P-01',
      'P-02',
      'P-03',
      'P-04',
    ]);
  });

  it('every preset has a name key, resolved via translations at render time', () => {
    const validKeys = ['single', 'couple', 'family', 'custom'];
    for (const p of ONBOARDING_PRESETS) {
      expect(validKeys).toContain(p.nameKey);
    }
  });
});

describe('computeOnboardingTargets', () => {
  it('uses 3L × people × days for water', () => {
    const t = computeOnboardingTargets({
      adults: 2,
      children: 0,
      supplyDurationDays: 7,
    });
    expect(t.water).toBe(42);
  });

  it('treats children as 0.75 adult-equivalents', () => {
    const t = computeOnboardingTargets({
      adults: 2,
      children: 2,
      supplyDurationDays: 7,
    });
    // people = 2 + 2*0.75 = 3.5; water = ceil(3*3.5*7) = 74
    expect(t.water).toBe(74);
    expect(t.kcal).toBe(Math.ceil(2200 * 3.5 * 7));
  });

  it('rounds up via Math.ceil', () => {
    const t = computeOnboardingTargets({
      adults: 1,
      children: 1,
      supplyDurationDays: 3,
    });
    // people = 1.75 → water = ceil(15.75) = 16
    expect(t.water).toBe(16);
  });
});
