import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardWelcome } from './OnboardWelcome';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderStep = (onNext = vi.fn()) =>
  renderWithProviders(<OnboardWelcome onNext={onNext} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('OnboardWelcome (v2)', () => {
  it('renders the cockpit welcome title and outputs sidebar', () => {
    renderStep();
    expect(
      screen.getByText('v2.onboarding.welcome.leadTitleCockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.onboarding.welcome.outputsCaption.cockpit'),
    ).toBeInTheDocument();
  });

  it('continue advances the flow', () => {
    const onNext = vi.fn();
    renderStep(onNext);
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    );
    expect(onNext).toHaveBeenCalled();
  });
});
