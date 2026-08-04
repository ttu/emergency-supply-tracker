import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardHousehold } from './OnboardHousehold';
import { renderWithProviders } from '@/test/render';
import {
  createMockHousehold,
  createMockSettings,
} from '@/shared/utils/test/factories';

const renderStep = (
  overrides: Partial<Parameters<typeof OnboardHousehold>[0]> = {},
) =>
  renderWithProviders(
    <OnboardHousehold
      household={createMockHousehold({
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 7,
      })}
      onHouseholdChange={vi.fn()}
      onNext={vi.fn()}
      onBack={vi.fn()}
      {...overrides}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('OnboardHousehold (v2)', () => {
  it('renders the household lead and computed targets side panel', () => {
    renderStep();
    expect(
      screen.getByText('v2.onboarding.household.leadTitle.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.onboarding.household.computedCaption.cockpit'),
    ).toBeInTheDocument();
  });

  it('shows computed litres of water based on the household', () => {
    renderStep();
    // 3 × 2 × 7 = 42
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  describe('accessible controls', () => {
    it('marks the chosen coverage target as pressed', () => {
      renderStep();
      expect(screen.getByRole('button', { name: '7D' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: '3D' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('exposes each count as a spinbutton carrying its value and floor', () => {
      renderStep();
      const adults = screen.getByRole('spinbutton', {
        name: 'v2.onboarding.labelAdults.cockpit',
      });
      expect(adults).toHaveAttribute('aria-valuenow', '2');
      expect(adults).toHaveAttribute('aria-valuemin', '1');
    });

    it('steps the count with the arrow keys', () => {
      const onHouseholdChange = vi.fn();
      renderStep({ onHouseholdChange });

      fireEvent.keyDown(
        screen.getByRole('spinbutton', {
          name: 'v2.onboarding.labelAdults.cockpit',
        }),
        { key: 'ArrowUp' },
      );

      expect(onHouseholdChange).toHaveBeenCalled();
    });

    it('disables the decrement once the count is at its floor', () => {
      renderStep({
        household: createMockHousehold({
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 7,
        }),
      });

      // Adults is the first stepper row, and 1 is its floor.
      expect(
        screen.getAllByRole('button', {
          name: 'v2.onboarding.stepperDecreaseAria',
        })[0],
      ).toBeDisabled();
    });
  });

  it('continue button advances', () => {
    const onNext = vi.fn();
    renderStep({ onNext });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    );
    expect(onNext).toHaveBeenCalled();
  });
});
