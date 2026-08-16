import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardTheme } from './OnboardTheme';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderStep = (onNext = vi.fn(), onBack = vi.fn()) =>
  renderWithProviders(<OnboardTheme onNext={onNext} onBack={onBack} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('OnboardTheme (v2)', () => {
  it('renders the appearance lead', () => {
    renderStep();
    expect(
      screen.getByText('v2.onboarding.theme.leadTitleCockpit'),
    ).toBeInTheDocument();
  });

  it('continue and back trigger their callbacks', () => {
    const onNext = vi.fn();
    const onBack = vi.fn();
    renderStep(onNext, onBack);
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.back.cockpit' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    );
    expect(onBack).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });
});
