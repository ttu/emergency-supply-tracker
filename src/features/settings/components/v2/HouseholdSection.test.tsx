import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { HouseholdSection } from './HouseholdSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createPercentage } from '@/shared/types';

describe('HouseholdSection (v2)', () => {
  it('renders the §2 HOUSEHOLD header and profile/computed panels', () => {
    renderWithProviders(<HouseholdSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('§2')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.profileHeader.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.calculated.cockpit'),
    ).toBeInTheDocument();
  });

  it('renders profile steppers: ADULTS, CHILDREN, PETS, COVERAGE TARGET', () => {
    renderWithProviders(<HouseholdSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(
      screen.getByText('v2.settings.household.adults.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.children.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.pets.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.days.cockpit'),
    ).toBeInTheDocument();
  });
  it('states the arithmetic that produced the figure, children included', () => {
    // The value counted children at their multiplier while the formula under
    // it counted adults only, so a household with children read "98" above
    // "= 2 L x 3 ADULTS x 14 D" — a caption that works out to 84.
    renderWithProviders(<HouseholdSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({
          theme: 'cockpit',
          dailyWaterPerPerson: 2,
          childrenRequirementPercentage: createPercentage(50),
        }),
        household: {
          adults: 3,
          children: 1,
          pets: 0,
          supplyDurationDays: 14,
          useFreezer: false,
        },
      }),
    });

    // 2 L x (3 + 1x0.5) people x 14 days = 98.
    expect(screen.getByText('98')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.household.waterFormula'),
    ).toBeInTheDocument();
  });
});
