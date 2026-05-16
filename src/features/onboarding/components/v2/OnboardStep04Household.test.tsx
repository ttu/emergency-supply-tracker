import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardStep04Household } from './OnboardStep04Household';
import { renderWithProviders } from '@/test/render';
import {
  createMockHousehold,
  createMockSettings,
} from '@/shared/utils/test/factories';

const renderStep = (
  overrides: Partial<Parameters<typeof OnboardStep04Household>[0]> = {},
) =>
  renderWithProviders(
    <OnboardStep04Household
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

describe('OnboardStep04Household (v2)', () => {
  it('renders the household lead and computed targets side panel', () => {
    renderStep();
    expect(screen.getByText(/HOUSEHOLD · §4 PROFILE/)).toBeInTheDocument();
    expect(screen.getByText('COMPUTED · LIVE')).toBeInTheDocument();
  });

  it('shows computed litres of water based on the household', () => {
    renderStep();
    // 3 × 2 × 7 = 42
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('continue button advances', () => {
    const onNext = vi.fn();
    renderStep({ onNext });
    fireEvent.click(screen.getByRole('button', { name: /CONTINUE →/ }));
    expect(onNext).toHaveBeenCalled();
  });
});
