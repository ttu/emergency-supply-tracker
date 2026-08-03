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

  it('continue button advances', () => {
    const onNext = vi.fn();
    renderStep({ onNext });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    );
    expect(onNext).toHaveBeenCalled();
  });
});
