import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardPreset } from './OnboardPreset';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderStep = (props: Partial<Parameters<typeof OnboardPreset>[0]> = {}) =>
  renderWithProviders(
    <OnboardPreset
      presetCode="P-02"
      onPresetChange={vi.fn()}
      onApplyPreset={vi.fn()}
      onTryDemoData={vi.fn()}
      onNext={vi.fn()}
      onBack={vi.fn()}
      {...props}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('OnboardPreset (v2)', () => {
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

  describe('ways past the questionnaire', () => {
    it('offers demo data, with a note on how to get rid of it', () => {
      const onTryDemoData = vi.fn();
      renderStep({ onTryDemoData });

      fireEvent.click(screen.getByTestId('v2-try-demo-data'));
      expect(onTryDemoData).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText('onboarding.tryDemoData.hint'),
      ).toBeInTheDocument();
    });

    it('offers a backup import for someone who already has data', () => {
      renderStep();
      const input = screen.getByTestId('v2-import-file-input');
      expect(input).toHaveAttribute('accept', '.json');

      // The visible control is a link; the file input behind it is hidden.
      const click = vi.spyOn(input as HTMLInputElement, 'click');
      fireEvent.click(screen.getByTestId('v2-import-backup'));
      expect(click).toHaveBeenCalled();
    });
  });
});
