import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { DesignOnboarding } from './Onboarding';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderFlow = (onComplete = vi.fn()) =>
  renderWithProviders(<DesignOnboarding onComplete={onComplete} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

const clickContinue = () =>
  fireEvent.click(
    screen.getByRole('button', { name: 'v2.voice.continueAction.cockpit' }),
  );

/** Welcome → Theme → Preset → Household → Kit → Quick setup. */
const advanceToQuickSetup = () => {
  for (let i = 0; i < 5; i++) clickContinue();
};

describe('DesignOnboarding (v2 orchestrator)', () => {
  it('starts on step 1 (welcome)', () => {
    renderFlow();
    expect(
      screen.getByText('v2.onboarding.welcome.leadTitleCockpit'),
    ).toBeInTheDocument();
  });

  it('reaches the kit step before asking about items', () => {
    renderFlow();
    for (let i = 0; i < 4; i++) clickContinue();
    expect(
      screen.getByText('v2.onboarding.kit.leadTitle.cockpit'),
    ).toBeInTheDocument();
  });

  it('seeds the inventory from the quick-setup selection', () => {
    const onComplete = vi.fn();
    renderFlow(onComplete);
    advanceToQuickSetup();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.quickSetup.addAll.cockpit',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.complete.openDashboard.cockpit',
      }),
    );

    const [, items] = onComplete.mock.calls[0];
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i: { quantity: number }) => i.quantity === 0)).toBe(
      true,
    );
  });

  it('finishes with an empty inventory when quick setup is skipped', () => {
    const onComplete = vi.fn();
    renderFlow(onComplete);
    advanceToQuickSetup();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.quickSetup.skip.cockpit',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.complete.openDashboard.cockpit',
      }),
    );

    expect(onComplete.mock.calls[0][1]).toEqual([]);
  });

  it('demo data finishes the flow outright, with items already stocked', () => {
    const onComplete = vi.fn();
    renderFlow(onComplete);
    advanceToQuickSetup();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.quickSetup.tryDemo.cockpit',
      }),
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
    const [household, items] = onComplete.mock.calls[0];
    expect(household.children).toBe(2);
    expect(items.some((i: { quantity: number }) => i.quantity > 0)).toBe(true);
  });

  it('BACK from step 2 returns to step 1', () => {
    renderFlow();
    clickContinue();
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.back.cockpit' }),
    );
    expect(
      screen.getByText('v2.onboarding.welcome.leadTitleCockpit'),
    ).toBeInTheDocument();
  });
});
