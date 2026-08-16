import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';

// The default mock's bare key-echo makes every stepper's +/- button share
// the same accessible name ("v2.settings.stepperDecreaseAria" for all
// three), so this file needs real interpolation to target one at a time.
vi.mock('react-i18next', async () => {
  const { createI18nMock } = await import('@/test/i18n');
  return createI18nMock({
    translations: {
      'v2.settings.stepperDecreaseAria': 'Decrease {{label}}',
      'v2.settings.stepperIncreaseAria': 'Increase {{label}}',
    },
  });
});

import { NutritionSection } from './NutritionSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createPercentage } from '@/shared/types';

const render = () =>
  renderWithProviders(<NutritionSection />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('NutritionSection (v2)', () => {
  it('renders the §4 NUTRITION & REQUIREMENTS header and stepper labels', () => {
    renderWithProviders(<NutritionSection />, {
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    });
    expect(screen.getByText('§4')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.title.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.calories.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.water.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.nutrition.children.cockpit'),
    ).toBeInTheDocument();
  });

  it('offers no control the app does not act on', () => {
    // "Track hygiene water separately" was stored and read back to draw its
    // own switch while no calculation ever consulted it, so the promised
    // 3 L/person/day never entered any figure.
    render();
    expect(
      screen.queryByText('v2.settings.nutrition.hygiene.cockpit'),
    ).not.toBeInTheDocument();
  });

  it('reports the expiry window from the threshold the alerts actually use', () => {
    render();
    expect(
      screen.getByText('v2.settings.nutrition.expiryWindowValue'),
    ).toBeInTheDocument();
  });

  describe('stepper interactions', () => {
    const stepper = (labelKey: string) => {
      const label = `v2.settings.nutrition.${labelKey}.cockpit`;
      return {
        increase: screen.getByRole('button', { name: `Increase ${label}` }),
        decrease: screen.getByRole('button', { name: `Decrease ${label}` }),
      };
    };

    it('increases calories by its step, clamped at the configured max', () => {
      render();
      fireEvent.click(stepper('calories').increase);
      expect(screen.getByText('2,050')).toBeInTheDocument();
    });

    it('disables the calories decrease button at the floor', () => {
      renderWithProviders(<NutritionSection />, {
        initialAppData: createMockAppData({
          settings: createMockSettings({
            theme: 'cockpit',
            dailyCaloriesPerPerson: 0,
          }),
        }),
      });
      expect(stepper('calories').decrease).toBeDisabled();
    });

    it('increases water by its step', () => {
      render();
      fireEvent.click(stepper('water').increase);
      expect(screen.getByText('3.5')).toBeInTheDocument();
    });

    it('does not increase the children multiplier past 100%', () => {
      renderWithProviders(<NutritionSection />, {
        initialAppData: createMockAppData({
          settings: createMockSettings({
            theme: 'cockpit',
            childrenRequirementPercentage: createPercentage(100),
          }),
        }),
      });
      const { increase } = stepper('children');
      expect(increase).toBeDisabled();
      fireEvent.click(increase);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('does not decrease the children multiplier below 0%', () => {
      renderWithProviders(<NutritionSection />, {
        initialAppData: createMockAppData({
          settings: createMockSettings({
            theme: 'cockpit',
            childrenRequirementPercentage: createPercentage(0),
          }),
        }),
      });
      const { decrease } = stepper('children');
      expect(decrease).toBeDisabled();
      fireEvent.click(decrease);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
