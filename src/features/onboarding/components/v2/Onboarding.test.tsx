import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { DesignOnboarding } from './Onboarding';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderFlow = (onComplete = vi.fn()) =>
  renderWithProviders(<DesignOnboarding onComplete={onComplete} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('DesignOnboarding (v2 orchestrator)', () => {
  it('starts on step 1 (welcome)', () => {
    renderFlow();
    expect(screen.getByText('v2.onboarding.stepLabel')).toBeInTheDocument();
    expect(
      screen.getByText('v2.onboarding.step01.leadTitleCockpit'),
    ).toBeInTheDocument();
  });

  it('advances through every step and finishes on the completion view', () => {
    const onComplete = vi.fn();
    renderFlow(onComplete);

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    ); // → 2
    expect(screen.getByText('v2.onboarding.stepLabel')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    ); // → 3
    expect(screen.getByText('v2.onboarding.stepLabel')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    ); // → 4
    expect(screen.getByText('v2.onboarding.stepLabel')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    ); // → 5
    expect(screen.getByText('v2.onboarding.stepLabel')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.step05.primaryLabel.cockpit',
      }),
    ); // → 6
    expect(
      screen.getByText('v2.onboarding.step06.title.cockpit'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.step06.openDashboard.cockpit',
      }),
    );
    expect(onComplete).toHaveBeenCalled();
  });

  it('BACK from step 2 returns to step 1', () => {
    renderFlow();
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.back.cockpit' }),
    );
    expect(screen.getByText('v2.onboarding.stepLabel')).toBeInTheDocument();
  });
});
