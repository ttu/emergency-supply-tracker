import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardStep03Preset } from './OnboardStep03Preset';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderStep = (
  props: Partial<Parameters<typeof OnboardStep03Preset>[0]> = {},
) =>
  renderWithProviders(
    <OnboardStep03Preset
      presetCode="P-02"
      onPresetChange={vi.fn()}
      onApplyPreset={vi.fn()}
      onNext={vi.fn()}
      onBack={vi.fn()}
      {...props}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('OnboardStep03Preset (v2)', () => {
  it('renders all four preset cards with their codes', () => {
    renderStep();
    for (const code of ['P-01', 'P-02', 'P-03', 'P-04']) {
      expect(screen.getByText(code)).toBeInTheDocument();
    }
  });

  it('clicking a preset card calls onPresetChange with its code', () => {
    const onPresetChange = vi.fn();
    renderStep({ onPresetChange });
    fireEvent.click(screen.getByRole('button', { name: /P-03/ }));
    expect(onPresetChange).toHaveBeenCalledWith('P-03');
  });

  it('continue applies the selected preset to the household (non-custom)', () => {
    const onApplyPreset = vi.fn();
    const onNext = vi.fn();
    renderStep({ presetCode: 'P-03', onApplyPreset, onNext });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    );
    expect(onApplyPreset).toHaveBeenCalledWith({
      adults: 2,
      children: 2,
      supplyDurationDays: 7,
      pets: 0,
    });
    expect(onNext).toHaveBeenCalled();
  });

  it('continue does NOT apply preset when "Custom" (P-04) is selected', () => {
    const onApplyPreset = vi.fn();
    renderStep({ presetCode: 'P-04', onApplyPreset });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    );
    expect(onApplyPreset).not.toHaveBeenCalled();
  });
});
