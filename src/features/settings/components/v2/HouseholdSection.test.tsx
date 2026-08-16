import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';

// The formula caption interpolates the real computed operands, which the
// default mock's bare key-echo would hide entirely.
vi.mock('react-i18next', async () => {
  const { createI18nMock } = await import('@/test/i18n');
  return createI18nMock({
    translations: {
      'v2.settings.household.waterFormula':
        '= {{water}} L x {{people}} people x {{days}} d',
      'v2.settings.household.foodFormula':
        '= {{calories}} kcal x {{people}} people x {{days}} d',
    },
  });
});

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
    // The effective count folds in the child's 0.5 multiplier (3.5), not the
    // 3 raw adults — the caption has to quote the number that actually
    // produced the figure above it.
    expect(screen.getByText('= 2 L x 3.5 people x 14 d')).toBeInTheDocument();
  });

  describe('presets', () => {
    const row = (label: string) =>
      screen.getByText(label).parentElement!.parentElement as HTMLElement;

    it('offers Single/Couple/Family presets that overwrite the household', () => {
      renderWithProviders(<HouseholdSection />, {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          household: {
            adults: 4,
            children: 3,
            pets: 2,
            supplyDurationDays: 30,
            useFreezer: true,
          },
        }),
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: 'v2.onboarding.preset.presetNames.single.cockpit',
        }),
      );

      expect(
        within(row('v2.settings.household.adults.cockpit')).getByText('1'),
      ).toBeInTheDocument();
      expect(
        within(row('v2.settings.household.children.cockpit')).getByText('0'),
      ).toBeInTheDocument();
      expect(
        within(row('v2.settings.household.days.cockpit')).getByText('3'),
      ).toBeInTheDocument();
    });

    it('the Family preset sets two adults and two children', () => {
      renderWithProviders(<HouseholdSection />, {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          household: {
            adults: 1,
            children: 0,
            pets: 0,
            supplyDurationDays: 3,
            useFreezer: false,
          },
        }),
      });

      fireEvent.click(
        screen.getByRole('button', {
          name: 'v2.onboarding.preset.presetNames.family.cockpit',
        }),
      );

      expect(
        within(row('v2.settings.household.adults.cockpit')).getByText('2'),
      ).toBeInTheDocument();
      expect(
        within(row('v2.settings.household.children.cockpit')).getByText('2'),
      ).toBeInTheDocument();
    });
  });
});
